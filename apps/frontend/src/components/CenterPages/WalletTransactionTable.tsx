import { Badge } from '@/components/shared/ui/badge'
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
import { ArrowDownIcon, ArrowUpIcon, ExternalLinkIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'

interface WalletTransaction {
  id: string
  type: 'CREDIT' | 'DEBIT' | 'CASHOUT'
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string
  appointmentId?: string
  transactionId?: string
  cashoutId?: string
  createdAt: Date
}

interface WalletTransactionTableProps {
  transactions: WalletTransaction[]
  isLoading?: boolean
}

export function WalletTransactionTable({
  transactions,
  isLoading,
}: WalletTransactionTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
            <div className="h-10 w-10 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/4" />
            </div>
            <div className="h-6 bg-muted rounded w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No transactions yet</p>
        <p className="text-sm mt-1">
          Your wallet transactions will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Balance After</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {transaction.type === 'CREDIT' ? (
                    <div className="p-2 bg-green-100 rounded-full">
                      <ArrowDownIcon className="h-4 w-4 text-green-600" />
                    </div>
                  ) : (
                    <div className="p-2 bg-red-100 rounded-full">
                      <ArrowUpIcon className="h-4 w-4 text-red-600" />
                    </div>
                  )}
                  <Badge
                    variant={
                      transaction.type === 'CREDIT' ? 'default' : 'secondary'
                    }
                  >
                    {transaction.type}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">
                    {transaction.description}
                  </p>
                  {transaction.appointmentId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Appointment: {transaction.appointmentId.slice(0, 8)}...
                    </p>
                  )}
                  {transaction.cashoutId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Cashout: {transaction.cashoutId.slice(0, 8)}...
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={
                    transaction.type === 'CREDIT'
                      ? 'text-green-600 font-semibold'
                      : 'text-red-600 font-semibold'
                  }
                >
                  {transaction.type === 'CREDIT' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-medium">
                  {formatCurrency(transaction.balanceAfter)}
                </span>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <p>{format(new Date(transaction.createdAt), 'MMM dd, yyyy')}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(transaction.createdAt), 'HH:mm')}
                  </p>
                </div>
              </TableCell>
              <TableCell className="text-right">
                {transaction.appointmentId && (
                  <Link
                    to="/center/appointments"
                    search={{ appointmentId: transaction.appointmentId }}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    View
                    <ExternalLinkIcon className="h-3 w-3" />
                  </Link>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
