import { DonationPaymentStatus } from '@/components/DonationPaymentStatus'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(public)/donation/payment-status')({
  component: DonationPaymentStatusRoute,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      ref: (search.ref as string) || '',
      type: (search.type as string) || '',
    }
  },
})

function DonationPaymentStatusRoute() {
  const { ref, type } = Route.useSearch()
  return <DonationPaymentStatus paymentRef={ref} type={type} />
}
