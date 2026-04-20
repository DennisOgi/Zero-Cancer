import calendarIcon from '@/assets/images/calendar.png'
import stethoscopeIcon from '@/assets/images/stethoscope.png'
import { Button } from '@/components/shared/ui/button'
import { Card, CardContent } from '@/components/shared/ui/card'
import { Link, useNavigate } from '@tanstack/react-router'
import type { TPatientAppointment } from '@zerocancer/shared/types'
import { Loader2 } from 'lucide-react'

interface UpcomingAppointmentsPanelProps {
  appointment: TPatientAppointment | null | undefined
  isLoading: boolean
}

const AppointmentItem = ({
  appointment,
}: {
  appointment: TPatientAppointment
}) => {
  const navigate = useNavigate()
  return (
    <div className="bg-blue-50/50 p-4 rounded-xl space-y-3">
      <div className="flex items-start gap-3">
        <img src={stethoscopeIcon} alt="screening" className="w-8 h-8 mt-1" />
        <div className="flex-1">
          <h4 className="font-bold text-gray-800">
            {appointment.screeningType?.name}
          </h4>
          <p className="text-sm text-gray-500 font-mono">
            {appointment.id.slice(-10).toUpperCase()}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {appointment.center?.centerName}
          </p>
          <p className="text-sm text-gray-600">
            {new Date(appointment.appointmentDateTime).toLocaleDateString(
              'en-US',
              {
                weekday: 'short',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              },
            )}
          </p>
        </div>
        {/* <p className="text-sm font-medium text-gray-700">
          {new Date(appointment.appointmentTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p> */}
      </div>
      <Button
        onClick={() => navigate({ to: '/patient/appointments' })}
        className="w-full bg-pink-600 hover:bg-pink-700 text-white rounded-lg"
      >
        View Details
      </Button>
    </div>
  )
}

export default function UpcomingAppointmentsPanel({
  appointment,
  isLoading,
}: UpcomingAppointmentsPanelProps) {
  const navigate = useNavigate()

  const handleSeeAll = () => {
    navigate({ to: '/patient/appointments' })
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={calendarIcon} alt="Appointments" className="w-7 h-7" />
            <h3 className="text-lg font-semibold text-gray-800">
              Appointments
            </h3>
          </div>
          <Button variant="link" onClick={handleSeeAll} className="text-sm">
            See All
          </Button>
        </div>

        {isLoading ? (
          <div className="h-[150px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : appointment ? (
          <AppointmentItem appointment={appointment} />
        ) : (
          <div className="text-center py-10 text-muted-foreground bg-gray-50/80 rounded-xl">
            <p>You have no upcoming appointments.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
