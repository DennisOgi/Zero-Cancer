import { createFileRoute } from '@tanstack/react-router'
import { getCenterAppointmentsSchema } from '@zerocancer/shared/schemas/appointment.schema'
import { z } from 'zod'
import { CenterAppointmentsPage } from '@/components/CenterPages/CenterAppointments.page'

type SearchParams = {
  appointmentId?: string
  status?: z.infer<typeof getCenterAppointmentsSchema>['status']
}

export const Route = createFileRoute('/center/appointments')({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      appointmentId: search.appointmentId as string,
      status: search.status as SearchParams['status'],
    }
  },
  component: () => {
    const { appointmentId, status } = Route.useSearch()
    return <CenterAppointmentsPage appointmentId={appointmentId} status={status} />
  },
})
