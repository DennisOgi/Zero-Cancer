import { createFileRoute, redirect } from '@tanstack/react-router'
import { isAuthMiddleware, useAuthUser } from '@/services/providers/auth.provider'
import { getRecommendedCenters } from '@/services/auth.service'
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

    const auth = await context.queryClient.ensureQueryData(useAuthUser())
    const assignedCenterId = auth?.data?.user?.assignedCenterId
    const isCenterRoute =
      location.pathname === '/patient/select-center' ||
      location.pathname === '/patient/change-center'

    if (!assignedCenterId && !isCenterRoute) {
      try {
        const centersResponse = await context.queryClient.fetchQuery({
          queryKey: ['recommendedCenters', auth?.data?.user?.id],
          queryFn: getRecommendedCenters,
        })
        if ((centersResponse?.data?.recommendedCenters?.length || 0) > 0) {
          throw redirect({ to: '/patient/select-center' })
        }
      } catch (error) {
        if (error && typeof error === 'object' && 'to' in error) {
          throw error
        }
      }
    }

    return null
  },
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(usePatientAppointments({}))
    context.queryClient.prefetchQuery(useAllScreeningTypes())
    context.queryClient.prefetchQuery(useNotifications())
  },
})
