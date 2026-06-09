import AppointmentCard from '@/components/shared/AppointmentCard'

interface PatientAppointmentsListProps {
  appointments: any[]
  onCancel: (appointmentId: string) => void
  cancellingId?: string | null
}

export function PatientAppointmentsList({
  appointments,
  onCancel,
  cancellingId,
}: PatientAppointmentsListProps) {
  return (
    <div className="grid sm:grid-cols-2 gap-6 mt-4">
      {appointments.map((appt: any) => (
        <AppointmentCard
          key={appt.id}
          appointment={appt}
          onCancel={onCancel}
          isCancelling={cancellingId === appt.id}
        />
      ))}
    </div>
  )
}
