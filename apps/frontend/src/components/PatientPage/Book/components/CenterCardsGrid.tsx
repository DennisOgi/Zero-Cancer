import { cn } from '@/lib/utils'
import { MapPin } from 'lucide-react'

interface Center {
  id: string
  centerName: string
  lga: string
  state: string
  address: string
}

interface CenterCardsGridProps {
  centers: Center[]
  value: string
  onSelect: (center: Center) => void
}

export function CenterCardsGrid({
  centers,
  value,
  onSelect,
}: CenterCardsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {centers.map((center) => (
        <div
          key={center.id}
          className={cn(
            'p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md',
            value === center.id
              ? 'border-pink-500 bg-pink-50'
              : 'border-gray-200 hover:border-gray-300',
          )}
          onClick={() => onSelect(center)}
        >
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{center.centerName}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              {center.lga}, {center.state}
            </div>
            <p className="text-sm text-gray-500">{center.address}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default CenterCardsGrid
