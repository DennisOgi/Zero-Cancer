import { Card, CardContent } from '@/components/shared/ui/card'
import {
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Heart,
  XCircle,
} from 'lucide-react'

export interface TransactionsStatsProps {
  totalAmount: number
  completedCount: number
  completedAmount: number
  pendingCount: number
  failedCount: number
  donationAmount: number
  appointmentAmount: number
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

export default function TransactionsStats({
  totalAmount,
  completedCount,
  completedAmount,
  pendingCount,
  failedCount,
  donationAmount,
  appointmentAmount,
}: TransactionsStatsProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Total Volume
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Completed
              </p>
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(completedAmount)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Pending
              </p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Failed
              </p>
              <p className="text-2xl font-bold">{failedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center p-6">
            <Heart className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Donations Revenue
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(donationAmount)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Appointments Revenue
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(appointmentAmount)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
