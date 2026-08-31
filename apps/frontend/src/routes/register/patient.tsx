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
      throw redirect({
        to: '/patient/book/pay',
        search: { referralCode: ref },
      })
    }

    throw redirect({
      to: '/sign-up/patient',
      search: { ref },
    })
  },
  component: () => null,
})
