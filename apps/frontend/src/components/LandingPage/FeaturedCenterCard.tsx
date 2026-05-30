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
    <div className="flex min-w-[260px] max-w-[260px] flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <button
        type="button"
        onClick={goToCenter}
        className="flex flex-1 flex-col p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          {center.status === 'ACTIVE' && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              Active
            </span>
          )}
        </div>

        <p className="mt-4 line-clamp-2 font-semibold text-gray-900">
          {center.centerName}
        </p>

        <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-2">
            {center.lga}, {center.state}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {categories.length > 0 ? (
            categories.map((category) => (
              <span
                key={category}
                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${serviceTypeBadgeStyles[category]}`}
              >
                {getServiceTypeLabel(category)}
              </span>
            ))
          ) : (
            <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500">
              Services updating
            </span>
          )}
        </div>
      </button>

      <button
        type="button"
        onClick={goToCenter}
        className="mx-5 mb-5 rounded-xl bg-secondary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-secondary/90"
      >
        View Details
      </button>
    </div>
  )
}
