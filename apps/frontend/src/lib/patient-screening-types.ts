import type { TScreeningType } from '@zerocancer/shared/types'

export const EXCLUDED_PATIENT_SCREENINGS = [
  'Blood Cancer Screening',
  'Bone Cancer Screening',
  'Brain Cancer Screening',
] as const

const FEMALE_SCREENING_ORDER = [
  'Cervical Cancer Screening',
  'Breast Cancer Screening',
  'Colorectal Cancer Screening',
] as const

const MALE_SCREENING_ORDER = [
  'Prostate Cancer Screening',
  'Colorectal Cancer Screening',
] as const

function normalizeGender(
  gender?: string | null,
): 'MALE' | 'FEMALE' | null {
  if (!gender) return null
  const upper = gender.trim().toUpperCase()
  if (upper === 'MALE' || upper === 'FEMALE') return upper
  return null
}

function sortByNameOrder(
  items: TScreeningType[],
  order: readonly string[],
): TScreeningType[] {
  const rank = new Map(order.map((name, index) => [name, index]))
  return [...items].sort(
    (a, b) => (rank.get(a.name) ?? 999) - (rank.get(b.name) ?? 999),
  )
}

export function filterPatientScreeningTypes(
  screeningTypes: TScreeningType[],
  gender?: string | null,
): TScreeningType[] {
  const active = screeningTypes.filter(
    (item) =>
      item.active !== false &&
      !EXCLUDED_PATIENT_SCREENINGS.includes(
        item.name as (typeof EXCLUDED_PATIENT_SCREENINGS)[number],
      ),
  )

  const normalizedGender = normalizeGender(gender)

  if (normalizedGender === 'FEMALE') {
    const allowed = new Set<string>(FEMALE_SCREENING_ORDER)
    return sortByNameOrder(
      active.filter((item) => allowed.has(item.name)),
      FEMALE_SCREENING_ORDER,
    )
  }

  if (normalizedGender === 'MALE') {
    const allowed = new Set<string>(MALE_SCREENING_ORDER)
    return sortByNameOrder(
      active.filter((item) => allowed.has(item.name)),
      MALE_SCREENING_ORDER,
    )
  }

  return []
}

export function hasPatientGenderForScreenings(
  gender?: string | null,
): boolean {
  return normalizeGender(gender) !== null
}
