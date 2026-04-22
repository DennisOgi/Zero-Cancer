import { zValidator } from "@hono/zod-validator";
import { actorSchema, loginSchema } from "@zerocancer/shared";
import type {
  TAuthMeResponse,
  TErrorResponse,
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

      let user: any = null;
      let passwordHash = "";
      let id = "";

      if (actor === "center") {
        user = await db.serviceCenter.findUnique({ where: { email: email! } });
        passwordHash = user?.passwordHash!;
        id = user?.id!;
      } else {
        let { user: justUser, profiles: userProfiles } =
          await getUserWithProfiles(c, {
            email: email!,
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

        if (
          justUser.donorProfile?.emailVerified === null ||
          justUser.patientProfile?.emailVerified === null
        ) {
          return c.json<TErrorResponse>(
            {
              ok: false,
              err_code: "email_not_verified",
              error: "Email not verified. Please verify your email first.",
            },
            403
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

    console.log("JWT Payload:", jwtPayload);

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
    // Fetch user data from database to get full name
    const user = await db.user.findUnique({
      where: { id: jwtPayload.id! },
      select: { id: true, fullName: true, email: true },
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

    return c.json<TAuthMeResponse>({
      ok: true,
      data: {
        user: {
          id: user.id!,
          fullName: user.fullName!,
          email: user.email!,
          profile: jwtPayload.profile,
        },
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
  const { email } = await c.req.json();
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
