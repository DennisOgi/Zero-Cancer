import { AdminAppointmentsPage } from '@/components/AdminPage/Appointments/AdminAppointments.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/appointments')({
  component: AdminAppointmentsPage,
})
