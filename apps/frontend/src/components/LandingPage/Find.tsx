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
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type ServiceType = 'vaccination' | 'screening' | 'treatment'

export default function Find() {
  const navigate = useNavigate()
  const [selectedState, setSelectedState] = useState<string>('')
  const [selectedLGA, setSelectedLGA] = useState<string>('')
  const [serviceType, setServiceType] = useState<ServiceType | ''>('')
  const [lgas, setLgas] = useState<string[]>([])
  const featuredCentersRef = useRef<HTMLDivElement>(null)

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

  const featuredCenters = featuredCentersData?.data?.centers || []

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

  const scrollFeaturedCenters = (direction: 'left' | 'right') => {
    featuredCentersRef.current?.scrollBy({
      left: direction === 'left' ? -300 : 300,
      behavior: 'smooth',
    })
  }

  const hasFeatured = featuredCentersLoading || featuredCenters.length > 0

  return (
    <section
      id="find-center-section"
      className="relative overflow-hidden bg-white"
    >
      <div className="wrapper py-16 md:py-24">
        {/* Top: two-column layout */}
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          {/* LEFT: heading, subtitle, search filters */}
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl font-bold leading-tight lg:text-5xl">
                Find a Center Near You
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Search for vaccination, screening, and treatment centers easily,
                wherever you are.
              </p>
            </div>

            <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div>
                <label htmlFor="serviceType" className="text-sm font-medium">
                  Service type
                </label>
                <Select
                  value={serviceType}
                  onValueChange={(value) =>
                    setServiceType(value as ServiceType)
                  }
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
          </div>

          {/* RIGHT: shorter grey panel with hospital image */}
          <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:rounded-3xl lg:bg-gray-100 lg:p-8 lg:text-center lg:h-[280px] xl:h-[300px]">
            <img
              src={screening}
              alt="Cancer management center"
              className="w-40 xl:w-48"
            />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Browse our featured centers, or search to explore cancer
              management centers in your area.
            </p>
          </div>
        </div>

        {/* Featured centers slider: cards pass over the grey panel on the right */}
        {hasFeatured && (
          <div className="relative z-10 mt-8 lg:ml-auto lg:-mt-44 lg:w-[56%] xl:w-[54%]">
            <div className="rounded-3xl border border-gray-100 bg-white/95 p-5 shadow-2xl backdrop-blur-sm md:p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold">Featured centers</h3>
                {featuredCenters.length > 2 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => scrollFeaturedCenters('left')}
                      className="rounded-full border p-2 text-muted-foreground transition-colors hover:bg-gray-50 hover:text-foreground"
                      aria-label="Show previous centers"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollFeaturedCenters('right')}
                      className="rounded-full border p-2 text-muted-foreground transition-colors hover:bg-gray-50 hover:text-foreground"
                      aria-label="Show next centers"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <div
                ref={featuredCentersRef}
                className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {featuredCentersLoading
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-52 min-w-[260px] animate-pulse rounded-2xl bg-gray-100"
                      />
                    ))
                  : featuredCenters.map((center: TCenter) => (
                      <FeaturedCenterCard key={center.id} center={center} />
                    ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
