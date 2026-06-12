import screening from '@/assets/images/screening.png'
import FeaturedCenterCard from '@/components/LandingPage/FeaturedCenterCard'
import { centers } from '@/services/providers/center.provider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import { NIGERIA_STATES_LGAS, getLGAsForState } from '@/data/nigeria-locations'
import type { TCenter } from '@zerocancer/shared/types'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type ServiceType = 'vaccination' | 'screening' | 'treatment'

export default function Find() {
  const navigate = useNavigate()
  const [selectedState, setSelectedState] = useState<string>('')
  const [selectedLGA, setSelectedLGA] = useState<string>('')
  const [serviceType, setServiceType] = useState<ServiceType | ''>('')
  const [lgas, setLgas] = useState<string[]>([])
  const trackRef = useRef<HTMLDivElement>(null)

  const {
    data: featuredCentersData,
    isLoading: featuredCentersLoading,
    error: featuredCentersError,
  } = useQuery(
    centers({
      page: 1,
      pageSize: 8,
      status: 'ACTIVE',
    }),
  )

  useEffect(() => {
    if (featuredCentersError) {
      console.error('Featured centers query failed', featuredCentersError)
    }
  }, [featuredCentersError])

  const featuredCenters = (featuredCentersData?.data?.centers || []).filter(
    (center) => center.services.length > 0,
  )
  const showFeatured = featuredCentersLoading || featuredCenters.length > 0

  // Auto-scrolling marquee for the featured centers slider.
  useEffect(() => {
    const track = trackRef.current
    if (!track || featuredCenters.length === 0) return

    let frame = 0
    let paused = false
    const onEnter = () => (paused = true)
    const onLeave = () => (paused = false)
    track.addEventListener('mouseenter', onEnter)
    track.addEventListener('mouseleave', onLeave)

    const step = () => {
      if (!paused && track.scrollWidth > track.clientWidth) {
        track.scrollLeft += 0.5
        const half = track.scrollWidth / 2
        if (track.scrollLeft >= half) track.scrollLeft -= half
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(frame)
      track.removeEventListener('mouseenter', onEnter)
      track.removeEventListener('mouseleave', onLeave)
    }
  }, [featuredCenters.length])

  const handleStateChange = (state: string) => {
    setSelectedState(state)
    setSelectedLGA('')
    setLgas(getLGAsForState(state))
  }

  const handleFindCenters = () => {
    if (!selectedState) {
      alert('Please select a state')
      return
    }

    navigate({
      to: '/centers',
      search: {
        state: selectedState,
        lga: selectedLGA || undefined,
        serviceType: serviceType || undefined,
      },
    })
  }

  // Duplicate the list so the marquee can loop seamlessly.
  const marqueeCenters = featuredCenters.length
    ? [...featuredCenters, ...featuredCenters]
    : []

  return (
    <section
      id="find-center-section"
      className="relative overflow-hidden bg-white"
    >
      <div className="wrapper py-16 md:py-24">
        {/* Centered intro */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Search className="h-4 w-4" />
            Find care near you
          </span>
          <h2 className="mt-4 text-4xl font-bold leading-tight lg:text-5xl">
            Find a Center Near You
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Search for vaccination, screening, and treatment centers easily,
            wherever you are.
          </p>
        </div>

        {/* Auto-scrolling featured centers — full width, no container */}
        {showFeatured && (
          <div className="mt-12">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Featured centers
            </h3>
            <div
              ref={trackRef}
              className="flex gap-5 overflow-x-hidden pb-3 pt-1"
            >
              {featuredCentersLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-56 w-[280px] shrink-0 animate-pulse rounded-2xl bg-gray-100 sm:w-[300px]"
                    />
                  ))
                : marqueeCenters.map((center: TCenter, index) => (
                    <FeaturedCenterCard
                      key={`${center.id}-${index}`}
                      center={center}
                    />
                  ))}
            </div>
          </div>
        )}

        {/* Search filters and grey hospital panel share a row */}
        <div className="mt-12 grid items-stretch gap-10 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm md:p-6">
            <div>
              <label htmlFor="serviceType" className="text-sm font-medium">
                Service type
              </label>
              <Select
                value={serviceType}
                onValueChange={(value) => setServiceType(value as ServiceType)}
              >
                <SelectTrigger id="serviceType" className="mt-1 w-full">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vaccination">Vaccination</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="treatment">Treatment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="state" className="text-sm font-medium">
                Select state
              </label>
              <Select value={selectedState} onValueChange={handleStateChange}>
                <SelectTrigger id="state" className="mt-1 w-full">
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIA_STATES_LGAS.map((location) => (
                    <SelectItem key={location.state} value={location.state}>
                      {location.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="lga" className="text-sm font-medium">
                Select local government (optional)
              </label>
              <Select
                value={selectedLGA}
                onValueChange={setSelectedLGA}
                disabled={!selectedState}
              >
                <SelectTrigger id="lga" className="mt-1 w-full">
                  <SelectValue
                    placeholder={
                      selectedState ? 'Select LGA' : 'Select state first'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {lgas.map((lga) => (
                    <SelectItem key={lga} value={lga}>
                      {lga}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button
              onClick={handleFindCenters}
              disabled={!selectedState}
              className={`w-full rounded-lg px-8 py-3 font-medium transition-all ${
                selectedState
                  ? 'cursor-pointer bg-primary text-white shadow-md hover:bg-primary/90 hover:shadow-lg'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400 opacity-60'
              }`}
            >
              Find Centers
            </button>
          </div>

          {/* Grey hospital panel */}
          <div className="hidden lg:flex">
            <div className="flex h-full min-h-[320px] w-full flex-col items-center justify-center rounded-3xl bg-gray-100 p-8 text-center">
              <img
                src={screening}
                alt="Cancer management center"
                className="w-56"
              />
              <p className="mt-4 max-w-xs text-muted-foreground">
                Browse our featured centers above, or search to explore cancer
                management centers in your area.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
