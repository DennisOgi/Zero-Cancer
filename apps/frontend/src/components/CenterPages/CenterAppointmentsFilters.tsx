import { Input } from '@/components/shared/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/shared/ui/tabs'
import { Search } from 'lucide-react'

export interface CenterAppointmentsFiltersProps {
  status: string
  onStatusChange: (v: string) => void
  search: string
  onSearchChange: (v: string) => void
}

export default function CenterAppointmentsFilters({ status, onStatusChange, search, onSearchChange }: CenterAppointmentsFiltersProps) {
  return (
    <div className="flex justify-between items-center">
      <Tabs value={status} onValueChange={onStatusChange}>
        <TabsList>
          <TabsTrigger value="ALL">All</TabsTrigger>
          <TabsTrigger value="SCHEDULED">Scheduled</TabsTrigger>
          <TabsTrigger value="IN_PROGRESS">In Progress</TabsTrigger>
          <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
          <TabsTrigger value="CANCELED">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by patient name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  )
}
