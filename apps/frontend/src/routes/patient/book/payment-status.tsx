import { PatientPaymentStatusPage } from '@/components/PatientPage/Book/PatientPaymentStatus.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/patient/book/payment-status')({
  component: () => {
    const { ref } = Route.useSearch()
    return <PatientPaymentStatusPage paymentRef={ref} />
  },
  validateSearch: (search: Record<string, unknown>) => {
    return {
      ref: (search.ref as string) || '',
      // type: (search.type as string) || 'appointment_booking',
    }
  },
})
