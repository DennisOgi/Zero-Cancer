import { AdminTransactionsPage } from '@/components/AdminPage/Transactions/AdminTransactions.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/transactions')({
  component: AdminTransactionsPage,
})
