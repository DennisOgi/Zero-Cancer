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
import type { CenterStatus } from './AdminCenters.page'

export interface CenterFiltersProps {
  search: string
  statusFilter: CenterStatus | 'ALL'
  stateFilter: string
  setSearch: (v: string) => void
  setStatusFilter: (v: CenterStatus | 'ALL') => void
  setStateFilter: (v: string) => void
  reset: () => void
}

export default function CenterFilters({
  search,
  statusFilter,
  stateFilter,
  setSearch,
  setStatusFilter,
  setStateFilter,
  reset,
}: CenterFiltersProps) {
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
              placeholder="Search centers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as CenterStatus | 'ALL')}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Filter by state..."
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          />
          <Button variant="outline" onClick={reset}>
            Clear Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
