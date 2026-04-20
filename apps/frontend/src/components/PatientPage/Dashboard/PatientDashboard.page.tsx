import calendar from '@/assets/images/calendar.png'
import cross from '@/assets/images/cross.png'
import ScreeningCard from '@/components/shared/ScreeningCard'
import StatusCard from '@/components/shared/StatusCard'
import { Button } from '@/components/shared/ui/button'
import { useAuthUser } from '@/services/providers/auth.provider'
import { useNotifications } from '@/services/providers/notification.provider'
import { usePatientAppointments } from '@/services/providers/patient.provider'
import { useAllScreeningTypes } from '@/services/providers/screeningType.provider'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import type { TScreeningType } from '@zerocancer/shared/types'
import NotificationsPanel from './NotificationsPanel'
import UpcomingAppointmentsPanel from './UpcomingAppointmentsPanel'

export function PatientDashboardPage() {
  const navigate = useNavigate()

  const { data: authData } = useQuery(useAuthUser())
  const {
    data: screeningTypesData,
    isLoading: screeningTypesLoading,
    error: screeningTypesError,
  } = useQuery(useAllScreeningTypes())
  const {
    data: appointmentsData,
    isLoading: appointmentsLoading,
    error: appointmentsError,
  } = useQuery(usePatientAppointments({}))

  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    error: notificationsError,
  } = useQuery(useNotifications())

  const notifications = notificationsData?.data || []

  const handlePayAndBook = (screeningId: string) => {
    navigate({
      to: '/patient/book/pay',
      search: { screeningTypeId: screeningId },
    })
  }

  const userName = authData?.data?.user?.fullName?.split(' ')[0] || 'Patient'
  const allAppointments = appointmentsData?.data?.appointments || []
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Set to the beginning of the day

  const upcomingAppointment =
    allAppointments
      .filter(
        (apt: any) =>
          new Date(apt.appointmentDateTime) >= today &&
          apt.status === 'SCHEDULED',
      )
      .sort(
        (a: any, b: any) =>
          new Date(a.appointmentDateTime).getTime() -
          new Date(b.appointmentDateTime).getTime(),
      )[0] || null

  return (
    <div className="">
      <div className="bg-white p-4 lg:p-6 rounded-lg">
        <h1 className="text-3xl font-bold">Welcome, {userName}👋</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Here's a summary of your health journey.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4 lg:py-6">
        <div className="lg:col-span-2 space-y-6">
          <StatusCard appointment={upcomingAppointment} />

          <div className="flex gap-4 w-full">
            <Link
              to="/patient/book"
              className="flex items-center justify-center w-1/2"
            >
              <div className="w-full px-12 h-36 lg:h-28 bg-blue-100 rounded-lg flex items-center justify-center gap-2 flex-col">
                <img src={cross} alt="cross" className="w-8 h-8" />
                <span className="text-lg font-medium text-neutral-800 text-center">
                  Book Screening
                </span>
              </div>
            </Link>

            <Link
              to="/patient/appointments"
              className="flex items-center justify-center w-1/2"
            >
              <div className="w-full px-12 h-36 lg:h-28 bg-blue-100 rounded-lg flex items-center justify-center gap-2 flex-col">
                <img src={calendar} alt="cross" className="w-8 h-8" />
                <span className="text-lg font-medium text-neutral-800 text-center">
                  View Appointments
                </span>
              </div>
            </Link>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Book a New Screening</h2>
              <Link to="/patient/book">
                <Button variant="link">View All</Button>
              </Link>
            </div>
            <div className="space-y-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {screeningTypesLoading ? (
                <p>Loading screenings...</p>
              ) : screeningTypesError ? (
                <p>Error loading screenings.</p>
              ) : (
                (screeningTypesData?.data || [])
                  .slice(0, 5)
                  .map((screeningType: TScreeningType) => (
                    <ScreeningCard
                      key={screeningType.id}
                      screeningType={screeningType}
                      handlePayAndBook={handlePayAndBook}
                    />
                  ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <NotificationsPanel
            notifications={notifications}
            isLoading={notificationsLoading}
          />
          <UpcomingAppointmentsPanel
            appointment={upcomingAppointment}
            isLoading={appointmentsLoading}
          />
        </div>
      </div>
    </div>
  )
}
