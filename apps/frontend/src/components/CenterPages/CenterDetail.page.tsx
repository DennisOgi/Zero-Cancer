import {
  getServiceCategoryFromName,
  getServiceTypeLabel,
  serviceTypeBadgeStyles,
} from '@/lib/service-types'
import { centerById } from '@/services/providers/center.provider'
import { useAuthUser } from '@/services/providers/auth.provider'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Loader2,
  MapPin,
  Phone,
} from 'lucide-react'
import { Button } from '../shared/ui/button'

export default function CenterDetailPage() {
  const { centerId } = useParams({ from: '/(public)/centers/$centerId' })
  const navigate = useNavigate()
  const { data: authData } = useQuery(useAuthUser())

  const { data, isLoading, error } = useQuery(centerById(centerId))
  const center = data?.data

  const handleBookNow = (screeningTypeId?: string) => {
    const serviceId = screeningTypeId || center?.services?.[0]?.id
    const bookingPath = `/patient/book/pay?centerId=${centerId}${serviceId ? `&screeningTypeId=${serviceId}` : ''}`

    const isPatient =
      authData?.data?.user?.profile?.toLowerCase() === 'patient'

    if (isPatient) {
      navigate({
        to: '/patient/book/pay',
        search: {
          centerId,
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !center) {
    return (
      <div className="min-h-screen bg-gray-50 wrapper py-16 text-center">
        <Building2 className="mx-auto h-12 w-12 text-gray-300" />
        <h1 className="mt-4 text-2xl font-bold">Center not found</h1>
        <p className="mt-2 text-muted-foreground">
          This center may no longer be available.
        </p>
        <Button asChild className="mt-6">
          <Link to="/centers">Browse centers</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="wrapper py-8">
          <button
            type="button"
            onClick={() => navigate({ to: '/centers' })}
            className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to centers
          </button>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold">{center.centerName}</h1>
              <div className="mt-3 flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <p>{center.address}</p>
                  <p className="font-medium text-foreground">
                    {center.lga}, {center.state}
                  </p>
                </div>
              </div>
              {center.phone && (
                <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{center.phone}</span>
                </div>
              )}
            </div>

            <Button
              size="lg"
              className="bg-secondary hover:bg-secondary/90"
              disabled={center.status !== 'ACTIVE'}
              onClick={() => handleBookNow()}
            >
              {center.status !== 'ACTIVE' ? 'Center Unavailable' : 'Book Now'}
            </Button>
          </div>
        </div>
      </div>

      <div className="wrapper py-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-semibold mb-4">Services offered</h2>
            {center.services.length === 0 ? (
              <p className="text-muted-foreground">
                Service details are being updated for this center.
              </p>
            ) : (
              <div className="space-y-3">
                {center.services.map((service) => {
                  const category = getServiceCategoryFromName(service.name)
                  return (
                    <div
                      key={service.id}
                      className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <span
                          className={`mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${serviceTypeBadgeStyles[category]}`}
                        >
                          {getServiceTypeLabel(category)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold text-gray-700">
                          ₦{service.price.toLocaleString()}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={center.status !== 'ACTIVE'}
                          onClick={() => handleBookNow(service.id)}
                        >
                          Book
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-semibold mb-4">Availability</h2>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-blue-600" />
                <div>
                  <p className="font-medium text-foreground">Open weekdays</p>
                  <p>Monday to Friday</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-blue-600" />
                <div>
                  <p className="font-medium text-foreground">Appointment hours</p>
                  <p>9:00 AM – 5:00 PM</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Sign in as a patient to pick a date and time during booking.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
