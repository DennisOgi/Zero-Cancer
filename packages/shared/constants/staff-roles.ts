/** Facility clinical / admin roles. Doctor is listed first for invite UX. */
export const STAFF_ROLES = ["DOCTOR", "NURSE", "ADMIN", "STAFF"] as const

export type TStaffRole = (typeof STAFF_ROLES)[number]

/** Default when inviting clinical team members. */
export const DEFAULT_STAFF_INVITE_ROLE: TStaffRole = "DOCTOR"

export const STAFF_ROLE_LABEL: Record<TStaffRole, string> = {
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  ADMIN: "Facility admin",
  STAFF: "Staff",
}

/** Invite dropdown order: Doctors first, then Nurses. */
export const STAFF_INVITE_ROLE_ORDER: TStaffRole[] = [
  "DOCTOR",
  "NURSE",
  "ADMIN",
  "STAFF",
]

export function normalizeStaffRoleValue(role?: string | null): TStaffRole {
  const value = String(role || "")
    .trim()
    .toUpperCase()
  if (value === "ADMIN") return "ADMIN"
  if (value === "DOCTOR") return "DOCTOR"
  if (value === "NURSE") return "NURSE"
  if (value === "STAFF") return "STAFF"
  // Unknown / empty → Staff (never invent ADMIN)
  return "STAFF"
}

/** Doctors and nurses share the clinical screening / referral path. */
export function isClinicalStaffRole(role?: string | null) {
  const value = normalizeStaffRoleValue(role)
  return value === "DOCTOR" || value === "NURSE"
}

export function staffRoleLabel(role?: string | null) {
  return STAFF_ROLE_LABEL[normalizeStaffRoleValue(role)]
}
