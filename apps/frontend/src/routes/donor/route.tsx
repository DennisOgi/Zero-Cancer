import { createFileRoute, redirect } from '@tanstack/react-router'
import { isAuthMiddleware } from '@/services/providers/auth.provider'
import { DonorLayout } from '@/components/layouts/DonorLayout'

export const Route = createFileRoute('/donor')({
  component: DonorLayout,
  beforeLoad: async ({ context }) => {
    const { isAuth, isAuthorized, profile } = await isAuthMiddleware(
      context.queryClient,
      'donor',
    )
    if (!isAuth) return redirect({ to: `/` })
    // If authenticated but wrong role, redirect to correct dashboard
    if (!isAuthorized) {
      if (profile === 'PATIENT') return redirect({ to: '/patient' })
      if (profile === 'CENTER') return redirect({ to: '/center' })
    }
    return null
  },
})
