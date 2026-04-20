import AppointmentPicture from '@/assets/images/appointment.png'
import { Button } from '@/components/shared/ui/button'
import { Link } from '@tanstack/react-router'

interface PatientAppointmentsEmptyStateProps {
  title: string
  description: string
  showBookButton?: boolean
}

export function PatientAppointmentsEmptyState({
  title,
  description,
  showBookButton = false,
}: PatientAppointmentsEmptyStateProps) {
  return (
    <div className="text-center py-16 px-6 bg-gray-50 rounded-lg border-2 border-dashed">
      <div className="flex justify-center mb-4">
        <img src={AppointmentPicture} alt="appointment" className="w-16 h-16" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      <p className="text-muted-foreground mt-2 mb-6">{description}</p>
      {showBookButton && (
        <Button asChild className="bg-pink-600 hover:bg-pink-700 text-white">
          <Link to="/patient/book">Book Screening</Link>
        </Button>
      )}
    </div>
  )
}
