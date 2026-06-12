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
import { sign, verify } from "hono/jwt";
import { getDB } from "../lib/db";
import { sendEmail } from "../lib/email";
import type { ServiceTypeKey } from "../lib/service-type-utils";
import { getSupabaseClient } from "../lib/supabase";
import { TEnvs, THonoApp } from "../lib/types";
import { comparePassword, hashPassword } from "../lib/utils";
import { authMiddleware } from "../middleware/auth.middleware";

export const centerApp = new Hono<THonoApp>();

// GET /api/center - List centers (paginated, filtered, searched)
centerApp.get("/", async (c) => {
    const db = getDB(c);
    const queryParse = getCentersQuerySchema.safeParse({
      page: c.req.query("page"),
      pageSize: c.req.query("pageSize"),
      search: c.req.query("search"),
      status: c.req.query("status"),
      state: c.req.query("state"),
      lga: c.req.query("lga"),
      serviceType: c.req.query("serviceType"),
    });

    if (!queryParse.success) {
      return c.json<TErrorResponse>(
        { ok: false, error: queryParse.error.flatten() },
        400
      );
    }

    const {
      page = 1,
      pageSize = 20,
      search,
      status,
      state,
      lga,
      serviceType,
    } = queryParse.data;

    try {
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

      if (serviceType) {
        where._serviceTypeKey = serviceType as ServiceTypeKey;
      }

      const [centers, total] = await Promise.all([
        db.serviceCenter.findMany({
          where,
          skip: (page! - 1) * pageSize!,
          take: pageSize!,
          orderBy: { createdAt: "desc" },
          include: {
            screeningTypes: {
              include: {
                screeningType: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            staff: {
              select: { id: true, email: true },
            },
          },
        }),
        db.serviceCenter.count({ where }),
      ]);

      const formattedCenters = centers
        .map((center) => {
          const services = Array.isArray(center.screeningTypes)
            ? center.screeningTypes.map((service) => ({
                id: service.screeningType.id,
                name: service.screeningType.name,
                price: service.amount || 0,
              }))
            : (center.services || []).map((service) => ({
                id: service.id,
                name: service.name,
                price: service.price || service.amount || 0,
              }));

          return {
            id: center.id,
            email: center.email,
            centerName: center.centerName,
            address: center.address,
            state: center.state,
            lga: center.lga,
            phone: center.phone,
            bankAccount: center.bankAccount,
            bankName: center.bankName,
            status: center.status?.toString?.() ?? String(center.status ?? ""),
            createdAt:
              center.createdAt instanceof Date
                ? center.createdAt.toISOString()
                : center.createdAt,
            services,
            staff: center.staff,
          };
        })
        .sort((a, b) => b.services.length - a.services.length)
        .filter((center) =>
          serviceType ? center.services.length > 0 : true,
        );

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
    } catch (error) {
      console.error("List centers error:", {
        query: { page, pageSize, search, status, state, lga, serviceType },
        error,
      });

      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to load centers" },
        500
      );
    }
  }
);

// GET /api/center/my-services - List services offered by the logged-in center
centerApp.get(
  "/my-services",
  authMiddleware(["center", "center_staff"]),
  async (c) => {
    const db = getDB(c);
    const payload = c.get("jwtPayload");
    const centerId = payload?.centerId || payload?.id;

    if (!centerId) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Center ID not found" },
        400
      );
    }

    try {
      const links = await db.serviceCenterScreeningType.findMany({
        where: { centerId },
        include: {
          screeningType: {
            select: { id: true, name: true, description: true, agreedPrice: true },
          },
        },
      });

      const services = links.map((link: any) => ({
        id: link.id,
        screeningTypeId: link.screeningTypeId,
        name: link.screeningType?.name || "",
        description: link.screeningType?.description || null,
        agreedPrice: link.screeningType?.agreedPrice || 0,
        price: link.amount || 0,
      }));

      return c.json({ ok: true, data: { services } });
    } catch (error) {
      console.error("Get center services error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to load services" },
        500
      );
    }
  }
);

// POST /api/center/my-services - Add screening services to the center
centerApp.post(
  "/my-services",
  authMiddleware(["center", "center_staff"]),
  async (c) => {
    const db = getDB(c);
    const payload = c.get("jwtPayload");
    const centerId = payload?.centerId || payload?.id;

    if (!centerId) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Center ID not found" },
        400
      );
    }

    const body = await c.req.json<{ screeningTypeIds?: string[] }>();
    const screeningTypeIds = body.screeningTypeIds || [];

    if (screeningTypeIds.length === 0) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Select at least one service to add" },
        400
      );
    }

    try {
      const existing = await db.serviceCenterScreeningType.findMany({
        where: { centerId },
      });
      const existingTypeIds = new Set(
        existing.map((link: { screeningTypeId: string }) => link.screeningTypeId)
      );

      const added = [];
      for (const screeningTypeId of screeningTypeIds) {
        if (existingTypeIds.has(screeningTypeId)) continue;

        const screeningType = await db.screeningType.findUnique({
          where: { id: screeningTypeId },
        });
        if (!screeningType) continue;

        const link = await db.serviceCenterScreeningType.create({
          data: {
            centerId,
            screeningTypeId,
            amount: screeningType.agreedPrice || 10000,
          },
          include: {
            screeningType: {
              select: { id: true, name: true, agreedPrice: true },
            },
          },
        });
        added.push(link);
      }

      return c.json({
        ok: true,
        message:
          added.length > 0
            ? `Added ${added.length} service(s)`
            : "Selected services are already offered",
        data: { addedCount: added.length },
      });
    } catch (error) {
      console.error("Add center services error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to add services" },
        500
      );
    }
  }
);

// DELETE /api/center/my-services/:screeningTypeId - Remove a service from the center
centerApp.delete(
  "/my-services/:screeningTypeId",
  authMiddleware(["center", "center_staff"]),
  async (c) => {
    const db = getDB(c);
    const payload = c.get("jwtPayload");
    const centerId = payload?.centerId || payload?.id;
    const screeningTypeId = c.req.param("screeningTypeId");

    if (!centerId) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Center ID not found" },
        400
      );
    }

    try {
      await db.serviceCenterScreeningType.delete({
        where: {
          centerId_screeningTypeId: { centerId, screeningTypeId },
        },
      });

      return c.json({ ok: true, message: "Service removed" });
    } catch (error) {
      console.error("Remove center service error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to remove service" },
        500
      );
    }
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
    const { JWT_TOKEN_SECRET } = env<TEnvs>(c);

    let includeStaff = false;
    const authHeader = c.req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const payload = await verify(
          authHeader.slice(7),
          JWT_TOKEN_SECRET,
          "HS256",
        );
        const profile = String(payload?.profile || "").toUpperCase();
        if (
          (profile === "CENTER" || profile === "CENTER_STAFF") &&
          payload?.id === id
        ) {
          includeStaff = true;
        }
      } catch {
        includeStaff = false;
      }
    }

    const center = await db.serviceCenter.findUnique({
      where: { id: id! },
    });

    if (!center) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Center not found" },
        404
      );
    }

    const [staffRows] = includeStaff
      ? await Promise.all([db.centerStaff.findMany({ where: { centerId: id! } })])
      : [[]];

    const supabase = getSupabaseClient(c);
    const { data: links } = await supabase
      .from("ServiceCenterScreeningType")
      .select("screeningTypeId, amount")
      .eq("centerId", id!);

    const screeningTypeIds = [...new Set((links || []).map((l: any) => l.screeningTypeId))];
    const { data: screeningTypes } = screeningTypeIds.length
      ? await supabase.from("ScreeningType").select("id, name").in("id", screeningTypeIds)
      : { data: [] };

    const typeMap = new Map((screeningTypes || []).map((t: any) => [t.id, t]));
    const services = (links || []).map((link: any) => {
      const service = typeMap.get(link.screeningTypeId);
      return {
        id: service?.id || link.screeningTypeId,
        name: service?.name || "Screening",
        price: link.amount || 0,
      };
    });

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
      status: center.status?.toString?.() || String(center.status),
      createdAt:
        center.createdAt instanceof Date
          ? center.createdAt.toISOString()
          : center.createdAt,
      services,
      staff: includeStaff
        ? (staffRows || []).map((member: any) => ({
            id: member.id,
            email: member.email,
          }))
        : [],
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
    expiresAt: invite.expiresAt
      ? new Date(invite.expiresAt).toISOString()
      : null,
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
        status: "ACTIVE",
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

      const center = await db.serviceCenter.findUnique({
        where: { id: invitation.centerId },
      });
      const centerName = center?.centerName || "";
      const centerAddress = center?.address || "";
      const expiresAtIso = invitation.expiresAt
        ? new Date(invitation.expiresAt).toISOString()
        : null;

      // Check if invitation has already been accepted
      if (invitation.acceptedAt) {
        return c.json<TValidateStaffInviteResponse>({
          ok: true,
          data: {
            isValid: false,
            centerName,
            centerAddress,
            email: invitation.email,
            expiresAt: expiresAtIso,
            isExpired: false,
          },
        });
      }

      // Check if invitation has expired
      const isExpired = invitation.expiresAt
        ? new Date() > new Date(invitation.expiresAt)
        : false;

      return c.json<TValidateStaffInviteResponse>({
        ok: true,
        data: {
          isValid: !isExpired,
          centerName,
          centerAddress,
          email: invitation.email,
          expiresAt: expiresAtIso,
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
