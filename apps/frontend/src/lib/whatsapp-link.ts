/**
 * WhatsApp Click-to-Chat (wa.me) helpers — no API keys required.
 * Opens the user's WhatsApp app with a pre-filled message; staff taps Send.
 */

export function toWaMePhone(
  phone: string,
  defaultCountryCode = '234',
): string | null {
  const trimmed = phone.trim()
  if (!trimmed) return null

  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return null

  let e164Digits: string
  if (trimmed.startsWith('+')) {
    e164Digits = digits
  } else if (digits.startsWith(defaultCountryCode)) {
    e164Digits = digits
  } else if (digits.startsWith('0')) {
    e164Digits = `${defaultCountryCode}${digits.slice(1)}`
  } else {
    e164Digits = `${defaultCountryCode}${digits}`
  }

  if (e164Digits.length < 10 || e164Digits.length > 15) return null
  return e164Digits
}

export type ScreeningReportWhatsAppParams = {
  patientName: string
  centerName: string
  resultText: string
  publicReportLink: string
  pdfLink?: string
  centerWhatsapp?: string
}

export function buildScreeningReportWhatsAppMessage(
  params: ScreeningReportWhatsAppParams,
): string {
  return [
    `Hello ${params.patientName || 'there'},`,
    '',
    `Your screening report from ${params.centerName || 'your screening center'} is ready.`,
    `Result: ${params.resultText}`,
    '',
    params.pdfLink ? `Download PDF: ${params.pdfLink}` : '',
    `View online: ${params.publicReportLink}`,
    params.centerWhatsapp
      ? `For questions, contact the center on WhatsApp: ${params.centerWhatsapp}`
      : '',
    '',
    `— ${params.centerName || 'Screening Center'} via ZeroCancer`,
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildWhatsAppShareUrl(phone: string, message: string): string | null {
  const waPhone = toWaMePhone(phone)
  if (!waPhone) return null
  return `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`
}

export function openWhatsAppShare(phone: string, message: string): boolean {
  const url = buildWhatsAppShareUrl(phone, message)
  if (!url) return false

  const popup = window.open(url, '_blank', 'noopener,noreferrer')
  if (!popup) {
    window.location.href = url
  }
  return true
}
