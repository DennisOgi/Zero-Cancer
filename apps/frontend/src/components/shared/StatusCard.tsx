import scheduledIllustration from '@/assets/images/center.png'
import notScreenedIllustration from '@/assets/images/girl-think.png'
import { Button } from '@/components/shared/ui/button'
import { useNavigate } from '@tanstack/react-router'
import type { TPatientAppointment } from '@zerocancer/shared/types'
import { ArrowRight } from 'lucide-react'

interface StatusCardProps {
  appointment: TPatientAppointment | null | undefined
}

export default function StatusCard({ appointment }: StatusCardProps) {
  const navigate = useNavigate()

  const handleBookScreening = () => {
    navigate({ to: '/patient/book' })
  }

  const handleViewDetails = () => {
    if (appointment) {
      navigate({
        to: '/patient/appointments',
      })
    }
  }

  const isScheduled = !!appointment

  return (
    <div
      className={`w-full rounded-2xl p-6 flex items-center justify-between transition-colors duration-300 ${
        isScheduled ? 'bg-yellow-50' : 'bg-pink-50'
      }`}
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-600">Status</p>
        <h2
          className={`text-2xl lg:text-3xl font-bold ${
            isScheduled ? 'text-yellow-900' : 'text-pink-900'
          }`}
        >
          {isScheduled ? 'Screening Scheduled' : 'Not Screened'}
        </h2>
        <p className="text-gray-500">
          <span className="font-semibold">Location:</span>{' '}
          {isScheduled
            ? `${appointment.center?.centerName}, ${new Date(
                appointment.appointmentDate,
              ).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })} |  ${new Date(appointment.appointmentTime).toLocaleTimeString(
                [],
                {
                  hour: '2-digit',
                  minute: '2-digit',
                },
              )}`
            : '-'}
        </p>
        <div className="pt-2">
          {isScheduled ? (
            <Button
              onClick={handleViewDetails}
              className="bg-pink-600 hover:bg-pink-700 text-white rounded-lg px-6"
            >
              View Details
            </Button>
          ) : (
            <Button
              onClick={handleBookScreening}
              className="bg-pink-600 hover:bg-pink-700 text-white rounded-lg px-6 flex items-center gap-2"
            >
              Book Screening <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="w-1/3 flex justify-center">
        <img
          src={isScheduled ? scheduledIllustration : notScreenedIllustration}
          alt={isScheduled ? 'Screening scheduled' : 'Not screened'}
          className="h-36 object-contain hidden lg:block"
        />
      </div>
    </div>
  )
}
