export type ServiceTypeKey = 'vaccination' | 'screening' | 'treatment'

const serviceTypeLabels: Record<ServiceTypeKey, string> = {
  vaccination: 'Vaccination',
  screening: 'Screening',
  treatment: 'Treatment',
}

export function getServiceCategoryFromName(name: string): ServiceTypeKey {
  const normalized = name.toLowerCase()
  if (normalized.includes('vaccine') || normalized.includes('vaccination')) {
    return 'vaccination'
  }
  if (normalized.includes('treatment') || normalized.includes('therapy')) {
    return 'treatment'
  }
  return 'screening'
}

export function getCenterServiceCategories(
  services: Array<{ name: string }>,
): ServiceTypeKey[] {
  const categories = new Set<ServiceTypeKey>()
  for (const service of services) {
    categories.add(getServiceCategoryFromName(service.name))
  }
  return [...categories]
}

export function getServiceTypeLabel(type: ServiceTypeKey): string {
  return serviceTypeLabels[type]
}

export const serviceTypeBadgeStyles: Record<ServiceTypeKey, string> = {
  vaccination: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  screening: 'bg-blue-50 text-blue-700 border-blue-200',
  treatment: 'bg-purple-50 text-purple-700 border-purple-200',
}
