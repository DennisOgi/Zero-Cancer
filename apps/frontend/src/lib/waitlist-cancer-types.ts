export const CANCER_TYPE_OPTIONS = [
  { value: 'cervical', label: 'Cervical' },
  { value: 'breast', label: 'Breast' },
  { value: 'prostate', label: 'Prostate' },
  { value: 'colorectal', label: 'Colorectal' },
] as const

export type CancerTypeKey = (typeof CANCER_TYPE_OPTIONS)[number]['value']

export type WaitlistDemandCategory =
  | 'Vaccination'
  | 'Screening'
  | 'Diagnosis'
  | 'Treatment'

export const WAITLIST_DEMAND_CATEGORIES: WaitlistDemandCategory[] = [
  'Vaccination',
  'Screening',
  'Diagnosis',
  'Treatment',
]

const CANCER_MATCH_TERMS: Record<CancerTypeKey, string[]> = {
  // HPV vaccination is mapped to cervical cancer prevention.
  cervical: ['cervical', 'hpv'],
  breast: ['breast'],
  prostate: ['prostate'],
  colorectal: ['colorectal', 'colon'],
}

export function matchesCancerType(
  serviceName: string,
  cancerType: CancerTypeKey,
): boolean {
  const normalized = serviceName.toLowerCase()
  return CANCER_MATCH_TERMS[cancerType].some((term) =>
    normalized.includes(term),
  )
}

export function getWaitlistDemandCategory(
  serviceName: string,
): WaitlistDemandCategory {
  const normalized = serviceName.toLowerCase()

  if (
    normalized.includes('vaccin') ||
    normalized.includes('immunization') ||
    normalized.includes('immunisation')
  ) {
    return 'Vaccination'
  }

  if (
    normalized.includes('treatment') ||
    normalized.includes('chemotherapy') ||
    normalized.includes('radiotherapy')
  ) {
    return 'Treatment'
  }

  if (
    normalized.includes('diagnosis') ||
    normalized.includes('diagnostic') ||
    normalized.includes('biopsy')
  ) {
    return 'Diagnosis'
  }

  return 'Screening'
}

export function getCancerTypeLabel(cancerType: CancerTypeKey): string {
  const option = CANCER_TYPE_OPTIONS.find((item) => item.value === cancerType)
  return option ? `${option.label} Cancer` : 'Cancer'
}

export function aggregateWaitlistByCancerCategory(
  waitlists: Array<{
    screeningType?: { name?: string }
    pendingCount: number
  }>,
  cancerType: CancerTypeKey,
) {
  const counts: Record<WaitlistDemandCategory, number> = {
    Vaccination: 0,
    Screening: 0,
    Diagnosis: 0,
    Treatment: 0,
  }

  for (const item of waitlists) {
    const name = item.screeningType?.name ?? ''
    if (!matchesCancerType(name, cancerType)) continue
    counts[getWaitlistDemandCategory(name)] += item.pendingCount
  }

  const cancerTypeLabel = getCancerTypeLabel(cancerType)

  return WAITLIST_DEMAND_CATEGORIES.map((category) => ({
    cancerTypeLabel,
    category,
    patientsWaiting: counts[category],
  }))
}

export const waitlistCategoryBadgeStyles: Record<
  WaitlistDemandCategory,
  string
> = {
  Vaccination: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40',
  Screening: 'bg-blue-950/40 text-blue-300 border-blue-800/40',
  Diagnosis: 'bg-amber-950/40 text-amber-300 border-amber-800/40',
  Treatment: 'bg-purple-950/40 text-purple-300 border-purple-800/40',
}
