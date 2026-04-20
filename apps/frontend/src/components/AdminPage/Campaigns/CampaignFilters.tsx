import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Input } from '@/components/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import { Search } from 'lucide-react'
import type { CampaignStatus } from './AdminCampaigns.page'

export interface CampaignFiltersProps {
  search: string
  statusFilter: CampaignStatus | 'ALL'
  setSearch: (v: string) => void
  setStatusFilter: (v: CampaignStatus | 'ALL') => void
  onClear: () => void
}

export default function CampaignFilters({
  search,
  statusFilter,
  setSearch,
  setStatusFilter,
  onClear,
}: CampaignFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as CampaignStatus | 'ALL')}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="DELETED">Deleted</SelectItem>
            </SelectContent>
          </Select>
          <div />
          <Button variant="outline" onClick={onClear}>
            Clear Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
