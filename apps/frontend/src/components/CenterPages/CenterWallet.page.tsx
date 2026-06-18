import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Badge } from '@/components/shared/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { useAuthUser } from '@/services/providers/auth.provider'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  WalletIcon,
  TrendingUpIcon,
  CalendarIcon,
  DollarSignIcon,
} from 'lucide-react'

// Asset imports
import walletIcon from '@/assets/images/health.png'
import earningsIcon from '@/assets/images/impact.png'
import cashoutIcon from '@/assets/images/sponsored.png'
import transactionIcon from '@/assets/images/appointment.png'

import { WalletStats } from './WalletStats'
import { WalletTransactionTable } from './WalletTransactionTable'
import { CashoutRequestDialog } from './CashoutRequestDialog'
import { EarningsChart } from './EarningsChart'
import * as walletService from '@/services/wallet.service'

export function CenterWalletPage() {
  const authUserQuery = useQuery(useAuthUser())
  const user = authUserQuery.data?.data?.user
  const centerId = user?.id

  // Fetch wallet data from API
  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['centerWallet', centerId],
    queryFn: async () => {
      if (!centerId) throw new Error('Center ID not found')
      const response = await walletService.getCenterWalletBalance(centerId)
      return response.data
    },
    enabled: !!centerId,
  })

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['centerWalletStats', centerId],
    queryFn: async () => {
      if (!centerId) throw new Error('Center ID not found')
      const response = await walletService.getCenterWalletStats(centerId)
      return response.data
    },
    enabled: !!centerId,
  })

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['centerWalletTransactions', centerId],
    queryFn: async () => {
      if (!centerId) throw new Error('Center ID not found')
      const response = await walletService.getCenterWalletTransactions(centerId, {
        page: 1,
        pageSize: 50,
      })
      return response.data
    },
    enabled: !!centerId,
  })

  const { data: cashoutsData, isLoading: cashoutsLoading } = useQuery({
    queryKey: ['centerCashouts', centerId],
    queryFn: async () => {
      if (!centerId) throw new Error('Center ID not found')
      const response = await walletService.getCenterCashouts(centerId, {
        page: 1,
        pageSize: 50,
      })
      return response.data
    },
    enabled: !!centerId,
  })

  const balance = walletData?.balance || 0
  const stats = statsData || { 
    totalEarnings: 0, 
    totalCredits: 0, 
    totalDebits: 0, 
    transactionCount: 0 
  }
  const isLoading = walletLoading || statsLoading

  // Calculate derived stats for display
  const today = 0 // TODO: Calculate from transactions
  const thisWeek = 0 // TODO: Calculate from transactions
  const thisMonth = stats.totalCredits // Use total credits as monthly earnings

  const walletStats = [
    {
      title: 'Current Balance',
      value: formatCurrency(balance),
      description: 'Available for cashout',
      icon: walletIcon,
      color: 'bg-green-100',
      trend: null,
    },
    {
      title: 'Today\'s Earnings',
      value: formatCurrency(today),
      description: 'From completed appointments',
      icon: earningsIcon,
      color: 'bg-blue-100',
      trend: null,
    },
    {
      title: 'This Week',
      value: formatCurrency(thisWeek),
      description: 'Last 7 days',
      icon: transactionIcon,
      color: 'bg-purple-100',
      trend: null,
    },
    {
      title: 'Total Earnings',
      value: formatCurrency(stats.totalEarnings),
      description: 'All time earnings',
      icon: cashoutIcon,
      color: 'bg-orange-100',
      trend: null,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <WalletIcon className="h-8 w-8 text-primary" />
            Wallet
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your earnings and request cashouts
          </p>
        </div>
        <CashoutRequestDialog
          currentBalance={balance}
          centerId={centerId!}
          disabled={balance < 1000}
        />
      </div>

      {/* Stats Cards */}
      <WalletStats stats={walletStats} isLoading={isLoading} />

      {/* Balance Card with Gradient */}
      <Card className="border-0 bg-gradient-to-br from-primary to-primary/80 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <p className="text-white/80 text-sm font-medium">
                Available Balance
              </p>
              <p className="text-5xl font-bold tracking-tight">
                {isLoading ? '...' : formatCurrency(balance)}
              </p>
              <p className="text-white/70 text-sm">
                Last updated: {walletData?.updatedAt ? format(new Date(walletData.updatedAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <CashoutRequestDialog
                currentBalance={balance}
                centerId={centerId!}
                disabled={balance < 1000}
                variant="secondary"
              />
              {balance < 1000 && (
                <p className="text-white/70 text-xs text-center">
                  Minimum cashout: ₦1,000
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5 text-primary" />
              Earnings Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EarningsChart data={statsData} isLoading={statsLoading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-xl font-bold">
                  {formatCurrency(stats.totalEarnings)}
                </p>
              </div>
              <ArrowUpIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total Credits</p>
                <p className="text-xl font-bold">
                  {formatCurrency(stats.totalCredits)}
                </p>
              </div>
              <DollarSignIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-xl font-bold">
                  {stats.transactionCount}
                </p>
              </div>
              <ArrowDownIcon className="h-5 w-5 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transaction History</CardTitle>
          <Button variant="outline" size="sm">
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <WalletTransactionTable
            transactions={transactionsData?.data || []}
            isLoading={transactionsLoading}
          />
        </CardContent>
      </Card>

      {/* Cashout History */}
      <Card>
        <CardHeader>
          <CardTitle>Cashout History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cashoutsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading cashouts...
              </div>
            ) : !cashoutsData?.data || cashoutsData.data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No cashouts yet
              </div>
            ) : (
              cashoutsData.data.map((cashout: any) => (
                <div
                  key={cashout.id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">
                        {formatCurrency(cashout.amount)}
                      </p>
                      <Badge
                        variant={
                          cashout.status === 'SUCCESS'
                            ? 'default'
                            : cashout.status === 'PENDING'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {cashout.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Fee: {formatCurrency(cashout.fee)} • Net:{' '}
                      {formatCurrency(cashout.netAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(cashout.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  {cashout.completedAt && (
                    <p className="text-xs text-muted-foreground">
                      Completed:{' '}
                      {format(new Date(cashout.completedAt), 'MMM dd, HH:mm')}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
