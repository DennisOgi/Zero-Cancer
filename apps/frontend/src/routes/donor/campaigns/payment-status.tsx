import { PaymentStatusPage } from '@/components/DonorPage/PaymentStatus/PaymentStatus.page'
import { paymentRefFromSearch } from '@/lib/payment-ref'
import { createFileRoute } from '@tanstack/react-router'

function DonorPaymentStatusPage() {
  const { ref, campaignId } = Route.useSearch()
  return <PaymentStatusPage paymentRef={ref} campaignId={campaignId} />
}

export const Route = createFileRoute('/donor/campaigns/payment-status')({
  component: DonorPaymentStatusPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      ref: paymentRefFromSearch(search),
      type: (search.type as string) || '',
      campaignId: (search.campaignId as string) || '',
    }
  },
})
