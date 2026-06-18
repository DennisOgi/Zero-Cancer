import { Badge } from '@/components/shared/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shared/ui/table'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  LoaderIcon,
  WalletIcon,
} from 'lucide-react'
import type { CashoutRecord } from '@/services/wallet.service'

interface CashoutHistoryTableProps {
  cashouts: CashoutRecord[]
  isLoading?: boolean
}

export function CashoutHistoryTable({
  cashouts,
  isLoading,
}: CashoutHistoryTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cashout History</CardTitle>
          <CardDescription>
            View all your cashout requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2">
              <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Loading cashout history...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!cashouts || cashouts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cashout History</CardTitle>
          <CardDescription>
            View all your cashout requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <WalletIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No cashouts yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              When you request a cashout, it will appear here. You can request a
              cashout when your wallet balance is at least ₦1,000.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = (status: CashoutRecord['status']) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2Icon className="h-3 w-3 mr-1" />
            Success
          </Badge>
        )
      case 'PROCESSING':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <LoaderIcon className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <ClockIcon className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case 'FAILED':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertCircleIcon className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cashout History</CardTitle>
        <CardDescription>
          View all your cashout requests and their status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Net Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashouts.map((cashout) => (
                <TableRow key={cashout.id}>
                  <TableCell className="font-medium">
                    {format(new Date(cashout.createdAt), 'MMM dd, yyyy')}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(cashout.createdAt), 'hh:mm a')}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(cashout.amount)}
                  </TableCell>
                  <TableCell className="text-red-600">
                    -{formatCurrency(cashout.fee)}
                  </TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {formatCurrency(cashout.netAmount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(cashout.status)}</TableCell>
                  <TableCell>
                    {cashout.completedAt ? (
                      <>
                        {format(new Date(cashout.completedAt), 'MMM dd, yyyy')}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(cashout.completedAt), 'hh:mm a')}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">
              Total Requested
            </p>
            <p className="text-2xl font-bold">
              {formatCurrency(
                cashouts.reduce((sum, c) => sum + c.amount, 0)
              )}
            </p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Fees</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(
                cashouts.reduce((sum, c) => sum + c.fee, 0)
              )}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">
              Total Received
            </p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(
                cashouts
                  .filter((c) => c.status === 'SUCCESS')
                  .reduce((sum, c) => sum + c.netAmount, 0)
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
