import {
  clearReferralIntent,
  readReferralIntent,
} from '@/lib/referral-intent'
import { isAuthMiddleware } from '@/services/providers/auth.provider'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
  ref: z.string().optional(),
})

export const Route = createFileRoute('/register/patient')({
  validateSearch: searchSchema,
  beforeLoad: async ({ context, search }) => {
    const ref = search.ref
    if (ref && typeof window !== 'undefined') {
      sessionStorage.setItem('zerocancer_ref', ref)
    }

    const { isAuth, profile } = await isAuthMiddleware(context.queryClient)
    if (isAuth && String(profile).toUpperCase() === 'PATIENT') {
      const intent = readReferralIntent()
      if (intent?.intent === 'pay_now' && intent.screeningTypeId) {
        clearReferralIntent()
        throw redirect({
          to: '/patient/book/pay',
          search: {
            screeningTypeId: intent.screeningTypeId,
            centerId: intent.centerId,
            referralCode: intent.code || ref,
          },
        })
      }
      if (intent?.intent === 'pay_later' && intent.screeningTypeId) {
        clearReferralIntent()
        throw redirect({
          to: '/patient/savings',
          search: {
            screeningTypeId: intent.screeningTypeId,
            centerId: intent.centerId,
            targetAmount: intent.price,
          },
        })
      }
      throw redirect({
        to: '/patient/book/pay',
        search: { referralCode: ref },
      })
    }

    if (ref) {
      throw redirect({
        to: '/r/$code',
        params: { code: ref },
      })
    }

    throw redirect({
      to: '/sign-up/patient',
      search: { ref },
    })
  },
  component: () => null,
})
