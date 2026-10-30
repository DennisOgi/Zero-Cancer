/** Facility admin = center owner JWT or staff with ADMIN role */
export function isFacilityAdminUser(user?: {
  profile?: string
  staffRole?: string | null
} | null) {
  if (!user) return false
  return user.profile === 'CENTER' || user.staffRole === 'ADMIN'
}

export function isClinicalStaffUser(user?: {
  profile?: string
  staffRole?: string | null
} | null) {
  if (!user) return false
  if (user.profile !== 'CENTER_STAFF') return false
  return user.staffRole === 'DOCTOR' || user.staffRole === 'NURSE'
}
