import { PatientCenterSelection } from '@/components/AuthPages/SignupPage/PatientCenterSelection'
import { getRecommendedCenters } from '@/services/auth.service'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useAuthUser } from '@/services/providers/auth.provider'

export const Route = createFileRoute('/patient/select-center')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: authData, isLoading: authLoading } = useQuery(useAuthUser())
  const user = authData?.data?.user

  const { data, isLoading } = useQuery({
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
      recommendedCenters={data?.data?.recommendedCenters || []}
      assignedCenter={null}
      patientState={user?.state || ''}
      patientLga={user?.localGovernment || ''}
    />
  )
}
