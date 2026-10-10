import { zValidator } from "@hono/zod-validator";
import {
  centerSchema,
  checkProfilesSchema,
  donorSchema,
  patientPhotoUploadSchema,
  patientSchema,
} from "@zerocancer/shared";
import type { TRecommendedCenter } from "@zerocancer/shared/types";
import {
  TCheckProfilesResponse,
  TDonorRegisterResponse,
  TErrorResponse,
  TPatientPhotoUploadResponse,
  TPatientRegisterResponse,
  TScreeningCenterRegisterResponse,
} from "@zerocancer/shared/types";
import bcrypt from "bcryptjs";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { sign } from "hono/jwt";
import { ACCESS_TOKEN_TTL_SEC, REFRESH_TOKEN_TTL_SEC } from "../lib/auth-ttl";
import { getDB } from "../lib/db";
import { uploadBase64ImageToCloudinary, isAllowedPatientPhotoUrl } from "../lib/cloudinary-signed-upload";
import {
  assignPatientToCenter,
  findRecommendedCenters,
  pickAutoAssignedCenter,
} from "../lib/patient-center-utils";
// import { sendEmail } from "../lib/email"; // Disabled for now
import { uploadRateLimit } from "../middleware/upload-rate-limit.middleware";
import { TEnvs, THonoApp } from "../lib/types";
import { getUserWithProfiles } from "../lib/utils";
import { attachPatientToWaitingList } from "./waiting-lists";
import {
  attachBoardingInvite,
  referralCodeForBoardingInvite,
} from "./boarding";

export const registerApp = new Hono<THonoApp>();

function parseAllowedImageMimeType(fileBase64: string) {
  const match = fileBase64.match(/^data:(image\/(?:jpeg|png|webp));base64,/i);
  return match?.[1]?.toLowerCase() as
    | "image/jpeg"
    | "image/png"
    | "image/webp"
    | undefined;
}

async function issuePatientAuthTokens(
  c: any,
  patient: { id: string; email: string; fullName: string }
) {
  const { JWT_TOKEN_SECRET } = env<TEnvs>(c);
  const payload = {
    id: patient.id,
    email: patient.email,
    profile: "PATIENT" as const,
  };

  const token = await sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SEC },
    JWT_TOKEN_SECRET
  );
  const refreshToken = await sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_TTL_SEC },
    JWT_TOKEN_SECRET
  );

  setCookie(c, "refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
    maxAge: REFRESH_TOKEN_TTL_SEC,
  });

  return token;
}

async function issueDonorAuthTokens(
  c: any,
  donor: { id: string; email: string }
) {
  const { JWT_TOKEN_SECRET } = env<TEnvs>(c);
  const payload = {
    id: donor.id,
    email: donor.email,
    profile: "DONOR" as const,
  };
  const token = await sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SEC },
    JWT_TOKEN_SECRET
  );
  const refreshToken = await sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_TTL_SEC },
    JWT_TOKEN_SECRET
  );
  setCookie(c, "refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
    maxAge: REFRESH_TOKEN_TTL_SEC,
  });
  return token;
}

function formatPatientRegisterData(patient: any) {
  return {
    patientId: patient.id,
    email: patient.email,
    fullName: patient.fullName,
    phone: patient.phone ?? "",
    dateOfBirth:
      patient.patientProfile?.dateOfBirth instanceof Date
        ? patient.patientProfile.dateOfBirth.toISOString()
        : patient.patientProfile?.dateOfBirth ?? "",
    gender:
      patient.patientProfile?.gender === "MALE" ||
      patient.patientProfile?.gender === "FEMALE"
        ? patient.patientProfile.gender
        : "MALE",
    state: patient.patientProfile?.state ?? "",
    localGovernment: patient.patientProfile?.city ?? "",
    photoUrl: patient.patientProfile?.photoUrl ?? null,
  };
}

async function resolveCenterAssignment(
  c: any,
  patientId: string,
  state: string,
  localGovernment: string,
  centerId?: string,
  referralBoundCenterId?: string,
  skipAutoAssign = false
) {
  const db = getDB(c);
  const recommendedCenters = await findRecommendedCenters(
    db,
    state,
    localGovernment
  );

  let assignedCenter: TRecommendedCenter | null = null;

  // Facility invite link (?center=) — register under that health facility.
  if (centerId) {
    const assignment = await assignPatientToCenter(c, patientId, centerId, {
      skipLocationCheck: true,
      setOnboardedByCenter: true,
    });
    if ("error" in assignment) {
      console.error("[REGISTRATION] Facility invite assignment failed:", {
        patientId,
        centerId,
        error: assignment.error,
      });
    } else {
      assignedCenter = assignment.center;
    }
    return { recommendedCenters, assignedCenter };
  }

  const boundId = referralBoundCenterId || undefined;
  if (boundId) {
    const assignment = await assignPatientToCenter(c, patientId, boundId, {
      skipLocationCheck: true,
    });
    if ("error" in assignment) {
      console.error("[REGISTRATION] Referral center assignment failed:", {
        patientId,
        boundId,
        error: assignment.error,
      });
    } else {
      assignedCenter = assignment.center;
    }
    return { recommendedCenters, assignedCenter };
  }

  if (skipAutoAssign) {
    return { recommendedCenters, assignedCenter };
  }

  let selectedCenterId = pickAutoAssignedCenter(recommendedCenters)?.id;

  if (selectedCenterId) {
    const assignment = await assignPatientToCenter(c, patientId, selectedCenterId);
    if ("error" in assignment) {
      console.error("[REGISTRATION] Center assignment failed:", {
        patientId,
        selectedCenterId,
        error: assignment.error,
      });
    } else {
      assignedCenter = assignment.center;
    }
  }

  return { recommendedCenters, assignedCenter };
}

async function applyReferralCode(
  c: any,
  userId: string,
  referralCode?: string | null,
  preferredCenterId?: string | null
) {
  if (!referralCode?.trim()) return;
  try {
    const { getStaffByReferralCode, acceptStaffReferral } = await import(
      "../lib/staff-referral.service"
    );
    const staffHit = await getStaffByReferralCode(c, referralCode);
    if (staffHit?.staff) {
      await acceptStaffReferral(c, userId, referralCode);
      return;
    }
    const { acceptReferralInvite } = await import("../lib/agent.service");
    await acceptReferralInvite(c, userId, referralCode, {
      preferredCenterId: preferredCenterId || undefined,
    });
  } catch (error) {
    console.warn("[PATIENT_REG] Referral code not applied:", error);
  }
}

async function peekReferralBoundCenterId(
  c: any,
  referralCode?: string | null
) {
  if (!referralCode?.trim()) return null;
  try {
    const { getStaffByReferralCode } = await import(
      "../lib/staff-referral.service"
    );
    const staffHit = await getStaffByReferralCode(c, referralCode);
    if (staffHit?.staff) return null;
    const { peekReferralInvite } = await import("../lib/agent.service");
    const peeked = await peekReferralInvite(c, referralCode);
    return (
      peeked?.boundCenter?.id || peeked?.referral?.preferredCenterId || null
    );
  } catch {
    return null;
  }
}

async function finishPatientOnboarding(
  c: any,
  userId: string,
  data: {
    listToken?: string;
    inviteToken?: string;
    referralCode?: string;
    centerId?: string;
    state: string;
    localGovernment: string;
  }
) {
  await attachPatientToWaitingList(c, userId, data.listToken);
  const boarding = await attachBoardingInvite(
    c,
    userId,
    data.inviteToken,
    "PATIENT"
  );
  const boardingReferral = await referralCodeForBoardingInvite(c, boarding);
  const referralCode = data.referralCode || boardingReferral || undefined;
  const skipAutoAssign = Boolean(
    boarding?.type === "SCREEN" && !data.centerId
  );
  const boundCenterId = skipAutoAssign
    ? null
    : await peekReferralBoundCenterId(c, referralCode);
  const { recommendedCenters, assignedCenter } = await resolveCenterAssignment(
    c,
    userId,
    data.state,
    data.localGovernment,
    data.centerId,
    boundCenterId || undefined,
    skipAutoAssign
  );
  await applyReferralCode(
    c,
    userId,
    referralCode,
    assignedCenter?.id || boundCenterId
  );
  return {
    recommendedCenters,
    assignedCenter,
    needsFacilityChoice: skipAutoAssign && !assignedCenter,
  };
}

registerApp.post(
  "/check-profiles",
  zValidator("json", checkProfilesSchema, (result) => {
    if (!result.success) throw new HTTPException(400, { cause: result.error });
  }),
  async (c) => {
    const { profiles } = await getUserWithProfiles(c, {
      email: c.req.valid("json").email!,
    });
    return c.json<TCheckProfilesResponse>({
      ok: true,
      message: "Profiles retrieved successfully",
      data: { profiles },
    });
  }
);

// POST /api/register/patient-photo - Upload patient profile photo
registerApp.post(
  "/patient-photo",
  uploadRateLimit,
  zValidator("json", patientPhotoUploadSchema, (result) => {
    if (!result.success) throw new HTTPException(400, { cause: result.error });
  }),
  async (c) => {
    try {
      const {
        CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET,
      } = env<TEnvs>(c);
      const { fileBase64, fileName, mimeType } = c.req.valid("json");

      const detectedMime = parseAllowedImageMimeType(fileBase64);
      if (fileBase64.startsWith("data:") && !detectedMime) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Only JPG, PNG, or WEBP images are allowed." },
          400
        );
      }
      if (detectedMime && detectedMime !== mimeType) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Image type does not match file contents." },
          400
        );
      }

      const normalizedBase64 = fileBase64.startsWith("data:")
        ? fileBase64
        : `data:${mimeType};base64,${fileBase64}`;

      const estimatedBytes = Math.ceil(
        (normalizedBase64.length - normalizedBase64.indexOf(",") - 1) * 0.75
      );
      if (estimatedBytes > 5 * 1024 * 1024) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Photo must be 5MB or smaller." },
          400
        );
      }

      const safeName = fileName.replace(/[^\w.-]+/g, "_").slice(0, 80);
      const uploaded = await uploadBase64ImageToCloudinary({
        cloudName: CLOUDINARY_CLOUD_NAME,
        apiKey: CLOUDINARY_API_KEY,
        apiSecret: CLOUDINARY_API_SECRET,
        fileBase64: normalizedBase64,
        folder: "patient-photos",
        publicId: `patient-photos/${Date.now()}-${safeName.replace(/\.[^.]+$/, "")}`,
      });

      return c.json<TPatientPhotoUploadResponse>({
        ok: true,
        message: "Photo uploaded successfully",
        data: {
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
        },
      });
    } catch (error) {
      console.error("[PATIENT_PHOTO] Upload error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to upload patient photo";
      const status = message.includes("not configured") ? 503 : 500;
      return c.json<TErrorResponse>({ ok: false, error: message }, status);
    }
  }
);

// Patient Registration
registerApp.post(
  "/patient",
  zValidator("json", patientSchema, (result, c) => {
    if (!result.success) throw new HTTPException(400, { cause: result.error });
  }),
  async (c) => {
    try {
      const db = getDB(c);
      const data = c.req.valid("json");
      const { CLOUDINARY_CLOUD_NAME } = env<TEnvs>(c);

      if (
        data.photoUrl &&
        !isAllowedPatientPhotoUrl(data.photoUrl, CLOUDINARY_CLOUD_NAME)
      ) {
        return c.json<TErrorResponse>(
          {
            ok: false,
            err_code: "invalid_photo_url",
            error: "Profile photo must be uploaded through the app.",
          },
          400
        );
      }

      // Concurrently check if user exists and if center with same email exists
      const [userResult, existingCenter] = await Promise.all([
        getUserWithProfiles(c, { email: data.email! }),
        db.serviceCenter.findUnique({ where: { email: data.email! } }),
      ]);

    if (existingCenter)
      return c.json<TErrorResponse>(
        {
          ok: false,
          err_code: "center_already_registered",
          error: "Email already registered to a center",
        },
        409
      );

    const { user: existingUser, profiles } = userResult;

    if (profiles.includes("PATIENT")) {
      return c.json<TErrorResponse>(
        {
          ok: false,
          err_code: "patient_already_registered",
          error: "Email already registered",
        },
        409
      );
    }

    // Donor adding a patient profile on the same account
    if (profiles.includes("DONOR")) {
      const updatedUser = await db.user.update({
        where: { id: existingUser?.id },
        data: {
          patientProfile: {
            create: {
              gender: data.gender as "MALE" | "FEMALE",
              dateOfBirth: data.dateOfBirth!,
              city: data.localGovernment!,
              state: data.state!,
              associationId: data.associationId || null,
              groupId: null,
              photoUrl: data.photoUrl || null,
            },
          },
        },
        include: { patientProfile: true },
      });

      const onboarded = await finishPatientOnboarding(c, updatedUser.id, {
        listToken: data.listToken,
        inviteToken: data.inviteToken,
        referralCode: data.referralCode,
        centerId: data.centerId,
        state: data.state!,
        localGovernment: data.localGovernment!,
      });
      const token = await issuePatientAuthTokens(c, updatedUser);

      return c.json<TPatientRegisterResponse>(
        {
          ok: true,
          message: "Patient registered successfully",
          data: {
            ...formatPatientRegisterData(updatedUser),
            token,
            recommendedCenters: onboarded.recommendedCenters,
            assignedCenter: onboarded.assignedCenter,
            needsFacilityChoice: onboarded.needsFacilityChoice,
          },
        },
        201
      );
    }

    //  if user already exists with the same email & wasn't planning on creating a new profile
    // (i.e. not a donor or center), return an error
    if (existingUser)
      return c.json<TErrorResponse>(
        {
          ok: false,
          err_code: "patient_already_registered",
          error: "Email already registered",
        },
        409
      );

      const hashedPassword = await bcrypt.hash(data.password!, 10);
      
      const patient = await db.user.create({
        data: {
          fullName: data.fullName!,
          email: data.email!,
          phone: data.phone!,
          passwordHash: hashedPassword,
          patientProfile: {
            create: {
              gender: data.gender!,
              dateOfBirth: data.dateOfBirth!,
              city: data.localGovernment!,
              state: data.state!,
              associationId: data.associationId || null,
              groupId: null,
              photoUrl: data.photoUrl || null,
            },
          },
        },
        include: { patientProfile: true },
      });

      const onboarded = await finishPatientOnboarding(c, patient.id, {
        listToken: data.listToken,
        inviteToken: data.inviteToken,
        referralCode: data.referralCode,
        centerId: data.centerId,
        state: data.state!,
        localGovernment: data.localGovernment!,
      });
      const token = await issuePatientAuthTokens(c, patient);

      return c.json<TPatientRegisterResponse>(
        {
          ok: true,
          message: "Patient registered successfully",
          data: {
            ...formatPatientRegisterData(patient),
            token,
            recommendedCenters: onboarded.recommendedCenters,
            assignedCenter: onboarded.assignedCenter,
            needsFacilityChoice: onboarded.needsFacilityChoice,
          },
        },
        201
      );
    } catch (error) {
      console.error('[PATIENT_REG] Registration error:', error instanceof Error ? error.message : 'Unknown error');
      
      throw new HTTPException(500, { 
        message: error instanceof Error ? error.message : 'Unknown error during registration',
        cause: error 
      });
    }
  }
);

// Donor Registration
registerApp.post(
  "/donor",
  zValidator("json", donorSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>(
        {
          ok: false,
          err_code: "invalid_donor_data",
          error: result.error,
        },
        400
      );
  }),
  async (c) => {
    const db = getDB(c);
    const data = c.req.valid("json");

    const { user: existingUser, profiles } = await getUserWithProfiles(c, {
      email: data.email!,
    });

    // if already has a profile, just update the donor profile
    if (profiles.includes("PATIENT")) {
      const updatedUser = await db.user.update({
        where: { id: existingUser?.id },
        data: {
          donorProfile: {
            create: {
              organizationName: data.organization || "",
            },
          },
        },
        include: { donorProfile: true },
      });

      await attachBoardingInvite(c, updatedUser.id, data.inviteToken, "DONOR");
      const token = data.inviteToken
        ? await issueDonorAuthTokens(c, updatedUser)
        : undefined;

      return c.json<TDonorRegisterResponse>(
        {
          ok: true,
          message: "Donor registered successfully",
          data: {
            donorId: updatedUser.id,
            email: updatedUser.email,
            fullName: updatedUser.fullName,
            phone: updatedUser.phone ?? "",
            organization: updatedUser.donorProfile?.organizationName ?? "",
            token,
          },
        },
        201
      );
    }
    // const existingUser = await db.user.findUnique({ where: { email: data.email } });
    if (existingUser)
      return c.json<TErrorResponse>(
        {
          ok: false,
          err_code: "donor_already_registered",
          error: "Email already registered",
        },
        409
      );
    const hashedPassword = await bcrypt.hash(data.password!, 10);
    const donor = await db.user.create({
      data: {
        fullName: data.fullName!,
        email: data.email!,
        passwordHash: hashedPassword,
        phone: data.phone!,
        donorProfile: {
          create: {
            organizationName: data.organization! || "",
          },
        },
      },
      include: { donorProfile: true },
    });

    await attachBoardingInvite(c, donor.id, data.inviteToken, "DONOR");
    const token = data.inviteToken
      ? await issueDonorAuthTokens(c, donor)
      : undefined;

    return c.json<TDonorRegisterResponse>(
      {
        ok: true,
        message: "Donor registered successfully",
        data: {
          donorId: donor.id,
          email: donor.email,
          fullName: donor.fullName,
          phone: donor.phone ?? "",
          organization: donor.donorProfile?.organizationName ?? "",
          token,
        },
      },
      201
    );
  }
);

// Center Registration
registerApp.post(
  "/center",
  zValidator("json", centerSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>(
        {
          ok: false,
          err_code: "invalid_center_data",
          error: result.error,
        },
        400
      );
  }),
  async (c) => {
    try {
      const db = getDB(c);
      const data = c.req.valid("json");
      const existingUser = await db.serviceCenter.findUnique({
        where: { email: data.email! },
      });
      if (existingUser)
        return c.json<TErrorResponse>(
          {
            ok: false,
            err_code: "center_already_registered",
            error: "Email already registered",
          },
          409
        );
      const hashedPassword = await bcrypt.hash(data.password!, 10);
      const serviceIds = (data.services || []).filter(Boolean);
      const center = await db.serviceCenter.create({
        data: {
          email: data.email!,
          passwordHash: hashedPassword!,
          centerName: data.centerName!,
          phone: data.phoneNumber!,
          whatsappNumber: data.phoneNumber!,
          address: data.address!,
          state: data.state!,
          lga: data.localGovernment!,
          bankAccount: "",
          services: {
            connect: serviceIds.map((id: string) => ({ id })),
          },
        },
        include: { services: { select: { id: true } } },
      });

      try {
        await db.centerStaff.create({
          data: {
            centerId: center.id,
            email: data.email!,
            passwordHash: hashedPassword,
            role: "ADMIN",
            fullName: data.centerName!,
            status: "ACTIVE",
          },
        });
      } catch (staffError) {
        console.error("[CENTER_REG] Owner staff create failed:", staffError);
      }

      return c.json<TScreeningCenterRegisterResponse>(
        {
          ok: true,
          message: "Center registered successfully",
          data: {
            centerId: center.id,
            centerName: center.centerName,
            email: center.email,
            phoneNumber: center.phone ?? "",
            address: center.address,
            state: center.state,
            localGovernment: center.lga,
            services: serviceIds,
          },
        },
        201
      );
    } catch (error) {
      console.error(
        "[CENTER_REG] Registration error:",
        error instanceof Error ? error.message : error
      );
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error during registration";
      return c.json<TErrorResponse>(
        { ok: false, error: message },
        500
      );
    }
  }
);
