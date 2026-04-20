import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { format } from 'date-fns'

// Image assets
import outstandingBalanceIcon from '@/assets/images/calendar.png'
import totalEarningsIcon from '@/assets/images/impact.png'
import totalPayoutsIcon from '@/assets/images/sponsored.png'

interface FinancialSummaryProps {
  balance?: {
    eligibleAmount: number
    totalPaidOut: number
    lastPayoutDate?: string
    transactionCount: number
  }
  isLoading?: boolean
}

export function FinancialSummary({
  balance,
  isLoading,
}: FinancialSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-0 animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-32 mb-2" />
              <div className="h-3 bg-muted rounded w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const totalEarnings =
    (balance?.eligibleAmount || 0) + (balance?.totalPaidOut || 0)

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="border-0 bg-green-100 relative overflow-hidden">
        <CardHeader className="relative z-10">
          <CardTitle className="text-sm font-medium text-green-800">
            Total Earnings
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold text-green-900">
            ₦{totalEarnings.toLocaleString()}
          </div>
          <p className="text-xs text-green-700 mt-1">All time earnings</p>
        </CardContent>
        <img
          src={totalEarningsIcon}
          alt=""
          className="absolute -right-4 -top-4 w-24 h-24 opacity-20"
        />
      </Card>

      <Card className="border-0 bg-blue-100 relative overflow-hidden">
        <CardHeader className="relative z-10">
          <CardTitle className="text-sm font-medium text-blue-800">
            Total Payouts Sent
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold text-blue-900">
            ₦{(balance?.totalPaidOut || 0).toLocaleString()}
          </div>
          <p className="text-xs text-blue-700 mt-1">
            {balance?.lastPayoutDate
              ? `Last payout: ${format(new Date(balance.lastPayoutDate), 'MMM dd, yyyy')}`
              : 'No payouts yet'}
          </p>
        </CardContent>
        <img
          src={totalPayoutsIcon}
          alt=""
          className="absolute -right-4 -bottom-4 w-24 h-24 opacity-20"
        />
      </Card>

      <Card className="border-0 bg-purple-100 relative overflow-hidden">
        <CardHeader className="relative z-10">
          <CardTitle className="text-sm font-medium text-purple-800">
            Outstanding Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold text-purple-900">
            ₦{(balance?.eligibleAmount || 0).toLocaleString()}
          </div>
          <p className="text-xs text-purple-700 mt-1">
            {balance?.transactionCount || 0} eligible transactions
          </p>
        </CardContent>
        <img
          src={outstandingBalanceIcon}
          alt=""
          className="absolute -right-2 -top-2 w-20 h-20 opacity-20"
        />
      </Card>
    </div>
  )
}
