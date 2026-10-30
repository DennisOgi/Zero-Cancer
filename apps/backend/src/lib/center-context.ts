import type { Context } from "hono";
import {
  isClinicalStaffRole,
  normalizeStaffRoleValue,
  type TStaffRole,
} from "@zerocancer/shared";
import type { AuthPayload } from "./types";

export type StaffRole = TStaffRole;

export function normalizeStaffRole(role?: string | null): StaffRole {
  return normalizeStaffRoleValue(role);
}

export function isHospitalAdminRole(role?: string | null) {
  const value = String(role || "").trim().toUpperCase();
  return value === "ADMIN";
}

/** Facility owner JWT or invited ADMIN staff (profile CENTER / staffRole ADMIN). */
export function isFacilityAdminPayload(payload?: {
  profile?: string | null;
  staffRole?: string | null;
} | null) {
  if (!payload) return false;
  return (
    payload.profile === "CENTER" || isHospitalAdminRole(payload.staffRole)
  );
}

/** Facility admins sign in as the center; doctors/nurses/staff stay CENTER_STAFF. */
export function staffJwtProfile(role?: string | null): "CENTER" | "CENTER_STAFF" {
  return isHospitalAdminRole(role) ? "CENTER" : "CENTER_STAFF";
}

/**
 * Personal referral wallets are private to doctors and nurses.
 * Facility admins (CENTER / ADMIN) never see clinician balances.
 */
export function canAccessStaffEarnings(ctx: {
  profile?: string | null;
  staffRole?: string | null;
  staffId?: string | null;
}) {
  if (!ctx.staffId) return false;
  if (ctx.profile === "CENTER") return false;
  if (isHospitalAdminRole(ctx.staffRole)) return false;
  return isClinicalStaffRole(ctx.staffRole);
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
