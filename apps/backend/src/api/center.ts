import { zValidator } from "@hono/zod-validator";
import {
  centerStaffForgotPasswordSchema,
  centerStaffLoginSchema,
  centerStaffResetPasswordSchema,
  createCenterStaffPasswordSchema,
  getCenterByIdSchema,
  getCentersQuerySchema,
  inviteStaffSchema,
  updateCenterProfileSchema,
  updateCenterStaffMemberSchema,
  validateStaffInviteSchema,
} from "@zerocancer/shared";
import type {
  TCenterStaffMembersResponse,
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
import {
  isLikelyValidWhatsappNumber,
  normalizeWhatsappNumber,
} from "../lib/phone";
import type { ServiceTypeKey } from "../lib/service-type-utils";
import { getSupabaseClient } from "../lib/supabase";
import {
  normalizeStaffRole,
  staffJwtProfile,
} from "../lib/center-context";
import { TEnvs, THonoApp } from "../lib/types";
import { comparePassword, hashPassword } from "../lib/utils";
import { authMiddleware } from "../middleware/auth.middleware";

export const centerApp = new Hono<THonoApp>();

/** Case-insensitive exact match for PostgREST ilike. */
const emailMatch = (email: string) =>
  email.trim().replace(/[\\%_]/g, "\\$&");

// GET /api/center/profile - Logged-in center profile (for settings)
centerApp.get(
  "/profile",
  authMiddleware(["center", "center_staff"]),
  async (c) => {
    try {
      const db = getDB(c);
      const payload = c.get("jwtPayload");
      const centerId = payload?.id as string;

      const center = await db.serviceCenter.findUnique({
        where: { id: centerId },
      });

      if (!center) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Center not found" },
          404
        );
      }

      return c.json({
        ok: true,
        data: {
          id: center.id,
          centerName: center.centerName,
          email: center.email,
          phone: center.phone || null,
          whatsappNumber: center.whatsappNumber || center.phone || null,
          address: center.address,
          state: center.state,
          lga: center.lga,
          status: center.status,
          logoUrl: center.logoUrl || null,
          reportFooterText: center.reportFooterText || null,
          brandColor: center.brandColor || null,
          patientInviteUrl: `${(env<TEnvs>(c).FRONTEND_URL || "https://zerocancer.africa").replace(/\/$/, "")}/sign-up/patient?center=${encodeURIComponent(center.id)}`,
        },
      });
    } catch (error) {
      console.error("Get center profile error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to load center profile" },
        500
      );
    }
  }
);

// PATCH /api/center/profile - Update WhatsApp / contact details (center admin only)
centerApp.patch(
  "/profile",
  authMiddleware(["center"]),
  zValidator("json", updateCenterProfileSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    try {
      const db = getDB(c);
      const payload = c.get("jwtPayload");
      const centerId = payload?.id as string;
      const body = c.req.valid("json");

      if (!isLikelyValidWhatsappNumber(body.whatsappNumber)) {
        return c.json<TErrorResponse>(
          {
            ok: false,
            error:
              "Enter a valid WhatsApp number in international format, e.g. +2348012345678",
          },
          400
        );
      }

      const normalizedWhatsapp = normalizeWhatsappNumber(body.whatsappNumber);
      const normalizedPhone = body.phone
        ? normalizeWhatsappNumber(body.phone)
        : normalizedWhatsapp;

      const updated = await db.serviceCenter.update({
        where: { id: centerId },
        data: {
          whatsappNumber: normalizedWhatsapp,
          phone: normalizedPhone,
          ...(body.address ? { address: body.address.trim() } : {}),
          ...(body.logoUrl !== undefined
            ? { logoUrl: body.logoUrl.trim() || null }
            : {}),
          ...(body.reportFooterText !== undefined
            ? { reportFooterText: body.reportFooterText.trim() || null }
            : {}),
          ...(body.brandColor !== undefined
            ? { brandColor: body.brandColor.trim() || null }
            : {}),
        },
      });

      return c.json({
        ok: true,
        message: "Center profile updated",
        data: {
          id: updated.id,
          centerName: updated.centerName,
          email: updated.email,
          phone: updated.phone || null,
          whatsappNumber: updated.whatsappNumber || updated.phone || null,
          address: updated.address,
          state: updated.state,
          lga: updated.lga,
          status: updated.status,
          logoUrl: updated.logoUrl || null,
          reportFooterText: updated.reportFooterText || null,
          brandColor: updated.brandColor || null,
        },
      });
    } catch (error) {
      console.error("Update center profile error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to update center profile" },
        500
      );
    }
  }
);

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
      sort,
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
              select: {
                id: true,
                email: true,
                role: true,
                fullName: true,
                status: true,
              },
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
        .filter((center) =>
          serviceType ? center.services.length > 0 : true,
        );

      if (sort !== "recent") {
        formattedCenters.sort((a, b) => b.services.length - a.services.length);
      }

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

// GET /api/center/:id - Get center by ID (UUID only so /staff/* is not captured)
centerApp.get(
  "/:id{[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}",
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
      ? await Promise.all([
          db.centerStaff.findMany({
            where: { centerId: id! },
            select: {
              id: true,
              email: true,
              role: true,
              fullName: true,
              status: true,
            },
          }),
        ])
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
      email: includeStaff ? center.email : "",
      centerName: center.centerName,
      address: center.address,
      state: center.state,
      lga: center.lga,
      phone: includeStaff ? center.phone : null,
      bankAccount: includeStaff ? center.bankAccount : null,
      bankName: includeStaff ? center.bankName : null,
      status: center.status?.toString?.() || String(center.status),
      createdAt:
        center.createdAt instanceof Date
          ? center.createdAt.toISOString()
          : center.createdAt,
      services,
      staff: includeStaff
        ? (staffRows || [])
            .filter((member: any) => String(member.status || "").toUpperCase() !== "REMOVED")
            .map((member: any) => ({
            id: member.id,
            email: member.email,
            role: member.role || "STAFF",
            fullName: member.fullName || null,
            status: member.status || "ACTIVE",
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
    select: {
      email: true,
      token: true,
      expiresAt: true,
      role: true,
      fullName: true,
    },
  });

  // Transform Date objects to strings for JSON serialization
  const transformedInvites = invites.map((invite) => ({
    email: invite.email,
    token: invite.token,
    role: invite.role || "NURSE",
    fullName: invite.fullName || null,
    expiresAt: invite.expiresAt
      ? new Date(invite.expiresAt).toISOString()
      : null,
  }));

  return c.json<TInviteStaffResponse>({
    ok: true,
    data: { invites: transformedInvites },
  });
});

// GET /api/center/staff/members - Facility team with activity (no earnings)
centerApp.get("/staff/members", authMiddleware(["center"]), async (c) => {
  const supabase = getSupabaseClient(c);
  const centerId = c.get("jwtPayload")?.id as string;

  const { data: rows, error } = await supabase
    .from("CenterStaff")
    .select("id, email, fullName, role, status, createdAt")
    .eq("centerId", centerId)
    .order("createdAt", { ascending: true });
  if (error) {
    console.error("List staff members failed:", error);
    return c.json<TErrorResponse>(
      { ok: false, error: "Failed to load staff" },
      500
    );
  }

  const { data: centerRow } = await supabase
    .from("ServiceCenter")
    .select("email")
    .eq("id", centerId)
    .maybeSingle();
  const ownerEmail = String(centerRow?.email || "").toLowerCase();

  const members = (rows || []).filter(
    (row: any) => String(row.status || "").toUpperCase() !== "REMOVED"
  );
  const ids = members.map((m: any) => m.id);
  const { data: onboarded } = ids.length
    ? await supabase
        .from("PatientProfile")
        .select("onboardedByStaffId")
        .in("onboardedByStaffId", ids)
    : { data: [] };
  const countByStaff = new Map<string, number>();
  for (const row of onboarded || []) {
    const id = (row as any).onboardedByStaffId;
    countByStaff.set(id, (countByStaff.get(id) || 0) + 1);
  }

  return c.json<TCenterStaffMembersResponse>({
    ok: true,
    data: {
      members: members.map((m: any) => ({
        id: m.id,
        email: m.email,
        fullName: m.fullName || null,
        role: normalizeStaffRole(m.role),
        status:
          String(m.status || "ACTIVE").toUpperCase() === "SUSPENDED"
            ? "SUSPENDED"
            : "ACTIVE",
        createdAt: m.createdAt || null,
        patientsRegistered: countByStaff.get(m.id) || 0,
        isOwner: String(m.email || "").toLowerCase() === ownerEmail,
      })),
    },
  });
});

async function loadOwnStaffMember(c: any, staffId: string) {
  const supabase = getSupabaseClient(c);
  const payload = c.get("jwtPayload");
  const { data: member } = await supabase
    .from("CenterStaff")
    .select("id, centerId, status, email")
    .eq("id", staffId)
    .maybeSingle();
  if (
    !member ||
    member.centerId !== payload?.id ||
    String(member.status || "").toUpperCase() === "REMOVED"
  ) {
    return { error: "Staff member not found", status: 404 as const };
  }
  if (payload?.staffId && payload.staffId === staffId) {
    return {
      error: "You can't change your own account. Ask another facility admin.",
      status: 400 as const,
    };
  }
  const { data: center } = await supabase
    .from("ServiceCenter")
    .select("email")
    .eq("id", payload?.id)
    .maybeSingle();
  const memberEmail = String(member.email || "").toLowerCase();
  const actorEmail = String(payload?.email || "").toLowerCase();
  const ownerEmail = String(center?.email || "").toLowerCase();
  if (
    (actorEmail && memberEmail === actorEmail) ||
    (ownerEmail && memberEmail === ownerEmail)
  ) {
    return {
      error:
        "The health facility owner account can't be removed or changed from here.",
      status: 400 as const,
    };
  }
  return { member };
}

// PATCH /api/center/staff/members/:staffId - Change role, suspend or reactivate
centerApp.patch(
  "/staff/members/:staffId",
  authMiddleware(["center"]),
  zValidator("json", updateCenterStaffMemberSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const staffId = c.req.param("staffId");
    const check = await loadOwnStaffMember(c, staffId);
    if ("error" in check) {
      return c.json<TErrorResponse>(
        { ok: false, error: check.error! },
        check.status
      );
    }

    const body = c.req.valid("json");
    const updates: Record<string, unknown> = {};
    if (body.role) updates.role = normalizeStaffRole(body.role);
    if (body.status) updates.status = body.status;
    if (body.fullName) updates.fullName = body.fullName;

    const { data, error } = await getSupabaseClient(c)
      .from("CenterStaff")
      .update(updates)
      .eq("id", staffId)
      .select("id, email, fullName, role, status")
      .single();
    if (error) {
      console.error("Update staff member failed:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to update staff member" },
        500
      );
    }
    return c.json({ ok: true, data });
  }
);

// DELETE /api/center/staff/members/:staffId - Remove from the facility (keeps history)
centerApp.delete(
  "/staff/members/:staffId",
  authMiddleware(["center"]),
  async (c) => {
    const staffId = c.req.param("staffId");
    const check = await loadOwnStaffMember(c, staffId);
    if ("error" in check) {
      return c.json<TErrorResponse>(
        { ok: false, error: check.error! },
        check.status
      );
    }
    const { error } = await getSupabaseClient(c)
      .from("CenterStaff")
      .update({ status: "REMOVED" })
      .eq("id", staffId);
    if (error) {
      console.error("Remove staff member failed:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to remove staff member" },
        500
      );
    }
    return c.json({ ok: true, data: { id: staffId } });
  }
);

// DELETE /api/center/staff/invite/:token - Cancel a pending invite
centerApp.delete(
  "/staff/invite/:token",
  authMiddleware(["center"]),
  async (c) => {
    const centerId = c.get("jwtPayload")?.id as string;
    const token = c.req.param("token");
    const { data, error } = await getSupabaseClient(c)
      .from("CenterStaffInvite")
      .delete()
      .eq("token", token)
      .eq("centerId", centerId)
      .is("acceptedAt", null)
      .select("id");
    if (error) {
      console.error("Cancel invite failed:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to cancel invite" },
        500
      );
    }
    if (!data?.length) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Invite not found" },
        404
      );
    }
    return c.json({ ok: true, data: { token } });
  }
);

// POST /api/center/staff/invite/:token/resend - New link, new 7-day expiry
centerApp.post(
  "/staff/invite/:token/resend",
  authMiddleware(["center"]),
  async (c) => {
    const db = getDB(c);
    const supabase = getSupabaseClient(c);
    const centerId = c.get("jwtPayload")?.id as string;
    const oldToken = c.req.param("token");

    const { data: invite } = await supabase
      .from("CenterStaffInvite")
      .select("id, email, role, fullName, centerId, acceptedAt")
      .eq("token", oldToken)
      .maybeSingle();
    if (!invite || invite.centerId !== centerId || invite.acceptedAt) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Invite not found" },
        404
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const { error } = await supabase
      .from("CenterStaffInvite")
      .update({ token, expiresAt: expiresAt.toISOString() })
      .eq("id", invite.id);
    if (error) {
      console.error("Resend invite failed:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to resend invite" },
        500
      );
    }

    const center = await db.serviceCenter.findUnique({ where: { id: centerId } });
    try {
      await sendStaffInviteEmail(c, {
        email: invite.email,
        token,
        centerName: center?.centerName || "a ZeroCancer health facility",
        role: normalizeStaffRole(invite.role || "NURSE"),
      });
    } catch (error) {
      console.error("Staff invite resend email failed:", error);
    }

    return c.json({
      ok: true,
      data: { email: invite.email, token, expiresAt: expiresAt.toISOString() },
    });
  }
);

async function sendStaffInviteEmail(
  c: any,
  opts: { email: string; token: string; centerName: string; role: string }
) {
  const roleLabel =
    opts.role === "ADMIN"
      ? "hospital admin"
      : opts.role === "NURSE"
        ? "nurse"
        : "staff member";
  const inviteUrl = `${
    env<{ FRONTEND_URL: string }>(c).FRONTEND_URL
  }/staff/create-new-password?token=${opts.token}`;
  await sendEmail(c, {
    to: opts.email,
    subject: `You're invited to join ${opts.centerName} on ZeroCancer`,
    html: `<p>You have been invited to join <strong>${opts.centerName}</strong> as a ${roleLabel}. <a href="${inviteUrl}">Click here to set your password and join.</a> This link expires in 7 days.</p>`,
  });
}

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
    const supabase = getSupabaseClient(c);
    const centerId = c.get("jwtPayload")?.id as string;
    const { emails, role, fullName } = c.req.valid("json");
    const staffRole = normalizeStaffRole(role || "NURSE");
    const center = await db.serviceCenter.findUnique({ where: { id: centerId } });
    const centerName = center?.centerName || "a ZeroCancer health facility";
    const invites: Array<{
      email: string;
      token: string;
      role: string;
      fullName: string | null;
      expiresAt: string | null;
    }> = [];
    const skipped: Array<{ email: string; reason: string }> = [];
    const uniqueEmails = [
      ...new Set(emails!.map((e) => e.trim().toLowerCase()).filter(Boolean)),
    ];
    for (const email of uniqueEmails) {
      const { data: existing } = await supabase
        .from("CenterStaff")
        .select("id, status")
        .eq("centerId", centerId)
        .ilike("email", emailMatch(email))
        .maybeSingle();
      if (existing && String(existing.status).toUpperCase() !== "REMOVED") {
        skipped.push({ email, reason: "Already on your team" });
        continue;
      }

      await supabase
        .from("CenterStaffInvite")
        .delete()
        .eq("centerId", centerId)
        .ilike("email", emailMatch(email))
        .is("acceptedAt", null);

      // Generate a unique token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      await db.centerStaffInvite.create({
        data: {
          centerId: centerId!,
          email,
          token,
          expiresAt,
          role: staffRole,
          fullName: fullName || null,
        },
      });
      try {
        await sendStaffInviteEmail(c, {
          email,
          token,
          centerName,
          role: staffRole,
        });
      } catch (error) {
        console.error("Staff invite email failed:", error);
      }

      invites.push({
        email: email!,
        token: token!,
        role: staffRole,
        fullName: fullName || null,
        expiresAt: expiresAt.toISOString(),
      });
    }
    if (invites.length === 0 && skipped.length > 0) {
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: `${skipped.map((s) => s.email).join(", ")} already on your team`,
        },
        409
      );
    }
    return c.json<TInviteStaffResponse>({
      ok: true,
      data: { invites, skipped },
    });
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

    const supabase = getSupabaseClient(c);
    const { data: previous } = await supabase
      .from("CenterStaff")
      .select("id, fullName")
      .eq("centerId", invite.centerId!)
      .ilike("email", emailMatch(invite.email!))
      .maybeSingle();

    const staff = previous
      ? await db.centerStaff.update({
          where: { id: previous.id },
          data: {
            passwordHash,
            role: normalizeStaffRole(invite.role || "NURSE"),
            fullName: invite.fullName || previous.fullName || null,
            status: "ACTIVE",
          },
        })
      : await db.centerStaff.create({
          data: {
            centerId: invite.centerId!,
            email: invite.email!.toLowerCase(),
            passwordHash,
            role: normalizeStaffRole(invite.role || "NURSE"),
            fullName: invite.fullName || null,
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
    if (!staff || String(staff.status || "").toUpperCase() === "REMOVED") {
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
    if (!reset || new Date(reset.expiresAt!) < new Date()) {
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

    const staffStatus = String(staff.status || "ACTIVE").toUpperCase();
    if (staffStatus === "REMOVED") {
      return c.json<TErrorResponse>(
        { ok: false, error: "Invalid credentials" },
        401
      );
    }
    if (staffStatus !== "ACTIVE") {
      return c.json<TErrorResponse>(
        {
          ok: false,
          error:
            "Your account has been suspended by your health facility. Contact your facility admin.",
        },
        403
      );
    }

    const profile = staffJwtProfile(staff.role);
    const staffRole = normalizeStaffRole(staff.role);
    const payload = {
      id: centerId!,
      email: email!,
      profile,
      staffId: staff.id!,
      staffRole,
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
          profile,
          centerId: staff.centerId!,
          staffId: staff.id!,
          staffRole,
          fullName: staff.fullName || undefined,
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
            centerId: invitation.centerId,
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
          centerId: invitation.centerId,
          role: normalizeStaffRole(invitation.role || "NURSE"),
          fullName: invitation.fullName || null,
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
