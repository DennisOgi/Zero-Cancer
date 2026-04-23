import { createFileRoute, redirect } from '@tanstack/react-router'
import { isAuthMiddleware } from '@/services/providers/auth.provider'
import { DonorLayout } from '@/components/layouts/DonorLayout'
import { AuthPrompt } from '@/components/AuthPrompt'

export const Route = createFileRoute('/donor')({
  component: DonorLayout,
  errorComponent: () => (
    <AuthPrompt
      title="Donor Login Required"
      message="Please log in or create a donor account to sponsor cancer screenings and manage campaigns."
      showSignUp={true}
    />
  ),
  beforeLoad: async ({ context }) => {
    const { isAuth, isAuthorized, profile } = await isAuthMiddleware(
      context.queryClient,
      'donor',
    )
    if (!isAuth) {
      throw new Error('Authentication required')
    }
    // If authenticated but wrong role, redirect to correct dashboard
    if (!isAuthorized) {
      if (profile === 'PATIENT') return redirect({ to: '/patient' })
      if (profile === 'CENTER') return redirect({ to: '/center' })
    }
    return null
  },
})
