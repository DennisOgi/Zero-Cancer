import type { Context } from "hono";
import type { AuthPayload } from "./types";

export type StaffRole = "ADMIN" | "NURSE" | "STAFF";

export function normalizeStaffRole(role?: string | null): StaffRole {
  const value = String(role || "").trim().toUpperCase();
  if (value === "ADMIN") return "ADMIN";
  if (value === "NURSE") return "NURSE";
  return "STAFF";
}

export function isHospitalAdminRole(role?: string | null) {
  const value = String(role || "").trim().toUpperCase();
  return value === "ADMIN";
}

export function canAccessStaffEarnings(ctx: {
  profile?: string | null;
  staffRole?: string | null;
  staffId?: string | null;
}) {
  if (!ctx.staffId) return false;
  if (ctx.profile === "CENTER") return false;
  if (isHospitalAdminRole(ctx.staffRole)) return false;
  return true;
}

export function getCenterContext(c: Context) {
  const payload = (c.get("jwtPayload") || {}) as AuthPayload & {
    staffId?: string;
    staffRole?: string;
  };
  const staffRole = payload.staffRole
    ? normalizeStaffRole(payload.staffRole)
    : payload.profile === "CENTER"
      ? "ADMIN"
      : "STAFF";

  return {
    centerId: payload.id,
    email: payload.email,
    profile: payload.profile,
    staffId: payload.staffId || null,
    staffRole,
    isHospitalAdmin: payload.profile === "CENTER",
  };
}

export async function resolveCenterStaff(c: Context, db: any) {
  const ctx = getCenterContext(c);
  if (ctx.staffId) {
    const staff = await db.centerStaff.findUnique({ where: { id: ctx.staffId } });
    if (staff && staff.centerId === ctx.centerId) {
      return {
        ...ctx,
        staffId: staff.id as string,
        staffRole: normalizeStaffRole(staff.role),
        staff,
      };
    }
  }

  if (ctx.email && ctx.centerId) {
    const staff = await db.centerStaff.findFirst({
      where: { centerId: ctx.centerId, email: ctx.email },
    });
    if (staff) {
      return {
        ...ctx,
        staffId: staff.id as string,
        staffRole: normalizeStaffRole(staff.role),
        staff,
      };
    }
  }

  return { ...ctx, staff: null as any };
}
