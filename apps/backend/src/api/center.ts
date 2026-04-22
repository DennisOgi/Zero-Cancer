import { zValidator } from "@hono/zod-validator";
import {
  centerStaffForgotPasswordSchema,
  centerStaffLoginSchema,
  centerStaffResetPasswordSchema,
  createCenterStaffPasswordSchema,
  getCenterByIdSchema,
  getCentersQuerySchema,
  inviteStaffSchema,
  validateStaffInviteSchema,
} from "@zerocancer/shared";
import type {
  TCenterStaffForgotPasswordResponse,
  TCenterStaffLoginResponse,
  TCenterStaffResetPasswordResponse,
  TCreateCenterStaffPasswordResponse,
  TErrorResponse,
  TGetCenterByIdResponse,
  TGetCentersResponse,
  TInviteStaffResponse,
  TValidateStaffInviteResponse,
} from "@zerocancer/shared/types";
import crypto from "crypto";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { setCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { getDB } from "../lib/db";
import { sendEmail } from "../lib/email";
import { TEnvs, THonoApp } from "../lib/types";
import { comparePassword, hashPassword } from "../lib/utils";
import { authMiddleware } from "../middleware/auth.middleware";

export const centerApp = new Hono<THonoApp>();

// GET /api/center - List centers (paginated, filtered, searched)
centerApp.get(
  "/",
  zValidator("query", getCentersQuerySchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB(c);
    const {
      page = 1,
      pageSize = 20,
      search,
      status,
      state,
      lga,
    } = c.req.valid("query");

    const where: any = {};
    if (search) {
      where.OR = [
        { centerName: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (state) where.state = state;
    if (lga) where.lga = lga;

    const [centers, total] = await Promise.all([
      db.serviceCenter.findMany({
        where,
        skip: (page! - 1) * pageSize!,
        take: pageSize!,
        orderBy: { createdAt: "desc" },
        include: {
          services: {
            select: {
              id: true,
              name: true,
              serviceCenters: { select: { amount: true } },
            },
          },
          staff: {
            select: { id: true, email: true },
          },
        },
      }),
      db.serviceCenter.count({ where }),
    ]);

    const formattedCenters = centers.map((center) => ({
      id: center.id,
      email: center.email,
      centerName: center.centerName,
      address: center.address,
      state: center.state,
      lga: center.lga,
      phone: center.phone,
      bankAccount: center.bankAccount,
      bankName: center.bankName,
      status: center.status.toString(),
      createdAt: center.createdAt.toISOString(),
      // Funding and Kit Information
      isFunded: center.isFunded || false,
      fundingSource: center.fundingSource || null,
      fundingAmount: center.fundingAmount || null,
      fundingDate: center.fundingDate ? center.fundingDate.toISOString() : null,
      fundingExpiry: center.fundingExpiry ? center.fundingExpiry.toISOString() : null,
      totalKits: center.totalKits || 0,
      usedKits: center.usedKits || 0,
      availableKits: center.availableKits || 0,
      services: center.services.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.serviceCenters?.[0]?.amount || 0, // Assuming amount is the price
      })),
      staff: center.staff,
    }));

    return c.json<TGetCentersResponse>({
      ok: true,
      data: {
        centers: formattedCenters!,
        page: page!,
        pageSize: pageSize!,
        total: total!,
        totalPages: Math.ceil(total / pageSize!),
      },
    });
  }
);

// GET /api/center/:id - Get center by ID
centerApp.get(
  "/:id",
  zValidator("param", getCenterByIdSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB(c);
    const { id } = c.req.valid("param");

    const center = await db.serviceCenter.findUnique({
      where: { id: id! },
      include: {
        services: {
          select: {
            id: true,
            name: true,
            serviceCenters: { select: { amount: true } },
          },
        },
        staff: {
          select: { id: true, email: true },
        },
      },
    });

    if (!center) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Center not found" },
        404
      );
    }

    const formattedCenter = {
      id: center.id,
      email: center.email,
      centerName: center.centerName,
      address: center.address,
      state: center.state,
      lga: center.lga,
      phone: center.phone,
      bankAccount: center.bankAccount,
      bankName: center.bankName,
      status: center.status.toString(),
      createdAt: center.createdAt.toISOString(),
      services: center.services.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.serviceCenters?.[0]?.amount || 0, // Assuming amount is the price
      })),
      staff: center.staff,
    };

    return c.json<TGetCenterByIdResponse>({
      ok: true,
      data: formattedCenter!,
    });
  }
);

// GET /api/center/staff/invite
centerApp.get("/staff/invite", authMiddleware(["center"]), async (c) => {
  const db = getDB(c);
  const centerId = c.get("jwtPayload")?.id;

  if (!centerId) {
    return c.json<TErrorResponse>(
      { ok: false, error: "Center ID not found in token" },
      400
    );
  }

  // Fetch pending invites for the center
  const invites = await db.centerStaffInvite.findMany({
    where: { centerId: centerId!, acceptedAt: null },
    select: { email: true, token: true, expiresAt: true },
  });

  // Transform Date objects to strings for JSON serialization
  const transformedInvites = invites.map((invite) => ({
    email: invite.email,
    token: invite.token,
    expiresAt: invite.expiresAt?.toISOString() || null,
  }));

  return c.json<TInviteStaffResponse>({
    ok: true,
    data: { invites: transformedInvites },
  });
});

// POST /api/center/staff/invite - Invite staff by email
centerApp.post(
  "/staff/invite",
  authMiddleware(["center"]),
  zValidator("json", inviteStaffSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB(c);
    const { centerId, emails } = c.req.valid("json");
    const invites: Array<{
      email: string;
      token: string;
      expiresAt: string | null;
    }> = [];
    for (const email of emails!) {
      // Generate a unique token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      // Store invite in DB (pseudo-code, adjust to your schema)
      await db.centerStaffInvite.create({
        data: {
          centerId: centerId!,
          email,
          token,
          expiresAt,
        },
      });
      // Send invite email
      const inviteUrl = `${
        env<{ FRONTEND_URL: string }>(c).FRONTEND_URL
      }/staff/create-new-password?token=${token}`;

      await sendEmail(c, {
        to: email!,
        subject: "You're invited to join a center on Zerocancer",
        html: `<p>You have been invited to join a center. <a href="${inviteUrl}">Click here to set your password and join.</a></p>`,
      });

      invites.push({
        email: email!,
        token: token!,
        expiresAt: expiresAt.toISOString(),
      });
    }
    return c.json<TInviteStaffResponse>({ ok: true, data: { invites } });
  }
);

// POST /api/center/staff/create-new-password - Center staff sets password using invite token
centerApp.post(
  "/staff/create-new-password",
  zValidator("json", createCenterStaffPasswordSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB(c);
    const { token, password } = c.req.valid("json");

    // Find invite
    const invite = await db.centerStaffInvite.findUnique({ where: { token } });
    if (
      !invite ||
      !!invite.acceptedAt ||
      (invite.expiresAt && new Date(invite.expiresAt) < new Date())
    ) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Invalid or expired invite token" },
        400
      );
    }
    // Hash password
    const passwordHash = await hashPassword(password!);

    // Create staff
    const staff = await db.centerStaff.create({
      data: {
        centerId: invite.centerId!,
        email: invite.email!,
        passwordHash,
        createdAt: new Date(),
      },
    });

    // Mark invite as accepted
    await db.centerStaffInvite.update({
      where: { token: token! },
      data: { acceptedAt: new Date() },
    });

    return c.json<TCreateCenterStaffPasswordResponse>({
      ok: true,
      data: { staffId: staff.id! },
    });
  }
);

// POST /api/center/staff/forgot-password - Center staff requests password reset
centerApp.post(
  "/staff/forgot-password",
  zValidator("json", centerStaffForgotPasswordSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB(c);
    const { centerId, email } = c.req.valid("json");
    // Find staff
    const staff = await db.centerStaff.findFirst({
      where: { centerId: centerId!, email: email! },
    });
    if (!staff) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Staff not found" },
        404
      );
    }
    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    // Store token (assume a CenterStaffResetToken model or similar)
    await db.centerStaffResetToken.create({
      data: {
        staffId: staff.id!,
        token: token!,
        expiresAt: expiresAt!,
      },
    });
    // Send reset email
    const resetUrl = `${
      env<{ FRONTEND_URL: string }>(c).FRONTEND_URL
    }/staff/reset-password?token=${token}`;
    await sendEmail(c, {
      to: email!,
      subject: "Reset your Zerocancer Center Staff password",
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });
    return c.json<TCenterStaffForgotPasswordResponse>({
      ok: true,
      data: { message: "Reset email sent" },
    });
  }
);

// POST /api/center/staff/reset-password - Center staff resets password using token
centerApp.post(
  "/staff/reset-password",
  zValidator("json", centerStaffResetPasswordSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB(c);
    const { token, password } = c.req.valid("json");
    // Find reset token
    const reset = await db.centerStaffResetToken.findUnique({
      where: { token: token! },
    });
    if (!reset || reset.expiresAt! < new Date()) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Invalid or expired reset token" },
        400
      );
    }
    // Hash password
    const passwordHash = await hashPassword(password!);
    // Update staff password
    await db.centerStaff.update({
      where: { id: reset.staffId! },
      data: { passwordHash },
    });
    // Invalidate token
    await db.centerStaffResetToken.delete({ where: { token: token! } });
    return c.json<TCenterStaffResetPasswordResponse>({
      ok: true,
      data: { message: "Password reset successful" },
    });
  }
);

// POST /api/center/staff/login - Center staff login
centerApp.post(
  "/staff/login",
  zValidator("json", centerStaffLoginSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const { JWT_TOKEN_SECRET } = env<TEnvs>(c);

    const db = getDB(c);
    const { centerId, email, password } = c.req.valid("json");
    // Find staff
    const staff = await db.centerStaff.findFirst({
      where: { centerId: centerId!, email: email! },
    });
    if (!staff || !staff.passwordHash) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Invalid credentials" },
        401
      );
    }
    // Compare password
    const valid = await comparePassword(password!, staff.passwordHash!);
    if (!valid) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Invalid credentials" },
        401
      );
    }

    const payload = {
      id: centerId!,
      email: email!,
      profile: staff.role === "admin" ? "CENTER" : "CENTER_STAFF",
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

    return c.json<TCenterStaffLoginResponse>({
      ok: true,
      data: {
        token,
        user: {
          userId: staff.id!,
          email: staff.email!,
          profile: "CENTER_STAFF",
          centerId: staff.centerId!,
        },
      },
    });
  }
);

// GET /api/center/staff/invite/validate/:token - Validate staff invitation token
centerApp.get(
  "/staff/invite/validate/:token",
  zValidator("param", validateStaffInviteSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB(c);
    const { token } = c.req.valid("param");

    try {
      // Find the invitation by token and include center details
      const invitation = await db.centerStaffInvite.findUnique({
        where: { token },
        include: {
          center: {
            select: {
              centerName: true,
              address: true,
            },
          },
        },
      });

      if (!invitation) {
        return c.json<TValidateStaffInviteResponse>({
          ok: true,
          data: {
            isValid: false,
            centerName: "",
            centerAddress: "",
            email: "",
            expiresAt: null,
            isExpired: false,
          },
        });
      }

      // Check if invitation has already been accepted
      if (invitation.acceptedAt) {
        return c.json<TValidateStaffInviteResponse>({
          ok: true,
          data: {
            isValid: false,
            centerName: invitation.center.centerName,
            centerAddress: invitation.center.address,
            email: invitation.email,
            expiresAt: invitation.expiresAt?.toISOString() || null,
            isExpired: false,
          },
        });
      }

      // Check if invitation has expired
      const isExpired = invitation.expiresAt
        ? new Date() > invitation.expiresAt
        : false;

      return c.json<TValidateStaffInviteResponse>({
        ok: true,
        data: {
          isValid: !isExpired,
          centerName: invitation.center.centerName,
          centerAddress: invitation.center.address,
          email: invitation.email,
          expiresAt: invitation.expiresAt?.toISOString() || null,
          isExpired,
        },
      });
    } catch (error) {
      console.error("Error validating staff invite:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Internal server error" },
        500
      );
    }
  }
);
