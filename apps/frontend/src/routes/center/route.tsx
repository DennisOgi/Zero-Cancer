import { createFileRoute, redirect } from '@tanstack/react-router'
import { isAuthMiddleware } from '@/services/providers/auth.provider'
import { CenterLayout } from '@/components/layouts/CenterLayout'
import { AuthPrompt } from '@/components/AuthPrompt'

export const Route = createFileRoute('/center')({
  component: CenterLayout,
  errorComponent: () => (
    <AuthPrompt
      title="Center Login Required"
      message="Please log in with your screening center account to access the center dashboard."
      showSignUp={false}
    />
  ),
  beforeLoad: async ({ context }) => {
    const { isAuth, profile } = await isAuthMiddleware(context.queryClient)

    if (!isAuth) {
      throw new Error('Authentication required')
    }

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
