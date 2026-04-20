import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import type { AppointmentStatus } from './AdminAppointments.page'

export interface AppointmentFiltersProps {
  statusFilter: AppointmentStatus | 'ALL'
  centerFilter: string
  donationFilter: 'ALL' | 'DONATION' | 'SELF_PAY'
  dateFromFilter: string
  dateToFilter: string
  setStatusFilter: (v: AppointmentStatus | 'ALL') => void
  setCenterFilter: (v: string) => void
  setDonationFilter: (v: 'ALL' | 'DONATION' | 'SELF_PAY') => void
  setDateFromFilter: (v: string) => void
  setDateToFilter: (v: string) => void
  onClear: () => void
}

export default function AppointmentFilters(props: AppointmentFiltersProps) {
  const {
    statusFilter,
    centerFilter,
    donationFilter,
    dateFromFilter,
    dateToFilter,
    setStatusFilter,
    setCenterFilter,
    setDonationFilter,
    setDateFromFilter,
    setDateToFilter,
    onClear,
  } = props

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-6">
          <div>
            <Label htmlFor="status-filter">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as AppointmentStatus | 'ALL')
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="center-filter">Center ID</Label>
            <Input
              id="center-filter"
              placeholder="Filter by center ID..."
              value={centerFilter}
              onChange={(e) => setCenterFilter(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="donation-filter">Type</Label>
            <Select
              value={donationFilter}
              onValueChange={(v) =>
                setDonationFilter(v as 'ALL' | 'DONATION' | 'SELF_PAY')
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="DONATION">Donations</SelectItem>
                <SelectItem value="SELF_PAY">Self Pay</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date-from">Date From</Label>
            <Input
              id="date-from"
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="date-to">Date To</Label>
            <Input
              id="date-to"
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={onClear}>
              Clear Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
