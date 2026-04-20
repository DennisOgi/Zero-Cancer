import { Input } from '@/components/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import { Search } from 'lucide-react'

interface CenterUploadResultsFiltersProps {
  statusFilter: string
  onStatusChange: (value: string) => void
  searchTerm: string
  onSearchChange: (value: string) => void
}

export function CenterUploadResultsFilters({
  statusFilter,
  onStatusChange,
  searchTerm,
  onSearchChange,
}: CenterUploadResultsFiltersProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by patient name or screening type..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="completed">Needs Results</SelectItem>
          <SelectItem value="all">All Eligible</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
