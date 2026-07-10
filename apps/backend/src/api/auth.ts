import { zValidator } from "@hono/zod-validator";
import {
  actorSchema,
  changePasswordSchema,
  loginSchema,
  updatePatientProfileSchema,
  assignPatientCenterSchema,
} from "@zerocancer/shared";
import type {
  TAssignPatientCenterResponse,
  TAuthMeResponse,
  TErrorResponse,
  TGetRecommendedCentersResponse,
  TUpdatePatientProfileResponse,
  TForgotPasswordResponse,
  TLoginResponse,
  TLogoutResponse,
  TRefreshTokenResponse,
  TResendVerificationResponse,
  TResetPasswordResponse,
  TVerifyEmailResponse,
} from "@zerocancer/shared/types";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { getCookie, setCookie } from "hono/cookie";
import { jwt, sign, verify } from "hono/jwt";
import { getDB } from "../lib/db";
import { sendEmail } from "../lib/email";
import { normalizeEmail } from "../lib/email-normalize";
import { assignPatientToCenter, findRecommendedCenters } from "../lib/patient-center-utils";
import { isAllowedPatientPhotoUrl } from "../lib/cloudinary-signed-upload";
import { TEnvs, THonoApp } from "../lib/types";
import { getUserWithProfiles } from "../lib/utils";
import { z } from "zod";

export const authApp = new Hono<THonoApp>();

// POST /api/auth/login?actor=patient|donor|center
authApp.post(
  "/login",
  zValidator("json", loginSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>(
        {
          ok: false,
          err_code: "invalid_credentials" as const,
          error: result.error!,
        },
        400
      );
  }),
  zValidator("query", z.object({ actor: actorSchema }), (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>(
        {
          ok: false,
          err_code: "invalid_actor" as const,
          error:
            "Actor type is required and must be one of: patient, donor, center.",
        },
        400
      );
  }),
  async (c) => {
    try {
      const { JWT_TOKEN_SECRET } = env<TEnvs>(c);
      const db = getDB(c);

      const { email, password } = c.req.valid("json");
      const { actor } = c.req.valid("query");
      const normalizedEmail = normalizeEmail(email!);

      let user: any = null;
      let passwordHash = "";
      let id = "";

      if (actor === "center") {
        user = await db.serviceCenter.findUnique({
          where: { email: normalizedEmail },
        });
        passwordHash = user?.passwordHash!;
        id = user?.id!;
      } else {
        let { user: justUser, profiles: userProfiles } =
          await getUserWithProfiles(c, {
            email: normalizedEmail,
          });

        user = { ...justUser, profiles: userProfiles };

        if (!justUser) {
          return c.json<TErrorResponse>(
            {
              ok: false,
              err_code: "user_not_found",
              error: "User not found.",
            },
            404
          );
        }

        if (!userProfiles.includes(actor.toUpperCase() as "PATIENT" | "DONOR")) {
          return c.json<TErrorResponse>(
            {
              ok: false,
              err_code: "invalid_credentials",
              error: "Invalid email or password.",
            },
            400
          );
        }

        passwordHash = user.passwordHash!;
        id = user.id!;
      }

      // If user not found or password doesn't match
      if (!user || !(await bcrypt.compare(password!, passwordHash!))) {
        return c.json<TErrorResponse>(
          {
            ok: false,
            err_code: "invalid_credentials",
            error: `Invalid ${actor} email or password.`,
          },
          400
        );
      }

      const authProfile =
        actor === "center"
          ? "CENTER"
          : user.profiles.includes(actor.toUpperCase())
          ? actor.toUpperCase()
          : user.profiles[0]; // Use first profile for non-center actors

      const payload = {
        id: id!,
        email: user.email!,
        profile: authProfile,
      };

      const token = await sign(
        { ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 5 },
        JWT_TOKEN_SECRET
      );
      const refreshToken = await sign(
        { ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
        JWT_TOKEN_SECRET
      ); // 7 days

      // Set refresh token as httpOnly, secure cookie using Hono's setCookie
      setCookie(c, "refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      });

      return c.json<TLoginResponse>({
        ok: true,
        data: {
          token,
          user: {
            userId: id!,
            fullName: user.fullName!,
            email: user.email!,
            profile: payload.profile,
          },
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return c.json<TErrorResponse>(
        {
          ok: false,
          err_code: "internal_error",
          error: "Database connection failed. Please try again later.",
        },
        500
      );
    }
  }
);

// GET /api/auth/me (protected)
authApp.get(
  "/me",
  (c, next) => {
    const { JWT_TOKEN_SECRET } = env<TEnvs>(c);

    const jwtMiddleware = jwt({
      secret: JWT_TOKEN_SECRET,
    });

    return jwtMiddleware(c, next);
  },
  async (c) => {
    const jwtPayload = c.get("jwtPayload");
    const db = getDB(c);

    if (jwtPayload.profile === "ADMIN") {
      // Fetch admin data from database
      const admin = await db.admins.findUnique({
        where: { id: jwtPayload.id! },
        select: { id: true, fullName: true, email: true },
      });

      if (!admin) {
        return c.json<TErrorResponse>(
          {
            ok: false,
            error: "Admin not found",
          },
          404
        );
      }

      return c.json<TAuthMeResponse>({
        ok: true,
        data: {
          user: {
            id: admin.id!,
            fullName: admin.fullName!,
            email: admin.email!,
            profile: jwtPayload.profile,
          },
        },
      });
    }

    if (
      jwtPayload.profile === "CENTER" ||
      jwtPayload.profile === "CENTER_STAFF"
    ) {
      const center = await db.serviceCenter.findUnique({
        where: { id: jwtPayload.id! },
        select: { id: true, centerName: true, email: true, status: true },
      });
      if (!center) {
        return c.json<TErrorResponse>(
          {
            ok: false,
            error: "Center not found",
          },
          404
        );
      }

      return c.json<TAuthMeResponse>({
        ok: true,
        data: {
          user: {
            id: center.id!,
            fullName: center.centerName!,
            email: center.email!,
            profile: jwtPayload.profile,
          },
        },
      });
    }
    const user = await db.user.findUnique({
      where: { id: jwtPayload.id! },
      include:
        jwtPayload.profile === "PATIENT" ? { patientProfile: true } : undefined,
    });

    if (!user) {
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "User not found",
        },
        404
      );
    }

    const patientProfile = user.patientProfile;
    let gender: "MALE" | "FEMALE" | undefined;
    if (
      patientProfile?.gender === "MALE" ||
      patientProfile?.gender === "FEMALE"
    ) {
      gender = patientProfile.gender;
    }

    let assignedCenter: {
      id: string;
      centerName: string;
      address: string;
      state: string;
      lga: string;
    } | null = null;

    if (jwtPayload.profile === "PATIENT" && patientProfile?.assignedCenterId) {
      const center = await db.serviceCenter.findUnique({
        where: { id: patientProfile.assignedCenterId },
      });
      if (center) {
        assignedCenter = {
          id: center.id,
          centerName: center.centerName,
          address: center.address,
          state: center.state,
          lga: center.lga,
        };
      }
    }

    return c.json<TAuthMeResponse>({
      ok: true,
      data: {
        user: {
          id: user.id!,
          fullName: user.fullName!,
          email: user.email!,
          profile: jwtPayload.profile,
          ...(gender ? { gender } : {}),
          ...(jwtPayload.profile === "PATIENT"
            ? {
                phone: user.phone ?? "",
                dateOfBirth: patientProfile?.dateOfBirth
                  ? String(patientProfile.dateOfBirth).split("T")[0]
                  : "",
                state: patientProfile?.state ?? "",
                localGovernment: patientProfile?.city ?? "",
                photoUrl: patientProfile?.photoUrl ?? null,
                assignedCenterId: patientProfile?.assignedCenterId ?? null,
                assignedCenter,
                mustChangePassword: Boolean(patientProfile?.mustChangePassword),
              }
            : {}),
        },
      },
    });
  }
);

// PATCH /api/auth/patient-profile - Update patient contact and location
authApp.patch(
  "/patient-profile",
  (c, next) => {
    const { JWT_TOKEN_SECRET } = env<TEnvs>(c);
    const jwtMiddleware = jwt({ secret: JWT_TOKEN_SECRET });
    return jwtMiddleware(c, next);
  },
  zValidator("json", updatePatientProfileSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const jwtPayload = c.get("jwtPayload");
    if (!jwtPayload || jwtPayload.profile !== "PATIENT") {
      return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 403);
    }

    const db = getDB(c);
    const data = c.req.valid("json");
    const { CLOUDINARY_CLOUD_NAME } = env<TEnvs>(c);

    if (
      data.photoUrl &&
      !isAllowedPatientPhotoUrl(data.photoUrl, CLOUDINARY_CLOUD_NAME)
    ) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Profile photo must be uploaded through the app." },
        400
      );
    }

    await db.user.update({
      where: { id: jwtPayload.id! },
      data: { phone: data.phone },
    });

    await db.patientProfile.update({
      where: { userId: jwtPayload.id! },
      data: {
        state: data.state,
        city: data.localGovernment,
        ...(data.gender ? { gender: data.gender } : {}),
        ...(data.photoUrl !== undefined ? { photoUrl: data.photoUrl || null } : {}),
      },
    });

    return c.json<TUpdatePatientProfileResponse>({
      ok: true,
      data: {
        phone: data.phone,
        state: data.state,
        localGovernment: data.localGovernment,
      },
    });
  }
);

// POST /api/auth/change-password — authenticated password update
authApp.post(
  "/change-password",
  (c, next) => {
    const { JWT_TOKEN_SECRET } = env<TEnvs>(c);
    const jwtMiddleware = jwt({ secret: JWT_TOKEN_SECRET });
    return jwtMiddleware(c, next);
  },
  zValidator("json", changePasswordSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    try {
      const jwtPayload = c.get("jwtPayload");
      if (!jwtPayload?.id) {
        return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 403);
      }

      if (
        jwtPayload.profile !== "PATIENT" &&
        jwtPayload.profile !== "DONOR"
      ) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Password change is only available for patient and donor accounts" },
          403
        );
      }

      const db = getDB(c);
      const { currentPassword, newPassword } = c.req.valid("json");
      const user = await db.user.findUnique({ where: { id: jwtPayload.id } });

      if (!user?.passwordHash) {
        return c.json<TErrorResponse>(
          { ok: false, error: "User not found" },
          404
        );
      }

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Current password is incorrect" },
          400
        );
      }

      const hash = await bcrypt.hash(newPassword, 10);
      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: hash },
      });

      if (jwtPayload.profile === "PATIENT") {
        await db.patientProfile
          .update({
            where: { userId: user.id },
            data: { mustChangePassword: false },
          })
          .catch(() => undefined);
      }

      return c.json({
        ok: true,
        message: "Password updated successfully",
        data: { mustChangePassword: false },
      });
    } catch (error) {
      console.error("Change password error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to change password" },
        500
      );
    }
  }
);

// GET /api/auth/patient/recommended-centers
authApp.get(
  "/patient/recommended-centers",
  (c, next) => {
    const { JWT_TOKEN_SECRET } = env<TEnvs>(c);
    const jwtMiddleware = jwt({ secret: JWT_TOKEN_SECRET });
    return jwtMiddleware(c, next);
  },
  async (c) => {
    const jwtPayload = c.get("jwtPayload");
    if (!jwtPayload || jwtPayload.profile !== "PATIENT") {
      return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 403);
    }

    const db = getDB(c);
    const profile = await db.patientProfile.findUnique({
      where: { userId: jwtPayload.id! },
    });

    if (!profile?.state || !profile?.city) {
      return c.json<TGetRecommendedCentersResponse>({
        ok: true,
        data: { recommendedCenters: [] },
      });
    }

    const recommendedCenters = await findRecommendedCenters(
      db,
      profile.state,
      profile.city
    );

    return c.json<TGetRecommendedCentersResponse>({
      ok: true,
      data: { recommendedCenters },
    });
  }
);

// POST /api/auth/patient/assign-center - Link patient to nearest chosen center
authApp.post(
  "/patient/assign-center",
  (c, next) => {
    const { JWT_TOKEN_SECRET } = env<TEnvs>(c);
    const jwtMiddleware = jwt({ secret: JWT_TOKEN_SECRET });
    return jwtMiddleware(c, next);
  },
  zValidator("json", assignPatientCenterSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const jwtPayload = c.get("jwtPayload");
    if (!jwtPayload || jwtPayload.profile !== "PATIENT") {
      return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 403);
    }

    const { centerId } = c.req.valid("json");
    const assignment = await assignPatientToCenter(c, jwtPayload.id!, centerId);

    if ("error" in assignment) {
      return c.json<TErrorResponse>({ ok: false, error: assignment.error }, 400);
    }

    return c.json<TAssignPatientCenterResponse>({
      ok: true,
      message: "Center assigned successfully",
      data: {
        center: assignment.center,
        enrolledCount: assignment.enrolledCount,
      },
    });
  }
);

// POST /api/auth/refresh
authApp.post("/refresh", async (c) => {
  const { JWT_TOKEN_SECRET } = env<TEnvs>(c);
  const query = c.req.query();
  // Get refresh token from cookie using Hono's getCookie
  const refreshToken = getCookie(c, "refreshToken");
  if (!refreshToken) {
    return c.json<TErrorResponse>(
      {
        ok: false,
        err_code: "missing_refresh_token",
        error: "No refresh token provided.",
      },
      403
    );
  } else if (query?.retry) {
    // Retrying from a refresh token request that failed (401)
    return c.json<TErrorResponse>(
      {
        ok: false,
        err_code: "no_session",
        error: "No session found",
      },
      403
    );
  }
  // else {
  //   return c.json<TErrorResponse>(
  //     {
  //       ok: false,
  //       err_code: "refresh_token_expired",
  //       error: "Refresh token expired or not found for this user",
  //     },
  //     401
  //   );
  // }

  try {
    const payload = await verify(refreshToken, JWT_TOKEN_SECRET);
    // Optionally check if token is revoked/expired in DB
    const newAccessToken = await sign(
      {
        id: payload.id!,
        email: payload.email!,
        profile: payload.profile!,
        exp: Math.floor(Date.now() / 1000) + 60 * 5,
      },
      JWT_TOKEN_SECRET
    );

    const newRefreshToken = await sign(
      {
        id: payload.id!,
        email: payload.email!,
        profile: payload.profile!,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      },
      JWT_TOKEN_SECRET
    );

    // Set new refresh token as httpOnly, secure cookie using Hono's setCookie
    setCookie(c, "refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    });

    return c.json<TRefreshTokenResponse>({
      ok: true,
      data: {
        token: newAccessToken,
      },
    });
  } catch (err) {
    return c.json<TErrorResponse>(
      {
        ok: false,
        err_code: "invalid_refresh_token",
        error: "Refresh token is invalid or expired.",
      },
      401
    );
  }
});

// POST /api/auth/logout
authApp.post("/logout", async (c) => {
  // Clear the refresh token cookie using Hono's setCookie
  setCookie(c, "refreshToken", "", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
    maxAge: 0,
  });
  // If storing refresh tokens in DB, mark as revoked
  return c.json<TLogoutResponse>({
    ok: true,
    data: { message: "Logged out successfully." },
  });
});

// POST /api/auth/forgot-password
// Accepts { email } and sends a reset link if user exists
authApp.post("/forgot-password", async (c) => {
  const db = getDB(c);
  const body = await c.req.json();
  const email = normalizeEmail(String(body.email || ""));
  // Find user by email
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    // For security, always return success
    return c.json<TForgotPasswordResponse>({ ok: true, data: {} });
  }
  // Generate token and expiry
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 min
  await db.passwordResetToken.create({
    data: { userId: user.id!, token, expiresAt: expires },
  });
  // Send email
  const resetUrl = `${
    env<{ FRONTEND_URL: string }>(c).FRONTEND_URL || "http://localhost:3000"
  }/reset-password?token=${token}`;
  await sendEmail(c, {
    to: email,
    subject: "Reset your password",
    html: `<p>Click <a href='${resetUrl}'>here</a> to reset your password. This link expires in 30 minutes.</p>`,
  });
  return c.json<TForgotPasswordResponse>({ ok: true, data: {} });
});

// POST /api/auth/reset-password
// Accepts { token, password }
authApp.post("/reset-password", async (c) => {
  const db = getDB(c);
  const { token, password } = await c.req.json();
  const reset = await db.passwordResetToken.findUnique({ where: { token } });
  if (!reset || reset.expiresAt < new Date()) {
    return c.json<TErrorResponse>(
      { ok: false, error: "Invalid or expired token." },
      400
    );
  }
  const hash = await bcrypt.hash(password, 10);
  await db.user.update({
    where: { id: reset.userId! },
    data: { passwordHash: hash },
  });
  await db.patientProfile
    .update({
      where: { userId: reset.userId! },
      data: { mustChangePassword: false },
    })
    .catch(() => undefined);
  await db.passwordResetToken.delete({ where: { token } });
  return c.json<TResetPasswordResponse>({ ok: true, data: {} });
});

// POST /api/auth/verify-email
// Accepts { token }
authApp.post("/verify-email", async (c) => {
  const db = getDB(c);
  const { token } = await c.req.json();
  const verify = await db.emailVerificationToken.findUnique({
    where: { token },
  });
  if (!verify || verify.expiresAt < new Date()) {
    return c.json<TErrorResponse>(
      { ok: false, error: "Invalid or expired token." },
      400
    );
  }

  // profile to be verified
  if (verify.profileType !== "PATIENT" && verify.profileType !== "DONOR") {
    return c.json<TErrorResponse>(
      {
        ok: false,
        error: "Invalid profile type for email verification.",
      },
      400
    );
  }

  const dbProfile =
    verify.profileType === "PATIENT" ? "patientProfile" : "donorProfile";

  await db.user.update({
    where: { id: verify.userId! },
    data: {
      [dbProfile]: {
        update: { emailVerified: new Date() },
      },
    },
  });
  // "NOTE TO SELF: This is not working as expected.
  await db.emailVerificationToken.delete({ where: { token } });
  return c.json<TVerifyEmailResponse>({ ok: true, data: {} });
});

// POST /api/auth/resend-verification
// Accepts { email, profileType }
authApp.post("/resend-verification", async (c) => {
  const db = getDB(c);
  const { email, profileType } = await c.req.json();
  // Find user by email
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    // For security, always return success
    return c.json<TResendVerificationResponse>({ ok: true, data: {} });
  }
  // Check if already verified
  let alreadyVerified = false;
  if (profileType === "PATIENT") {
    const patient = await db.patientProfile.findUnique({
      where: { userId: user.id! },
    });
    alreadyVerified = !!patient?.emailVerified;
  } else if (profileType === "DONOR") {
    const donor = await db.donorProfile.findUnique({
      where: { userId: user.id! },
    });
    alreadyVerified = !!donor?.emailVerified;
  }
  if (alreadyVerified) {
    return c.json<TResendVerificationResponse>({
      ok: true,
      data: { message: "Already verified." },
    });
  }
  // Generate and send new verification token
  const verifyToken = crypto.randomBytes(32).toString("hex");
  await db.emailVerificationToken.create({
    data: {
      userId: user.id!,
      profileType,
      token: verifyToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });
  await sendEmail(c, {
    to: user.email!,
    subject: "Verify your email",
    html: `<p>Click <a href='${
      env<{ FRONTEND_URL: string }>(c).FRONTEND_URL || "http://localhost:3000"
    }/verify-email?token=${verifyToken}'>here</a> to verify your email.</p>`,
  });
  return c.json<TResendVerificationResponse>({ ok: true, data: {} });
});
