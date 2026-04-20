import { PaymentStatusPage } from '@/components/DonorPage/PaymentStatus/PaymentStatus.page'
import { createFileRoute } from '@tanstack/react-router'

function DonorPaymentStatusPage() {
  const { ref, campaignId } = Route.useSearch()
  return <PaymentStatusPage paymentRef={ref} campaignId={campaignId} />
}

export const Route = createFileRoute('/donor/campaigns/payment-status')({
  component: DonorPaymentStatusPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      ref: (search.ref as string) || '',
      type: (search.type as string) || '',
      campaignId: (search.campaignId as string) || '',
    }
  },
})
