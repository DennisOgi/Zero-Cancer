import { createFileRoute, redirect } from '@tanstack/react-router'
import { isAuthMiddleware } from '@/services/providers/auth.provider'
import { CenterLayout } from '@/components/layouts/CenterLayout'

export const Route = createFileRoute('/center')({
  component: CenterLayout,
  beforeLoad: async ({ context }) => {
    const { isAuth, profile } = await isAuthMiddleware(context.queryClient)

    if (!isAuth) return redirect({ to: `/` })

    // Check if user is CENTER or CENTER_STAFF
    const isCenterUser = profile === 'CENTER' || profile === 'CENTER_STAFF'

    // If authenticated but wrong role, redirect to correct dashboard
    if (!isCenterUser) {
      if (profile === 'PATIENT') return redirect({ to: '/patient' })
      if (profile === 'DONOR') return redirect({ to: '/donor' })
      if (profile === 'ADMIN') return redirect({ to: '/admin' })

      // If unknown profile, redirect to home
      return redirect({ to: '/' })
    }

    return null
  },
})
