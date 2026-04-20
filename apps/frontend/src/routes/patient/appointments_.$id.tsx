import { PatientAppointmentDetailsPage } from '@/components/PatientPage/Appointments/PatientAppointmentDetails.page'
import { PatientAppointmentDetailsSkeleton } from '@/components/PatientPage/Appointments/PatientAppointmentDetails.skeleton'
import { usePatientAppointmentById } from '@/services/providers/patient.provider'
import { createFileRoute } from '@tanstack/react-router'

function RouteComponent() {
  const { id } = Route.useParams()
  return <PatientAppointmentDetailsPage appointmentId={id} />
}

export const Route = createFileRoute('/patient/appointments_/$id')({
  component: RouteComponent,
  pendingComponent: PatientAppointmentDetailsSkeleton,
  loader: ({ context, params }) => {
    return context.queryClient.ensureQueryData(usePatientAppointmentById(params.id))
  },
})
