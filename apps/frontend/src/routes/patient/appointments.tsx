import { PatientAppointmentsPage } from '@/components/PatientPage/Appointments/PatientAppointments.page'
import { usePatientAppointments } from '@/services/providers/patient.provider'
import { createFileRoute } from '@tanstack/react-router'

function PatientAppointments() {
  return <PatientAppointmentsPage />
}

export const Route = createFileRoute('/patient/appointments')({
  component: PatientAppointments,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(usePatientAppointments({}))
  },
})
