import { PatientCenterSelection } from '@/components/AuthPages/SignupPage/PatientCenterSelection'
import type { TRecommendedCenter } from '@zerocancer/shared/types'
import { createFileRoute, redirect } from '@tanstack/react-router'

type PatientCentersSearch = {
  state?: string
  lga?: string
}

export const Route = createFileRoute('/(auth)/sign-up/patient/centers')({
  validateSearch: (search: Record<string, unknown>): PatientCentersSearch => ({
    state: typeof search.state === 'string' ? search.state : undefined,
    lga: typeof search.lga === 'string' ? search.lga : undefined,
  }),
  beforeLoad: () => {
    const stored = sessionStorage.getItem('patientSignupCenters')
    if (!stored) {
      throw redirect({ to: '/sign-up/patient' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { state = '', lga = '' } = Route.useSearch()
  const stored = sessionStorage.getItem('patientSignupCenters')
  const parsed = stored
    ? (JSON.parse(stored) as {
        recommendedCenters: TRecommendedCenter[]
        assignedCenter?: TRecommendedCenter | null
      })
    : { recommendedCenters: [], assignedCenter: null }

  return (
    <PatientCenterSelection
      recommendedCenters={parsed.recommendedCenters}
      assignedCenter={parsed.assignedCenter}
      patientState={state}
      patientLga={lga}
    />
  )
}
