import { Badge } from '@/components/shared/ui/badge'
import { CheckCircle, Clock } from 'lucide-react'

interface CenterAppointmentListProps {
  appointments: any[]
  isLoading: boolean
  selectedId: string
  onSelect: (id: string) => void
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

export function CenterAppointmentList({
  appointments,
  isLoading,
  selectedId,
  onSelect,
}: CenterAppointmentListProps) {
  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No appointments found</p>
          <p className="text-xs">Try adjusting your search</p>
        </div>
      ) : (
        appointments.map((appointment: any) => (
          <div
            key={appointment.id}
            className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
              selectedId === appointment.id
                ? 'border-primary bg-primary/5'
                : 'border-border'
            }`}
            onClick={() => onSelect(appointment.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">
                  {appointment.patient?.fullName || 'Unknown Patient'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {appointment.screeningType?.name || 'Unknown Type'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(appointment.appointmentDateTime)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="outline" className="text-xs">
                  {String(appointment.status || '').toUpperCase()}
                </Badge>
                {selectedId === appointment.id && (
                  <CheckCircle className="h-4 w-4 text-primary" />
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
