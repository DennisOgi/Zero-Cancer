import { Input } from '@/components/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import { Search } from 'lucide-react'

export default function CampaignFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}: {
  searchTerm: string
  setSearchTerm: (v: string) => void
  statusFilter: 'ACTIVE' | 'COMPLETED' | 'DELETED' | undefined
  setStatusFilter: (v: 'ACTIVE' | 'COMPLETED' | 'DELETED' | undefined) => void
}) {
  return (
    <div className="p-4 flex items-center gap-4">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search campaigns by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select
        value={statusFilter || 'ALL'}
        onValueChange={(value) =>
          setStatusFilter(value === 'ALL' ? undefined : (value as any))
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Statuses</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
          <SelectItem value="DELETED">Deleted</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
