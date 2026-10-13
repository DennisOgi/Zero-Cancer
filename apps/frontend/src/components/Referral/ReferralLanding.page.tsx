import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Label } from '@/components/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import { getAllStates, getLGAsForState } from '@/data/nigeria-locations'
import {
  clearReferralIntent,
  saveReferralIntent,
  type ReferralIntent,
} from '@/lib/referral-intent'
import { lookupReferral } from '@/services/agent-network.service'
import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  CalendarDays,
  Clock3,
  HeartHandshake,
  Loader2,
  MapPin,
  PiggyBank,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type OfferService = {
  screeningTypeId: string
  name: string
  description?: string | null
  price: number
  agreedPrice: number
}

type OfferCenter = {
  id: string
  centerName: string
  address?: string
  state: string
  lga: string
  services: OfferService[]
  nextOpenDays: Array<{ date: string; slotsAvailable: number }>
}

type OfferResponse = {
  ok: boolean
  data: {
    type: string
    code: string
    referrerName: string
    screenAnywhere?: boolean
    boundCenterId?: string | null
    usingNearest?: boolean
    distanceTier?: string | null
    center: OfferCenter | null
    alternatives: Array<{
      id: string
      centerName: string
      state: string
      lga: string
      distanceTier: string
    }>
  }
}

function naira(amount: number) {
  return `₦${Number(amount || 0).toLocaleString()}`
}

function formatOpenDay(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

async function fetchReferralOffer(params: {
  code: string
  state?: string
  lga?: string
  centerId?: string
}) {
  return (await request.get(endpoints.referralOffer(params))) as OfferResponse
}

const ONBOARDING_STEPS = [
  {
    title: 'Create your patient account',
    detail:
      'Fill in your details so we can connect you securely to a health facility.',
  },
  {
    title: 'See facility open days',
    detail:
      'Your connected facility sets available screening days. You only see open slots with capacity.',
  },
  {
    title: 'Book, save, or join the waitlist',
    detail:
      'Pay now for an appointment, save gradually, or join the waitlist for donor sponsorship.',
  },
]

export function ReferralLandingPage({ code }: { code: string }) {
  const navigate = useNavigate()
  const normalized = code.trim()
  const [liveElsewhere, setLiveElsewhere] = useState(false)
  const [state, setState] = useState('')
  const [lga, setLga] = useState('')
  const [selectedCenterId, setSelectedCenterId] = useState<string | undefined>()
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>()

  const { data: lookup, isLoading: lookupLoading, isError } = useQuery({
    queryKey: ['referral-lookup', normalized],
    queryFn: () => lookupReferral(normalized),
    enabled: normalized.length > 2,
    retry: false,
  })

  const offerParams = useMemo(
    () => ({
      code: normalized,
      state: liveElsewhere && state ? state : undefined,
      lga: liveElsewhere && lga ? lga : undefined,
      centerId: selectedCenterId,
    }),
    [normalized, liveElsewhere, state, lga, selectedCenterId],
  )

  const { data: offerData, isFetching: offerLoading } = useQuery({
    queryKey: ['referral-offer', offerParams],
    queryFn: () => fetchReferralOffer(offerParams),
    enabled: normalized.length > 2,
  })

  const meta = (lookup as any)?.data
  const offer = offerData?.data
  const center = offer?.center || null
  const services = center?.services || []
  const lgas = useMemo(() => (state ? getLGAsForState(state) : []), [state])

  useEffect(() => {
    if (!center?.id) return
    if (!selectedCenterId) setSelectedCenterId(center.id)
  }, [center?.id, selectedCenterId])

  useEffect(() => {
    if (!services.length) {
      setSelectedServiceId(undefined)
      return
    }
    if (
      !selectedServiceId ||
      !services.some((service) => service.screeningTypeId === selectedServiceId)
    ) {
      setSelectedServiceId(services[0].screeningTypeId)
    }
  }, [services, selectedServiceId])

  const selectedService = services.find(
    (service) => service.screeningTypeId === selectedServiceId,
  )

  const continueWithIntent = (intent: ReferralIntent) => {
    if (!selectedService || !center) return
    clearReferralIntent()
    saveReferralIntent({
      code: offer?.code || normalized,
      intent,
      centerId: center.id,
      screeningTypeId: selectedService.screeningTypeId,
      screeningName: selectedService.name,
      price: selectedService.price,
      centerName: center.centerName,
    })
    navigate({
      to: '/sign-up/patient',
      search: {
        ref: offer?.code || normalized,
        center: center.id,
      },
    })
  }

  if (lookupLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-700" />
      </div>
    )
  }

  if (isError || !meta) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Invite not found</h1>
        <p className="text-muted-foreground">
          This referral link is invalid or expired. You can still create a
          patient account and find a facility near you.
        </p>
        <Button asChild>
          <Link to="/sign-up/patient">Create patient account</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm font-semibold tracking-wide text-pink-800">
          ZeroCancer
        </Link>
        <Link
          to="/login"
          className="text-sm text-muted-foreground hover:text-slate-900"
        >
          Already have an account?
        </Link>
      </div>
      <div className="space-y-3">
        <Badge className="bg-pink-100 text-pink-900 hover:bg-pink-100">
          Referral invite
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {meta.referrerName} invited you to get screened
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Create a patient account, connect to a health facility, and choose
          how you want to cover the screening — pay now, save for later, or
          join the waitlist for donor support. Prices always follow the
          facility you connect to.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-pink-700" />
            Your health facility
          </CardTitle>
          <CardDescription>
            {offer?.usingNearest
              ? 'You live elsewhere, so we are showing the closest facility to you and its local price.'
              : meta.boundCenter || center
                ? 'Defaulting to the facility connected to your referrer.'
                : 'Pick your location so we can match you to the closest facility.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={liveElsewhere ? 'outline' : 'default'}
              onClick={() => {
                setLiveElsewhere(false)
                setState('')
                setLga('')
                setSelectedCenterId(undefined)
              }}
            >
              Referrer&apos;s facility
            </Button>
            <Button
              type="button"
              variant={liveElsewhere ? 'default' : 'outline'}
              onClick={() => setLiveElsewhere(true)}
            >
              I live in another area
            </Button>
          </div>

          {liveElsewhere ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>State</Label>
                <Select
                  value={state}
                  onValueChange={(value) => {
                    setState(value)
                    setLga('')
                    setSelectedCenterId(undefined)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllStates().map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>LGA</Label>
                <Select
                  value={lga}
                  onValueChange={(value) => {
                    setLga(value)
                    setSelectedCenterId(undefined)
                  }}
                  disabled={!state}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select LGA" />
                  </SelectTrigger>
                  <SelectContent>
                    {lgas.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          {offer?.alternatives?.length ? (
            <div className="space-y-1.5">
              <Label>Nearby facilities</Label>
              <Select
                value={selectedCenterId || center?.id}
                onValueChange={(value) => setSelectedCenterId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose facility" />
                </SelectTrigger>
                <SelectContent>
                  {offer.alternatives.map((alt) => (
                    <SelectItem key={alt.id} value={alt.id}>
                      {alt.centerName} · {alt.lga}, {alt.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {offerLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading facility prices…
            </div>
          ) : center ? (
            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{center.centerName}</p>
              <p className="text-sm text-muted-foreground">
                {center.address ? `${center.address} · ` : ''}
                {center.lga}, {center.state}
              </p>
              {center.nextOpenDays?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Next open days
                  </span>
                  {center.nextOpenDays.slice(0, 4).map((day) => (
                    <Badge key={day.date} variant="outline">
                      {formatOpenDay(day.date)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  This facility uses default weekday hours until they set a
                  custom calendar.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-amber-800">
              {liveElsewhere
                ? 'Enter your state and LGA to find the closest facility and its price.'
                : 'No connected facility yet. Choose your area above so we can match you.'}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Choose a service</CardTitle>
          <CardDescription>
            The amount shown is this facility&apos;s price for that service.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!center || services.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No bookable services are listed for this facility yet.
            </p>
          ) : (
            services.map((service) => {
              const selected = service.screeningTypeId === selectedServiceId
              return (
                <button
                  key={service.screeningTypeId}
                  type="button"
                  onClick={() => setSelectedServiceId(service.screeningTypeId)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selected
                      ? 'border-pink-500 bg-pink-50 ring-1 ring-pink-500'
                      : 'hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      {service.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {service.description}
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-lg font-semibold text-emerald-800">
                      {naira(service.price)}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How do you want to proceed?</CardTitle>
          <CardDescription>
            You&apos;ll create a patient account next, then we&apos;ll take you
            straight to the option you pick.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Button
            className="h-auto flex-col items-start gap-2 whitespace-normal px-4 py-4 text-left"
            disabled={!selectedService || !center}
            onClick={() => continueWithIntent('pay_now')}
          >
            <Wallet className="h-5 w-5" />
            <span className="font-semibold">Pay now</span>
            <span className="text-xs font-normal opacity-90">
              Pay {selectedService ? naira(selectedService.price) : ''} and book
              an open day at this facility.
            </span>
          </Button>
          <Button
            variant="secondary"
            className="h-auto flex-col items-start gap-2 whitespace-normal px-4 py-4 text-left"
            disabled={!selectedService || !center}
            onClick={() => continueWithIntent('pay_later')}
          >
            <PiggyBank className="h-5 w-5" />
            <span className="font-semibold">Pay later</span>
            <span className="text-xs font-normal opacity-90">
              Start a save-to-screen plan toward{' '}
              {selectedService ? naira(selectedService.price) : 'this price'}.
            </span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-2 whitespace-normal px-4 py-4 text-left"
            disabled={!selectedService || !center}
            onClick={() => continueWithIntent('waitlist')}
          >
            <HeartHandshake className="h-5 w-5" />
            <span className="font-semibold">Join waitlist</span>
            <span className="text-xs font-normal opacity-90">
              Wait for a donor to sponsor this screening at this facility.
            </span>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-700" />
            How ZeroCancer works for you
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ONBOARDING_STEPS.map((step, index) => (
            <div key={step.title} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                {index + 1}
              </div>
              <div>
                <p className="font-medium">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.detail}</p>
              </div>
            </div>
          ))}
          <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            <p className="inline-flex items-center gap-2 font-medium text-slate-800">
              <Clock3 className="h-4 w-4" />
              Facility calendars
            </p>
            <p className="mt-1">
              Health facilities set their available days under Availability.
              When you book, you only see those open days and remaining slots.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
