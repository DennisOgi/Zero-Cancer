import screening from '@/assets/images/screening.png'
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
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
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
    setSelectedLGA('') // Reset LGA when state changes
    const stateLGAs = getLGAsForState(state)
    setLgas(stateLGAs)
  }

  const handleFindCenters = () => {
    if (!selectedState) {
      alert('Please select a state')
      return
    }
    
    // Navigate to centers search page with query params
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
      left: direction === 'left' ? -280 : 280,
      behavior: 'smooth',
    })
  }

  return (
    <div className="wrapper py-20 grid md:grid-cols-2 gap-10 items-center">
      <div className="space-y-6">
        <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
          Find a Cancer Management Center Near You
        </h2>
        <p className="text-muted-foreground">
          Search for vaccination, screening, and treatment centers easily,
          wherever you are.
        </p>
        {(featuredCentersLoading || featuredCenters.length > 0) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-semibold">Featured centers</h3>
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
                      className="h-28 min-w-[240px] animate-pulse rounded-xl bg-gray-100"
                    />
                  ))
                : featuredCenters.map((center: TCenter) => (
                    <div
                      key={center.id}
                      className="min-w-[240px] rounded-xl border bg-white p-4 shadow-sm"
                    >
                      <p className="line-clamp-1 font-semibold">
                        {center.centerName}
                      </p>
                      <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span className="line-clamp-2">
                          {center.lga}, {center.state}
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {center.services.length || 'No'} service
                        {center.services.length === 1 ? '' : 's'} available
                      </p>
                    </div>
                  ))}
            </div>
          </div>
        )}
        <div className="space-y-4">
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
                <SelectValue placeholder={selectedState ? "Select LGA" : "Select state first"} />
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
        </div>
        <button
          onClick={handleFindCenters}
          disabled={!selectedState}
          className={`px-8 py-3 rounded-lg font-medium transition-all ${
            selectedState
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
          }`}
        >
          Find Centers
        </button>
      </div>
      <div className="hidden lg:flex flex-col items-center justify-center text-center bg-gray-100 p-8 rounded-lg h-[550px] ">
        <img src={screening} alt="Cancer management center" className="w-64" />
        <p className="text-muted-foreground mt-4">
          Use the search tool on the left to explore available cancer management
          centers in your area.
        </p>
      </div>
    </div>
  )
}
