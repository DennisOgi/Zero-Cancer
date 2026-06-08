/**
 * Normalize phone numbers for WhatsApp / Twilio (E.164).
 * Defaults to Nigeria (+234) when local formats are used.
 */
export function normalizeWhatsappNumber(
  phone: string,
  defaultCountryCode = "234"
): string {
  const trimmed = phone.trim();
  if (!trimmed) return trimmed;

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return trimmed;

  if (trimmed.startsWith("+")) {
    return `+${digits}`;
  }

  if (digits.startsWith(defaultCountryCode)) {
    return `+${digits}`;
  }

  if (digits.startsWith("0")) {
    return `+${defaultCountryCode}${digits.slice(1)}`;
  }

  return `+${defaultCountryCode}${digits}`;
}

export function isLikelyValidWhatsappNumber(phone: string): boolean {
  const normalized = normalizeWhatsappNumber(phone);
  return /^\+\d{10,15}$/.test(normalized);
}
