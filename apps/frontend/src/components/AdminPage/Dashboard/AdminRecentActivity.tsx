import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Link } from '@tanstack/react-router'
import { Eye } from 'lucide-react'

export interface AdminRecentActivityProps {
  recentAppointments: Array<{
    id: string
    patient?: { fullName?: string }
    center?: { centerName?: string }
    appointmentDateTime: string
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | string
  }>
  recentTransactions: Array<{
    id: string
    type: string
    amount?: number
    paymentChannel?: string | null
    status: 'COMPLETED' | 'PENDING' | 'FAILED' | string
  }>
}

export function AdminRecentActivity({
  recentAppointments,
  recentTransactions,
}: AdminRecentActivityProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Recent Appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Appointments</CardTitle>
            <CardDescription>Latest appointment bookings</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/appointments">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAppointments.length > 0 ? (
              recentAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {appointment.patient?.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {appointment.center?.centerName} •{' '}
                      {new Date(
                        appointment.appointmentDateTime,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      appointment.status === 'SCHEDULED'
                        ? 'secondary'
                        : appointment.status === 'COMPLETED'
                          ? 'default'
                          : appointment.status === 'CANCELLED'
                            ? 'destructive'
                            : 'outline'
                    }
                  >
                    {appointment.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent appointments
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest financial activity</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/transactions">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {transaction.type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ₦{transaction.amount?.toLocaleString()} •{' '}
                      {transaction.paymentChannel || 'N/A'}
                    </p>
                  </div>
                  <Badge
                    variant={
                      transaction.status === 'COMPLETED'
                        ? 'default'
                        : transaction.status === 'PENDING'
                          ? 'secondary'
                          : transaction.status === 'FAILED'
                            ? 'destructive'
                            : 'outline'
                    }
                  >
                    {transaction.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent transactions
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminRecentActivity
