import { createFileRoute } from '@tanstack/react-router'
import { CenterReceiptHistoryPage } from '@/components/CenterPages/CenterReceiptHistory.page'

export const Route = createFileRoute('/center/receipt-history')({
  component: CenterReceiptHistoryPage,
})
