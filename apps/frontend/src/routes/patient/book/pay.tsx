import { PatientPayBookingPage } from '@/components/PatientPage/Book/PatientPayBooking.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/patient/book/pay')({
  component: () => {
    const search = Route.useSearch()
    return <PatientPayBookingPage screeningTypeId={search.screeningTypeId} />
  },
  validateSearch: (search) => ({
    screeningTypeId: search.screeningTypeId as string | undefined,
  }),
})
