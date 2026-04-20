import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shared/ui/table'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'

interface Appointment {
  id: string
  patient?: {
    fullName: string
  }
  appointmentDateTime: string
  screeningType?: {
    name: string
  }
  status: string
}

interface AppointmentTableProps {
  appointments: Appointment[]
  isLoading?: boolean
  emptyMessage?: string
}

const formatTime = (dateString: string) => {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return 'Invalid Time'
  }
}

export function AppointmentTable({
  appointments,
  isLoading = false,
  emptyMessage = 'No appointments found',
}: AppointmentTableProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading appointments...
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient Name</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.map((appt) => (
          <TableRow key={appt.id}>
            <TableCell className="font-medium">
              {appt.patient?.fullName || 'Unknown Patient'}
            </TableCell>
            <TableCell>{formatTime(appt.appointmentDateTime)}</TableCell>
            <TableCell>{appt.screeningType?.name || 'Unknown Type'}</TableCell>
            <TableCell>
              <AppointmentStatusBadge status={appt.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
