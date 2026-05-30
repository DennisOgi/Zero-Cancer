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

  return (
    <section id="find-center-section" className="relative overflow-hidden">
      <div className="wrapper py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
            Find a Center Near You
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Search for vaccination, screening, and treatment centers easily,
            wherever you are.
          </p>

          <div className="mx-auto mt-8 max-w-md space-y-4 text-left">
            <div>
              <label htmlFor="serviceType" className="text-sm font-medium">
                Service type
              </label>
              <Select
                value={serviceType}
                onValueChange={(value) => setServiceType(value as ServiceType)}
              >
                <SelectTrigger id="serviceType" className="w-full">
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
                <SelectTrigger id="state" className="w-full">
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
                <SelectTrigger id="lga" className="w-full">
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
              className={`w-full px-8 py-3 rounded-lg font-medium transition-all ${
                selectedState
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
              }`}
            >
              Find Centers
            </button>
          </div>
        </div>
      </div>

      {(featuredCentersLoading || featuredCenters.length > 0) && (
        <div className="relative z-10 wrapper -mt-2 mb-[-4.5rem] md:mb-[-5.5rem]">
          <div className="rounded-3xl border bg-white/95 p-5 shadow-xl backdrop-blur-sm md:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="font-semibold text-lg">Featured centers</h3>
              {featuredCenters.length > 2 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => scrollFeaturedCenters('left')}
                    className="rounded-full border p-2 text-muted-foreground hover:text-foreground"
                    aria-label="Show previous centers"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollFeaturedCenters('right')}
                    className="rounded-full border p-2 text-muted-foreground hover:text-foreground"
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
                      className="h-44 min-w-[280px] animate-pulse rounded-2xl bg-gray-100"
                    />
                  ))
                : featuredCenters.map((center: TCenter) => (
                    <FeaturedCenterCard key={center.id} center={center} />
                  ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-100 pt-24 pb-12 md:pt-28 md:pb-16">
        <div className="wrapper flex flex-col items-center justify-center text-center">
          <img
            src={screening}
            alt="Cancer management center"
            className="w-48 md:w-56"
          />
          <p className="mt-4 max-w-md text-muted-foreground">
            Use the search tool above to explore available cancer management
            centers in your area.
          </p>
        </div>
      </div>
    </section>
  )
}
