import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import {
  isClinicalStaffRole,
  normalizeStaffRoleValue,
  type TStaffRole,
} from "@zerocancer/shared";
import { getSupabaseClient } from "./supabase";
import type { AuthPayload, THonoApp } from "./types";

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

/** A facility an admin has switched off; it must not sign in at all. */
export const DEACTIVATED_FACILITY_STATUSES = ["INACTIVE", "SUSPENDED"];

export async function getFacilityStatus(c: Context, centerId: string) {
  const { data } = await getSupabaseClient(c)
    .from("ServiceCenter")
    .select("status")
    .eq("id", centerId)
    .maybeSingle();
  return String(data?.status || "").toUpperCase() || null;
}

/**
 * Patient data (search, registration, appointments, reports) is only open to
 * facilities an admin has approved. Pending facilities can still sign in to
 * finish their profile and services.
 */
export const requireActiveFacility = createMiddleware<THonoApp>(async (c, next) => {
  const centerId = c.get("jwtPayload")?.id;
  if (!centerId || (await getFacilityStatus(c, centerId)) !== "ACTIVE") {
    return c.json(
      {
        ok: false,
        err_code: "facility_not_active",
        error: "Your health facility must be approved by Zero Cancer before you can manage patients.",
      },
      403
    );
  }
  return next();
});

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
