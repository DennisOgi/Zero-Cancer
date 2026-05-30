import {
  getCenterServiceCategories,
  getServiceTypeLabel,
  serviceTypeBadgeStyles,
} from '@/lib/service-types'
import type { TCenter } from '@zerocancer/shared/types'
import { useNavigate } from '@tanstack/react-router'
import { Building2, CheckCircle2, MapPin } from 'lucide-react'

type FeaturedCenterCardProps = {
  center: TCenter
}

export default function FeaturedCenterCard({ center }: FeaturedCenterCardProps) {
  const navigate = useNavigate()
  const categories = getCenterServiceCategories(center.services || [])
  const isActive = center.status === 'ACTIVE'

  const goToCenter = () =>
    navigate({
      to: '/centers/$centerId',
      params: { centerId: center.id },
    })

  return (
    <div className="group flex w-[280px] shrink-0 flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-lg ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl sm:w-[300px]">
      <button
        type="button"
        onClick={goToCenter}
        className="flex-1 text-left focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          {isActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
              <CheckCircle2 className="h-3 w-3" />
              Active
            </span>
          )}
        </div>

        <p className="mt-4 line-clamp-2 font-semibold text-gray-900 transition-colors group-hover:text-primary">
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
        className="mt-5 w-full rounded-xl bg-secondary py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-secondary/90"
      >
        Book Now
      </button>
    </div>
  )
}
