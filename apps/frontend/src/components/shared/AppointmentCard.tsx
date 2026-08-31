import { Button } from '@/components/shared/ui/button'
import { Card, CardContent, CardFooter } from '@/components/shared/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shared/ui/dialog'
import { Link } from '@tanstack/react-router'
import type {
  TAppointmentDetails,
  TPatientAppointment,
} from '@zerocancer/shared/types'
import {
  CalendarDays,
  Clock,
  ExternalLinkIcon,
  FlaskConical,
  MapPin,
} from 'lucide-react'
import CheckInQR from '../CheckInQR'

interface AppointmentCardProps {
  appointment: TPatientAppointment
  onCancel: (appointmentId: string) => void
  isCancelling: boolean
}

export default function AppointmentCard({
  appointment,
  onCancel,
  isCancelling,
}: AppointmentCardProps) {
  const isPast = new Date(appointment.appointmentDateTime) < new Date()
  const hasResult = appointment.result?.id
  const canCancel =
    !isPast &&
    appointment.status === 'SCHEDULED'

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="flex">
        <div>
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <FlaskConical className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <Link
                  to="/patient/appointments/$id"
                  params={{ id: appointment.id }}
                  className="text-gray-800 underline "
                >
                  <h3 className="font-bold text-lg text-gray-800 flex gap-1">
                    <span>
                      {appointment.screeningType?.name || 'Unknown Screening'}
                      <ExternalLinkIcon className="inline size-5 ml-0.5" />
                    </span>
                  </h3>
                </Link>
                <p className="text-sm">
                  Check-in code:{' '}
                  <span className="text-sm font-mono font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded w-fit">
                    {appointment.checkInCode || appointment.id.slice(-10)}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-3 pl-14">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{appointment.center?.centerName}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <CalendarDays className="h-4 w-4" />
              <span className="text-sm">
                {new Date(appointment.appointmentDateTime).toLocaleDateString(
                  undefined,
                  {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  },
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                {new Date(appointment.appointmentDateTime).toLocaleTimeString(
                  [],
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  },
                )}
              </span>
            </div>
          </div>
        </div>
        {appointment.checkInCode && (
          <CheckInQR checkInCode={appointment.checkInCode} />
        )}
      </CardContent>
      {canCancel && (
        <CardFooter className="flex justify-end bg-gray-50 py-3 px-6">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive" disabled={isCancelling}>
                {isCancelling ? 'Cancelling...' : 'Cancel Appointment'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel this appointment?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. You will need to book again if
                  you still want a screening.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Keep appointment</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={() => onCancel(appointment.id)}
                  disabled={isCancelling}
                >
                  {isCancelling ? 'Cancelling...' : 'Yes, cancel'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      )}
    </Card>
  )
}
