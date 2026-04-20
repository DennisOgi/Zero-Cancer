import { zValidator } from "@hono/zod-validator";
import {
  centerSchema,
  checkProfilesSchema,
  donorSchema,
  patientSchema,
} from "@zerocancer/shared";
import {
  TCheckProfilesResponse,
  TDonorRegisterResponse,
  TErrorResponse,
  TPatientRegisterResponse,
  TScreeningCenterRegisterResponse,
} from "@zerocancer/shared/types";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { HTTPException } from "hono/http-exception";
import { getDB } from "../lib/db";
import { sendEmail } from "../lib/email";
// import { sendEmail } from "../lib/email";
import { THonoApp } from "../lib/types";
import { getUserWithProfiles } from "../lib/utils";

export const registerApp = new Hono<THonoApp>();

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

// Patient Registration
registerApp.post(
  "/patient",
  zValidator("json", patientSchema, (result, c) => {
    if (!result.success) throw new HTTPException(400, { cause: result.error });
  }),
  async (c) => {
    const db = getDB(c);
    const data = c.req.valid("json");

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

    // if already has a profile, just update the patient profile
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
              groupId: data.groupId || null,
            },
          },
        },
        include: { patientProfile: true },
      });

      return c.json<TPatientRegisterResponse>(
        {
          ok: true,
          message: "Patient registered successfully",
          data: {
            patientId: updatedUser.id,
            email: updatedUser.email,
            fullName: updatedUser.fullName,
            phone: updatedUser.phone ?? "",
            dateOfBirth:
              updatedUser.patientProfile?.dateOfBirth instanceof Date
                ? updatedUser.patientProfile.dateOfBirth.toISOString()
                : updatedUser.patientProfile?.dateOfBirth ?? "",
            gender:
              updatedUser.patientProfile?.gender === "MALE" ||
              updatedUser.patientProfile?.gender === "FEMALE"
                ? updatedUser.patientProfile.gender
                : "MALE",
            state: updatedUser.patientProfile?.state ?? "",
            localGovernment: updatedUser.patientProfile?.city ?? "",
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
            groupId: data.groupId || null,
          },
        },
      },
      include: { patientProfile: true },
    });

    // When registering, generate and send verification email (example usage):
    const verifyToken = crypto.randomBytes(32).toString("hex");

    await db.emailVerificationToken.create({
      data: {
        userId: patient.id,
        profileType: "PATIENT",
        token: verifyToken,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    await sendEmail(c, {
      to: patient.email,
      subject: "Verify your email",
      html: `<p>Click <a href='${
        env<{ FRONTEND_URL: string }>(c).FRONTEND_URL || "http://localhost:3000"
      }/verify-email?token=${verifyToken}'>here</a> to verify your email.</p>`,
    });

    return c.json<TPatientRegisterResponse>(
      {
        ok: true,
        message: "Patient registered successfully",
        data: {
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
        },
      },
      201
    );
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

      return c.json<TDonorRegisterResponse>(
        {
          ok: true,
          message: "Patient registered successfully",
          data: {
            donorId: updatedUser.id,
            email: updatedUser.email,
            fullName: updatedUser.fullName,
            phone: updatedUser.phone ?? "",
            organization: updatedUser.donorProfile?.organizationName ?? "",
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

    // When registering, generate and send verification email (example usage):
    const verifyToken = crypto.randomBytes(32).toString("hex");

    await db.emailVerificationToken.create({
      data: {
        userId: donor.id,
        profileType: "DONOR",
        token: verifyToken,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    await sendEmail(c, {
      to: donor.email,
      subject: "Verify your email",
      html: `<p>Click <a href='${
        env<{ FRONTEND_URL: string }>(c).FRONTEND_URL || "http://localhost:3000"
      }/verify-email?token=${verifyToken}'>here</a> to verify your email.</p>`,
    });

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
    const center = await db.serviceCenter.create({
      data: {
        email: data.email!,
        passwordHash: hashedPassword!,
        centerName: data.centerName!,
        phone: data.phoneNumber!,
        address: data.address!,
        state: data.state!,
        lga: data.localGovernment!,
        bankAccount: "",
        services: {
          connect: (data.services || []).map((id: string) => ({ id })),
        },
      },
      include: { services: { select: { id: true } } },
    });

    await db.centerStaff.create({
      data: {
        centerId: center.id,
        email: data.email!,
        passwordHash: hashedPassword,
        role: "ADMIN", // Default role for the center admin
      },
    });

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
          services: center.services.map((s: { id: string }) => s.id),
        },
      },
      201
    );
  }
);
