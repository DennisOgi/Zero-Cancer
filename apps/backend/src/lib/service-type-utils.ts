export type ServiceTypeKey = "vaccination" | "screening" | "treatment";

export const serviceTypeFilters = {
  vaccination: {
    categoryIds: ["vaccine"],
    terms: ["vaccine", "vaccination"],
  },
  screening: {
    categoryIds: ["cancer", "screening"],
    terms: ["screening"],
  },
  treatment: {
    categoryIds: ["treatment", "treatement"],
    terms: ["treatment"],
  },
} as const;

type ScreeningTypeLike = {
  name?: string | null;
  screeningTypeCategoryId?: string | null;
  categoryName?: string | null;
};

export function matchesServiceTypeFilter(
  screeningType: ScreeningTypeLike,
  serviceType: ServiceTypeKey
): boolean {
  const filter = serviceTypeFilters[serviceType];
  const name = String(screeningType.name || "").toLowerCase();
  const categoryName = String(screeningType.categoryName || "").toLowerCase();

  return filter.terms.some(
    (term) => name.includes(term) || categoryName.includes(term)
  );
}

export function getServiceCategoryFromName(
  name: string
): ServiceTypeKey {
  const normalized = name.toLowerCase();
  if (
    serviceTypeFilters.vaccination.terms.some((term) =>
      normalized.includes(term)
    )
  ) {
    return "vaccination";
  }
  if (
    serviceTypeFilters.treatment.terms.some((term) =>
      normalized.includes(term)
    )
  ) {
    return "treatment";
  }
  return "screening";
}
