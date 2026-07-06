import { createFileRoute } from '@tanstack/react-router'
import { PatientCenterSelection } from '@/components/AuthPages/SignupPage/PatientCenterSelection'
import { getRecommendedCenters } from '@/services/auth.service'
import { useAuthUser } from '@/services/providers/auth.provider'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/patient/change-center')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: authData, isLoading: authLoading } = useQuery(useAuthUser())
  const user = authData?.data?.user

  const { data, isLoading, isError } = useQuery({
    queryKey: ['recommendedCenters', user?.id],
    queryFn: getRecommendedCenters,
    enabled: !!user?.id,
  })

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <PatientCenterSelection
      mode="change"
      recommendedCenters={data?.data?.recommendedCenters || []}
      assignedCenter={user?.assignedCenter || null}
      patientState={user?.state || ''}
      patientLga={user?.localGovernment || ''}
      loadError={isError}
    />
  )
}
