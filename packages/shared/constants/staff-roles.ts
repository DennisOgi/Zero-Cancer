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

/**
 * Patient-facing inviter label, e.g. "Nurse Ruth", "Doctor Ade".
 * Falls back to role alone or a generic title when the name is missing.
 */
export function formatClinicalInviterLabel(
  role?: string | null,
  fullName?: string | null,
) {
  const normalized = normalizeStaffRoleValue(role)
  const firstName = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)[0]

  if (normalized === "DOCTOR") {
    return firstName ? `Doctor ${firstName}` : "a doctor"
  }
  if (normalized === "NURSE") {
    return firstName ? `Nurse ${firstName}` : "a nurse"
  }
  if (normalized === "ADMIN") {
    return firstName
      ? `${firstName} (facility admin)`
      : "a facility admin"
  }
  return firstName || "a health facility staff member"
}

/** WhatsApp / copy-paste share line for a staff patient referral link. */
export function formatStaffReferralShareMessage(opts: {
  role?: string | null
  fullName?: string | null
  referralCode: string
  shareUrl: string
  centerName?: string | null
}) {
  const who = formatClinicalInviterLabel(opts.role, opts.fullName)
  const facility = opts.centerName?.trim()
  const where = facility
    ? ` You can screen at ${facility} or any participating ZeroCancer center.`
    : " You can screen at any participating ZeroCancer center."
  return `Hi! ${who} invited you to get cervical cancer screening on ZeroCancer.${where} Use code ${opts.referralCode}: ${opts.shareUrl}`
}

/** WhatsApp / copy-paste share line for a facility /c/{id} invite. */
export function formatFacilityInviteShareMessage(opts: {
  centerName: string
  shareUrl: string
}) {
  const name = opts.centerName.trim() || "Our health facility"
  return `Hi! ${name} invited you to register for cervical cancer screening on ZeroCancer. Create your patient account with this link: ${opts.shareUrl}`
}
