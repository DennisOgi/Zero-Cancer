import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { assignPatientCenter } from '@/services/auth.service'
import { ACCESS_TOKEN_KEY } from '@/services/keys'
import type { TRecommendedCenter } from '@zerocancer/shared/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Building2, CheckCircle2, Loader2, MapPin } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

type PatientCenterSelectionProps = {
  recommendedCenters: TRecommendedCenter[]
  assignedCenter?: TRecommendedCenter | null
  patientState: string
  patientLga: string
}

export function PatientCenterSelection({
  recommendedCenters,
  assignedCenter,
  patientState,
  patientLga,
}: PatientCenterSelectionProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedCenterId, setSelectedCenterId] = useState(
    assignedCenter?.id || recommendedCenters[0]?.id || '',
  )

  const assignMutation = useMutation({
    mutationFn: (centerId: string) => assignPatientCenter(centerId),
    onSuccess: (response) => {
      sessionStorage.removeItem('patientSignupCenters')
      queryClient.invalidateQueries({ queryKey: ['authUser'] })
      toast.success(
        response.message ||
          `Joined ${response.data?.center.centerName}. You can now access screening, vaccination, and treatment services.`,
      )
      navigate({ to: '/patient' })
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error || 'Could not join the selected center',
      )
    },
  })

  if (assignedCenter) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <CardTitle className="text-green-900">
                You&apos;ve been matched to a center
              </CardTitle>
            </div>
            <CardDescription className="text-green-800">
              Based on your location in {patientLga}, {patientState}, we
              automatically assigned you to the nearest center.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CenterCard center={assignedCenter} selected />
            <Button
              className="w-full"
              onClick={() => {
                sessionStorage.removeItem('patientSignupCenters')
                navigate({ to: '/patient' })
              }}
            >
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (recommendedCenters.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>No centers found near you yet</CardTitle>
            <CardDescription>
              We couldn&apos;t find an active center in {patientLga},{' '}
              {patientState} right now. You can still use your account and book
              when a center becomes available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => {
                sessionStorage.removeItem('patientSignupCenters')
                navigate({ to: '/patient' })
              }}
            >
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleContinue = () => {
    if (!selectedCenterId) {
      toast.error('Please select a center to continue')
      return
    }

    const existingToken = queryClient.getQueryData<string>([ACCESS_TOKEN_KEY])
    if (!existingToken) {
      toast.error('Your session expired. Please sign in again.')
      navigate({ to: '/login', search: { actor: 'patient' } })
      return
    }

    assignMutation.mutate(selectedCenterId)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Choose your nearest center</h1>
        <p className="text-muted-foreground">
          Select a center in or near {patientLga}, {patientState} to access
          vaccination, screening, and treatment services.
        </p>
      </div>

      <div className="grid gap-4">
        {recommendedCenters.map((center) => (
          <button
            key={center.id}
            type="button"
            onClick={() => setSelectedCenterId(center.id)}
            className="text-left"
          >
            <CenterCard
              center={center}
              selected={selectedCenterId === center.id}
            />
          </button>
        ))}
      </div>

      <Button
        className="w-full"
        disabled={assignMutation.isPending || !selectedCenterId}
        onClick={handleContinue}
      >
        {assignMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Joining center...
          </>
        ) : (
          'Join Selected Center'
        )}
      </Button>
    </div>
  )
}

function CenterCard({
  center,
  selected,
}: {
  center: TRecommendedCenter
  selected?: boolean
}) {
  return (
    <Card
      className={`transition-colors ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/40'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              {center.centerName}
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {center.address}, {center.lga}, {center.state}
            </CardDescription>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              center.distanceTier === 'same_lga'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {center.distanceTier === 'same_lga'
              ? 'In your LGA'
              : 'In your state'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Services offered
        </p>
        <div className="flex flex-wrap gap-2">
          {center.services.map((service) => (
            <span
              key={service.id}
              className="rounded-full bg-muted px-3 py-1 text-xs"
            >
              {service.name}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
