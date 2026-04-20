import appointment from '@/assets/images/appointment.png'
import AppointmentCard from '@/components/shared/AppointmentCard'
import { Button } from '@/components/shared/ui/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shared/ui/tabs'
import { usePatientAppointments } from '@/services/providers/patient.provider'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PatientAppointmentsList } from './PatientAppointmentsList'
import { PatientAppointmentsEmptyState } from './PatientAppointmentsEmptyState'

export function PatientAppointmentsPage() {
  const {
    data: appointmentsData,
    isLoading,
    error,
  } = useQuery({
    ...usePatientAppointments({}),
    refetchInterval: 1000 * 15, // If scanning for QRcode, refresh every 15 seconds
  })

  const handleCancelAppointment = (appointmentId: string) => {
    toast.info('Cancelling appointment...')
  }

  const appointments = (appointmentsData?.data?.appointments || []).filter(
    (appt) => appt.status !== 'PENDING',
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0) // Set to beginning of today

  // Correct filtering logic:
  // - Past: All completed appointments (regardless of original date)
  // - Upcoming: Only scheduled appointments in the future
  // - Ongoing: All in-progress appointments
  // - Cancelled: All cancelled appointments
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
