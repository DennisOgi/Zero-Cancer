import { PatientPayBookingPage } from '@/components/PatientPage/Book/PatientPayBooking.page'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const bookingSearchSchema = z.object({
  screeningTypeId: z.string().optional(),
  centerId: z.string().optional(),
})

export const Route = createFileRoute('/patient/book/pay')({
  component: () => {
    const search = Route.useSearch()
    return (
      <PatientPayBookingPage
        screeningTypeId={search.screeningTypeId}
        centerId={search.centerId}
      />
    )
  },
  validateSearch: bookingSearchSchema,
})
