export function normalizeLocation(value: string | null | undefined): string {
  if (!value) return "";

  return value
    .trim()
    .toLowerCase()
    .replace(/\s+state$/i, "")
    .replace(/^federal capital territory$/i, "fct")
    .replace(/^abuja$/i, "fct");
}

export function locationsMatch(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const left = normalizeLocation(a);
  const right = normalizeLocation(b);
  return left.length > 0 && left === right;
}

export function locationInList(
  value: string | null | undefined,
  candidates: string[]
): boolean {
  return candidates.some((candidate) => locationsMatch(candidate, value));
}
