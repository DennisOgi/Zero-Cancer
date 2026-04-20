import { Badge } from '@/components/shared/ui/badge'
import { cn } from '@/lib/utils'

interface AppointmentStatusBadgeProps {
  status: string
  className?: string
}

export function AppointmentStatusBadge({
  status,
  className,
}: AppointmentStatusBadgeProps) {
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return { label: 'Pending', color: 'bg-orange-400' }
      case 'COMPLETED':
        return { label: 'Completed', color: 'bg-green-500' }
      case 'CANCELLED':
        return { label: 'Missed', color: 'bg-red-500' }
      case 'IN_PROGRESS':
        return { label: 'In Progress', color: 'bg-blue-500' }
      default:
        return { label: status, color: 'bg-gray-500' }
    }
  }

  const { label, color } = getStatusDisplay(status)

  return (
    <Badge className={cn('border-transparent text-white', color, className)}>
      {label}
    </Badge>
  )
}
