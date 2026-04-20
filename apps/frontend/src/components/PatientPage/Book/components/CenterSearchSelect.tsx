import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface Center {
  id: string
  centerName: string
  lga: string
  state: string
  address: string
}

interface CenterSearchSelectProps {
  centers: Center[]
  value: string
  onChange: (id: string) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  loading?: boolean
  error?: any
}

export function CenterSearchSelect({
  centers,
  value,
  onChange,
  searchQuery,
  setSearchQuery,
  loading,
  error,
}: CenterSearchSelectProps) {
  const filteredCenters = centers.filter((center) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      center.centerName.toLowerCase().includes(query) ||
      center.lga.toLowerCase().includes(query) ||
      center.state.toLowerCase().includes(query) ||
      center.address.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-2">
      <Input
        placeholder="Type to search centers..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        disabled={loading}
      />

      {searchQuery && (
        <div className="border rounded-md max-h-48 overflow-y-auto bg-white">
          {filteredCenters.length > 0 ? (
            filteredCenters.map((center) => (
              <div
                key={center.id}
                className={cn(
                  'p-3 cursor-pointer hover:bg-gray-100 border-b last:border-b-0',
                  value === center.id && 'bg-blue-50 border-blue-200',
                )}
                onClick={() => {
                  onChange(center.id)
                  setSearchQuery(center.centerName)
                }}
              >
                <div className="flex items-center gap-2">
                  {value === center.id && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium">{center.centerName}</span>
                    <span className="text-sm text-muted-foreground">
                      {center.lga}, {center.state}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {center.address}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-sm text-muted-foreground">
              No centers found
            </div>
          )}
        </div>
      )}

      {value && !searchQuery && (
        <div className="text-sm text-green-600">✓ Selected</div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
          Loading available centers...
        </div>
      )}
      {error && (
        <div className="text-sm text-destructive mt-2">
          Failed to load centers. Please try refreshing the page.
        </div>
      )}
    </div>
  )
}

export default CenterSearchSelect
