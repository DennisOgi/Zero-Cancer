export type ReferralIntent = 'pay_now' | 'pay_later' | 'waitlist'

export type ReferralIntentContext = {
  code: string
  intent: ReferralIntent
  centerId?: string
  screeningTypeId?: string
  screeningName?: string
  price?: number
  centerName?: string
}

const STORAGE_KEY = 'zerocancer_referral_intent'

export function saveReferralIntent(context: ReferralIntentContext) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context))
  if (context.code) sessionStorage.setItem('zerocancer_ref', context.code)
  if (context.centerId) {
    sessionStorage.setItem('zerocancer_facility_center', context.centerId)
  }
}

export function readReferralIntent(): ReferralIntentContext | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ReferralIntentContext
  } catch {
    return null
  }
}

export function clearReferralIntent() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
}

export function referralShareUrl(code: string, origin?: string) {
  const base = (origin || (typeof window !== 'undefined' ? window.location.origin : '')).replace(
    /\/$/,
    '',
  )
  return `${base}/r/${encodeURIComponent(code)}`
}
