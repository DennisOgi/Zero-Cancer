import AppointmentCard from '@/components/shared/AppointmentCard'
import { Button } from '@/components/shared/ui/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shared/ui/tabs'
import {
  useCancelPatientAppointment,
  usePatientAppointments,
} from '@/services/providers/patient.provider'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { PatientAppointmentsList } from './PatientAppointmentsList'
import { PatientAppointmentsEmptyState } from './PatientAppointmentsEmptyState'

export function PatientAppointmentsPage() {
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const cancelMutation = useCancelPatientAppointment()

  const {
    data: appointmentsData,
    isLoading,
    error,
  } = useQuery({
    ...usePatientAppointments({}),
    refetchInterval: 1000 * 15,
  })

  const handleCancelAppointment = (appointmentId: string) => {
    setCancellingId(appointmentId)
    cancelMutation.mutate(
      { appointmentId, reason: 'Cancelled by patient' },
      {
        onSuccess: () => {
          toast.success('Appointment cancelled successfully')
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.error || 'Failed to cancel appointment',
          )
        },
        onSettled: () => setCancellingId(null),
      },
    )
  }

  const appointments = (appointmentsData?.data?.appointments || []).filter(
    (appt) => appt.status !== 'PENDING',
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const pastAppointments = appointments.filter(
    (appt) => appt.status === 'COMPLETED',
  )
  const upcomingAppointments = appointments.filter(
    (appt) =>
      appt.status === 'SCHEDULED' &&
      new Date(appt.appointmentDateTime) >= today,
  )
  const ongoingAppointments = appointments.filter(
    (appt) => appt.status === 'IN_PROGRESS',
  )
  const cancelledAppointments = appointments.filter(
    (appt) => appt.status === 'CANCELLED',
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">
            Loading your appointments...
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-medium text-destructive">
            Error loading appointments
          </h3>
          <p className="text-muted-foreground">
            Please try refreshing the page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground mt-1">
            Manage your screening bookings easily.
          </p>
        </div>
        <Button
          asChild
          className="bg-pink-600 hover:bg-pink-700 text-white hidden sm:flex"
        >
          <Link to="/patient/book">Book Screening</Link>
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-4 sm:max-w-lg">
          <TabsTrigger value="ongoing">
            Ongoing ({ongoingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({cancelledAppointments.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          {upcomingAppointments.length > 0 ? (
            <PatientAppointmentsList
              appointments={upcomingAppointments}
              onCancel={handleCancelAppointment}
              cancellingId={cancellingId}
            />
          ) : (
            <PatientAppointmentsEmptyState
              title="No Upcoming Appointments"
              description="Click the button below to book an appointment"
              showBookButton
            />
          )}
        </TabsContent>
        <TabsContent value="ongoing">
          {ongoingAppointments.length > 0 ? (
            <PatientAppointmentsList
              appointments={ongoingAppointments}
              onCancel={handleCancelAppointment}
              cancellingId={cancellingId}
            />
          ) : (
            <PatientAppointmentsEmptyState
              title="No Ongoing Appointments"
              description="Appointments that are currently in progress will appear here."
            />
          )}
        </TabsContent>
        <TabsContent value="past">
          {pastAppointments.length > 0 ? (
            <PatientAppointmentsList
              appointments={pastAppointments}
              onCancel={handleCancelAppointment}
              cancellingId={cancellingId}
            />
          ) : (
            <PatientAppointmentsEmptyState
              title="No Past Appointments"
              description="Your completed appointment history will appear here."
            />
          )}
        </TabsContent>
        <TabsContent value="cancelled">
          {cancelledAppointments.length > 0 ? (
            <PatientAppointmentsList
              appointments={cancelledAppointments}
              onCancel={handleCancelAppointment}
              cancellingId={cancellingId}
            />
          ) : (
            <PatientAppointmentsEmptyState
              title="No Cancelled Appointments"
              description="Your cancelled appointments will be listed here."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
