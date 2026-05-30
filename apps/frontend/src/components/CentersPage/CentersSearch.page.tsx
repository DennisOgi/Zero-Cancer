import { centers } from '@/services/providers/center.provider'
import { useAuthUser } from '@/services/providers/auth.provider'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { TCenter } from '@zerocancer/shared/types'
import {
  getCenterServiceCategories,
  getServiceTypeLabel,
  serviceTypeBadgeStyles,
} from '@/lib/service-types'
import {
  Building2,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { useEffect } from 'react'

const serviceTypeLabel = {
  vaccination: 'Vaccination',
  screening: 'Screening',
  treatment: 'Treatment',
} as const

export default function CentersSearchPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/(public)/centers' })
  const { state, lga, serviceType } = search
  const { data: authData } = useQuery(useAuthUser())

  const {
    data,
    isLoading,
    error,
  } = useQuery(
    centers({
      state: state || undefined,
      lga: lga || undefined,
      serviceType: serviceType || undefined,
      pageSize: 50,
    }),
  )

  const centersData = data?.data?.centers || []

  const handleBookService = (center: TCenter, serviceId?: string) => {
    const bookingPath = `/patient/book/pay?centerId=${center.id}${
      serviceId ? `&screeningTypeId=${serviceId}` : ''
    }`
    const isPatient =
      authData?.data?.user?.profile?.toLowerCase() === 'patient'

    if (isPatient) {
      navigate({
        to: '/patient/book/pay',
        search: {
          centerId: center.id,
          screeningTypeId: serviceId,
        },
      })
      return
    }

    navigate({
      to: '/login',
      search: {
        redirect: bookingPath,
        role: 'patient',
      },
    })
  }

  useEffect(() => {
    if (error) {
      console.error('Centers search query failed', {
        filters: { state, lga, serviceType },
        error,
      })
    }
  }, [error, lga, serviceType, state])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="wrapper py-8">
          <button
            onClick={() => navigate({ to: '/' })}
            className="text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold">Cancer Management Centers</h1>
          <p className="text-muted-foreground mt-2">
            {state && (
              <>
                Showing centers in <span className="font-semibold">{state}</span>
                {lga && (
                  <>
                    {' '}
                    - <span className="font-semibold">{lga}</span>
                  </>
                )}
              </>
            )}
            {serviceType && (
              <>
                {' '}
                for{' '}
                <span className="font-semibold">
                  {serviceTypeLabel[serviceType]}
                </span>
              </>
            )}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Found {centersData.length} center{centersData.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="wrapper py-8">
        {isLoading ? (
          <div className="flex items-center justify-center rounded-lg bg-white p-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading centers...
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-red-300 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              We couldn't load centers
            </h2>
            <p className="text-muted-foreground mb-6">
              Please try again, or search another location.
            </p>
            <button
              onClick={() => navigate({ to: '/' })}
              className="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90"
            >
              Try Another Location
            </button>
          </div>
        ) : centersData.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Centers Found</h2>
            <p className="text-muted-foreground mb-6">
              We couldn't find any cancer management centers in {state}
              {lga && ` - ${lga}`}.
            </p>
            <button
              onClick={() => navigate({ to: '/' })}
              className="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90"
            >
              Try Another Location
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {centersData.map((center: TCenter) => (
              <div
                key={center.id}
                className="bg-white rounded-lg border hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  {/* Center Name */}
                  <h3 className="text-lg font-semibold mb-3 line-clamp-2">
                    {center.centerName}
                  </h3>

                  {/* Location */}
                  <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>{center.address}</p>
                      <p className="font-medium text-foreground">
                        {center.lga}, {center.state}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  {center.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Phone className="w-4 h-4" />
                      <span>{center.phone}</span>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        center.status === 'ACTIVE'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}
                    >
                      {center.status === 'ACTIVE' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {center.status}
                    </span>
                  </div>

                  {/* Services */}
                  {center.services && center.services.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Service types
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {getCenterServiceCategories(center.services).map(
                          (category) => (
                            <span
                              key={category}
                              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${serviceTypeBadgeStyles[category]}`}
                            >
                              {getServiceTypeLabel(category)}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        navigate({
                          to: '/centers/$centerId',
                          params: { centerId: center.id },
                        })
                      }
                      className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() =>
                        handleBookService(center, center.services?.[0]?.id)
                      }
                      className="flex-1 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors text-sm font-medium"
                      disabled={center.status !== 'ACTIVE'}
                    >
                      {center.status !== 'ACTIVE'
                        ? 'Unavailable'
                        : 'Book Now'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
