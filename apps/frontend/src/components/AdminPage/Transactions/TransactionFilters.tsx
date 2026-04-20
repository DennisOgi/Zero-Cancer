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

export interface TransactionFiltersProps {
  typeFilter: 'ALL' | 'DONATION' | 'APPOINTMENT' | 'PAYOUT' | 'REFUND'
  statusFilter: 'ALL' | 'PENDING' | 'COMPLETED' | 'FAILED'
  dateFromFilter: string
  dateToFilter: string
  setTypeFilter: (
    v: 'ALL' | 'DONATION' | 'APPOINTMENT' | 'PAYOUT' | 'REFUND',
  ) => void
  setStatusFilter: (v: 'ALL' | 'PENDING' | 'COMPLETED' | 'FAILED') => void
  setDateFromFilter: (v: string) => void
  setDateToFilter: (v: string) => void
  onClear: () => void
}

export default function TransactionFilters(props: TransactionFiltersProps) {
  const {
    typeFilter,
    statusFilter,
    dateFromFilter,
    dateToFilter,
    setTypeFilter,
    setStatusFilter,
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
        <div className="grid gap-4 md:grid-cols-5">
          <div>
            <Label htmlFor="type-filter">Transaction Type</Label>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="DONATION">Donations</SelectItem>
                <SelectItem value="APPOINTMENT">Appointments</SelectItem>
                <SelectItem value="PAYOUT">Payouts</SelectItem>
                <SelectItem value="REFUND">Refunds</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status-filter">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
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
