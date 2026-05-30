import {
  getCenterServiceCategories,
  getServiceTypeLabel,
  serviceTypeBadgeStyles,
} from '@/lib/service-types'
import type { TCenter } from '@zerocancer/shared/types'
import { useNavigate } from '@tanstack/react-router'
import { Building2, MapPin } from 'lucide-react'

type FeaturedCenterCardProps = {
  center: TCenter
}

export default function FeaturedCenterCard({ center }: FeaturedCenterCardProps) {
  const navigate = useNavigate()
  const categories = getCenterServiceCategories(center.services || [])

  const goToCenter = () =>
    navigate({
      to: '/centers/$centerId',
      params: { centerId: center.id },
    })

  return (
    <div className="flex min-w-[280px] max-w-[280px] flex-shrink-0 flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
      <button type="button" onClick={goToCenter} className="flex-1 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <Building2 className="h-5 w-5" />
          </div>
        </div>

        <p className="mt-4 line-clamp-2 font-semibold text-gray-900">
          {center.centerName}
        </p>

        <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-2">
            {center.lga}, {center.state}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.length > 0 ? (
            categories.map((category) => (
              <span
                key={category}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${serviceTypeBadgeStyles[category]}`}
              >
                {getServiceTypeLabel(category)}
              </span>
            ))
          ) : (
            <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-500">
              Services updating
            </span>
          )}
        </div>
      </button>

      <button
        type="button"
        onClick={goToCenter}
        className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
      >
        Book Now
      </button>
    </div>
  )
}
