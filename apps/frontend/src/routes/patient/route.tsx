import { createFileRoute, redirect } from '@tanstack/react-router'
import { isAuthMiddleware } from '@/services/providers/auth.provider'
import { useNotifications } from '@/services/providers/notification.provider'
import { usePatientAppointments } from '@/services/providers/patient.provider'
import { useAllScreeningTypes } from '@/services/providers/screeningType.provider'
import { PatientLayout } from '@/components/layouts/PatientLayout'
import { AuthPrompt } from '@/components/AuthPrompt'

export const Route = createFileRoute('/patient')({
  component: PatientLayout,
  errorComponent: () => (
    <AuthPrompt
      title="Patient Login Required"
      message="Please log in or create a patient account to book screenings and manage appointments."
      showSignUp={true}
    />
  ),
  beforeLoad: async ({ context, location }) => {
    const { isAuth, isAuthorized, profile } = await isAuthMiddleware(
      context.queryClient,
      'patient',
    )

    if (!isAuth) {
      throw new Error('Authentication required')
    }

    // If authenticated but wrong role, redirect to correct dashboard
    if (!isAuthorized) {
      if (profile === 'DONOR') return redirect({ to: '/donor' })
      if (profile === 'CENTER') return redirect({ to: '/center' })
    }

    return null
  },
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(usePatientAppointments({}))
    context.queryClient.prefetchQuery(useAllScreeningTypes())
    context.queryClient.prefetchQuery(useNotifications())
  },
})
