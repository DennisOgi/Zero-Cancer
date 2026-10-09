import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { facilityOptions, useFacilityChoice } from '@/services/providers/boarding.provider'
import type { TFacilityOptionCenter } from '@zerocancer/shared/types'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Building2, CheckCircle2, Loader2, MapPin } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

export function FacilityChoicePage() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useQuery(facilityOptions())
  const choice = useFacilityChoice()
  const options = data?.data
  const [selectedId, setSelectedId] = useState<string>('')
  const [notify, setNotify] = useState(true)

  const allCenters = useMemo(() => {
    if (!options) return []
    const seen = new Set<string>()
    return [
      ...(options.inviterCenter ? [options.inviterCenter] : []),
      ...options.localCenters,
      ...options.nearestCenters,
    ].filter((center) => {
      if (seen.has(center.id)) return false
      seen.add(center.id)
      return true
    })
  }, [options])

  const selected = allCenters.find((center) => center.id === selectedId)
  const otherCity = selected && selected.distanceTier !== 'same_lga'

  const submit = async (action: 'JOIN_INVITER' | 'JOIN_CENTER' | 'WAIT') => {
    try {
      const res = await choice.mutateAsync({
        action,
        centerId: action === 'JOIN_CENTER' ? selectedId : undefined,
        notifyWhenLocal: action === 'JOIN_CENTER' ? notify : undefined,
      })
      toast.success(res.data.message)
      navigate({ to: '/patient' })
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Could not save that choice')
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !options) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Could not load facilities</CardTitle>
          <CardDescription>Refresh and try again.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Choose your health facility</h1>
        <p className="text-muted-foreground">
          Based on {options.patientLga}, {options.patientState}. If someone
          invited you and you live in the same city, you can join their hospital.
        </p>
      </div>

      {options.inviterCenter ? (
        <Card className="border-pink-200 bg-pink-50">
          <CardHeader>
            <CardTitle className="text-pink-950">
              Join {options.inviterName}&apos;s hospital
            </CardTitle>
            <CardDescription className="text-pink-900">
              You live in the same city, so you can screen where they invited you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CenterCard center={options.inviterCenter} selected />
            <Button
              className="w-full"
              disabled={choice.isPending}
              onClick={() => submit('JOIN_INVITER')}
            >
              Join {options.inviterCenter.centerName}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!options.hasLocalFacility ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-950">
              There is no facility in your city yet
            </CardTitle>
            <CardDescription className="text-amber-900">
              Choose another facility in the nearest city, or wait until one
              opens near you. We will notify you on WhatsApp and email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              disabled={choice.isPending}
              onClick={() => submit('WAIT')}
            >
              Wait until a facility comes to my city
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {allCenters.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-semibold">
            {options.hasLocalFacility
              ? 'Or choose the nearest facility'
              : 'Facilities in the nearest city'}
          </h2>
          {allCenters
            .filter((center) => center.id !== options.inviterCenter?.id)
            .map((center) => (
              <button
                key={center.id}
                type="button"
                className="w-full text-left"
                onClick={() => setSelectedId(center.id)}
              >
                <CenterCard center={center} selected={selectedId === center.id} />
              </button>
            ))}
          {otherCity ? (
            <label className="flex items-start gap-2 rounded-xl border bg-white p-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={notify}
                onChange={(event) => setNotify(event.target.checked)}
              />
              Remind me when a facility opens in {options.patientLga}
            </label>
          ) : null}
          <Button
            className="w-full"
            disabled={!selectedId || choice.isPending}
            onClick={() => submit('JOIN_CENTER')}
          >
            {choice.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Join selected facility
          </Button>
        </div>
      ) : options.hasLocalFacility ? null : (
        <p className="text-sm text-muted-foreground">
          You can use your account now. We will write when a facility opens in
          your city.
        </p>
      )}
    </div>
  )
}

function CenterCard({
  center,
  selected,
}: {
  center: TFacilityOptionCenter
  selected?: boolean
}) {
  return (
    <Card
      className={`transition ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/40'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              {center.centerName}
              {center.isInviterHospital ? (
                <CheckCircle2 className="h-4 w-4 text-pink-600" />
              ) : null}
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
                : center.distanceTier === 'same_state'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
            }`}
          >
            {center.distanceTier === 'same_lga'
              ? 'In your city'
              : center.distanceTier === 'same_state'
                ? 'In your state'
                : 'Nearest city'}
          </span>
        </div>
      </CardHeader>
    </Card>
  )
}
