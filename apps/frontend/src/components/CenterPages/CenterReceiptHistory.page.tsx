import { Button } from '@/components/shared/ui/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shared/ui/tabs'
import { useAuthUser } from '@/services/providers/auth.provider'
import {
  centerBalance,
  centerPayouts,
  centerTransactionHistory,
} from '@/services/providers/payout.provider'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import * as walletService from '@/services/wallet.service'
import { CashoutHistoryTable } from './CashoutHistoryTable'
import { FinancialSummary } from './FinancialSummary'
import { PayoutTable } from './PayoutTable'
import { TransactionTable } from './TransactionTable'
import type { Transaction } from './TransactionTable'

export function CenterReceiptHistoryPage() {
  const authUserQuery = useQuery(useAuthUser())
  const centerId = authUserQuery.data?.data?.user?.id

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<string>('ALL')
  const [page] = useState(1)

  // Fetch legacy data
  const { data: balanceData, isLoading: balanceLoading } = useQuery(
    centerBalance(centerId || ''),
  )

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery(
    centerTransactionHistory(centerId || '', { page, limit: 20 }),
  )

  const { data: payoutsData, isLoading: payoutsLoading } = useQuery(
    centerPayouts(centerId || '', { page, limit: 10 }),
  )

  // NEW: Fetch wallet data
  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['centerWallet', centerId],
    queryFn: () => walletService.getCenterWalletBalance(centerId!),
    enabled: !!centerId,
  })

  const { data: cashoutsData, isLoading: cashoutsLoading } = useQuery({
    queryKey: ['centerCashouts', centerId, page],
    queryFn: () => walletService.getCenterCashouts(centerId!, { page, pageSize: 10 }),
    enabled: !!centerId,
  })

  const balance = balanceData?.data
  const walletBalance = walletData?.data?.balance
  const transactions: Transaction[] =
    (transactionsData?.data?.transactions as Transaction[]) || []
  const payouts = payoutsData?.data?.payouts || []
  const cashouts = cashoutsData?.data?.data || []

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction: Transaction) => {
      const query = searchTerm.toLowerCase()
      const matchesSearch =
        transaction.id.toLowerCase().includes(query) ||
        transaction.appointments.some(
          (apt) =>
            apt.patient.fullName.toLowerCase().includes(query) ||
            apt.screeningType.name.toLowerCase().includes(query),
        )

      const matchesStatus =
        statusFilter === 'ALL' || transaction.status === statusFilter
      const matchesPayoutStatus =
        payoutStatusFilter === 'ALL' ||
        (payoutStatusFilter === 'PAID_OUT' && transaction.payoutItem) ||
        (payoutStatusFilter === 'PENDING' && !transaction.payoutItem)

      return matchesSearch && matchesStatus && matchesPayoutStatus
    })
  }, [transactions, searchTerm, statusFilter, payoutStatusFilter])

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setPayoutStatusFilter('ALL')
  }

  if (authUserQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading center information...</p>
      </div>
    )
  }

  if (!centerId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          Center information not available
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Records</h1>
          <p className="text-muted-foreground">
            View your transaction history, receipts, and payout records
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Records
        </Button>
      </div>

      {/* Financial Summary Cards */}
      <FinancialSummary 
        balance={balance} 
        walletBalance={walletBalance}
        centerId={centerId}
        isLoading={balanceLoading || walletLoading} 
      />

      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="cashouts">Cashout History</TabsTrigger>
          <TabsTrigger value="payouts">Payout History (Legacy)</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <TransactionTable
            transactions={filteredTransactions}
            isLoading={transactionsLoading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            payoutStatusFilter={payoutStatusFilter}
            setPayoutStatusFilter={setPayoutStatusFilter}
            onClearFilters={handleClearFilters}
          />
        </TabsContent>

        <TabsContent value="cashouts" className="space-y-4">
          <CashoutHistoryTable 
            cashouts={cashouts} 
            isLoading={cashoutsLoading} 
          />
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <PayoutTable payouts={payouts} isLoading={payoutsLoading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
