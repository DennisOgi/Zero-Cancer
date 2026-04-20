import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { formatCurrency } from '@/lib/utils'
import { useAuthUser } from '@/services/providers/auth.provider'
import {
  centerAppointments,
  centerById,
} from '@/services/providers/center.provider'
import { centerTransactionHistory } from '@/services/providers/payout.provider'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

// Component imports
import { AppointmentTable } from './AppointmentTable'
import { DashboardStats } from './DashboardStats'
import { QuickActions } from './QuickActions'

// Asset imports
import appointmentIcon from '@/assets/images/appointment.png'
import healthIcon from '@/assets/images/health.png'
import peopleIcon from '@/assets/images/people.png'
import screeningIcon from '@/assets/images/screening.png'
import treatmentIcon from '@/assets/images/treatment.png'
import viewIcon from '@/assets/images/view.png'

export function CenterDashboard() {
  const authUserQuery = useQuery(useAuthUser())
  const user = authUserQuery.data?.data?.user
  const centerId = user?.id

  // Fetch recent appointments, center data, and today's transactions
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    ...centerAppointments({ page: 1, pageSize: 100 }),
    enabled: !!centerId,
  })

  const { data: centerData, isLoading: centerLoading } = useQuery({
    ...centerById(centerId!),
    enabled: !!centerId,
  })

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const { data: todaysTransactionsData, isLoading: todaysTransactionsLoading } =
    useQuery({
      ...centerTransactionHistory(centerId!, {
        startDate: todayStart,
        endDate: todayEnd,
      }),
      enabled: !!centerId,
    })

  // Client-side calculations from fetched data
  const allAppointments = appointmentsData?.data?.appointments || []
  const todayStr = new Date().toISOString().split('T')[0]

  const todaysAppointments = allAppointments.filter((apt: any) =>
    apt.appointmentDateTime.startsWith(todayStr),
  )

  const completedAppointments = allAppointments.filter(
    (a: any) => a.status === 'COMPLETED',
  )
  const appointmentsWithResults = completedAppointments.filter(
    (a: any) => (a as any).result,
  ).length
  const appointmentCompletionRate =
    completedAppointments.length > 0
      ? (appointmentsWithResults / completedAppointments.length) * 100
      : 0

  const totalAppointmentsToday = todaysAppointments.length
  const totalStaff = centerData?.data?.staff?.length ?? 0
  const totalEarnedToday =
    todaysTransactionsData?.data?.transactions?.reduce(
      (sum: number, t: any) => sum + t.amount,
      0,
    ) ?? 0

  const appointmentsForTable = todaysAppointments.slice(0, 5)
  const centerName = user?.fullName || 'Acme Center'

  const metricsLoading =
    appointmentsLoading || centerLoading || todaysTransactionsLoading

  const stats = [
    {
      title: 'Total Staff',
      value: totalStaff,
      description: 'People',
      icon: peopleIcon,
      color: 'bg-blue-100',
    },
    {
      title: 'Total Appointments Today',
      value: totalAppointmentsToday,
      description: 'Scheduled',
      icon: appointmentIcon,
      color: 'bg-purple-100',
    },
    {
      title: 'Total Earned Today',
      value: formatCurrency(totalEarnedToday),
      description: 'NGN',
      icon: healthIcon,
      color: 'bg-green-100',
    },
    {
      title: 'Result Upload Compliance',
      value: `${Math.round(appointmentCompletionRate)}%`,
      description: 'of recent completed',
      icon: treatmentIcon,
      color: 'bg-red-100',
    },
  ]

  const quickActions = [
    {
      label: 'Verify Check-in',
      link: '/center/verify-code',
      icon: screeningIcon,
      isPrimary: true,
    },
    {
      label: 'Manage Appointment',
      link: '/center/appointments',
      icon: appointmentIcon,
    },
    { label: 'Invite Staff', link: '/center/staff', icon: peopleIcon },
    {
      label: 'Upload Results',
      link: '/center/upload-results',
      icon: treatmentIcon,
    },
    { label: 'View Report', link: '#', icon: viewIcon },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {centerName} 👋</h1>
          <p className="text-muted-foreground">
            Here's an overview of your center's activity.
          </p>
        </div>
      </div>

      <DashboardStats stats={stats} isLoading={metricsLoading} />

      <QuickActions actions={quickActions} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today's Appointments</CardTitle>
            <Button variant="link" size="sm" asChild>
              <Link to="/center/appointments">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <AppointmentTable
              appointments={appointmentsForTable}
              isLoading={appointmentsLoading}
              emptyMessage="No appointments for today"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Activity Feed</CardTitle>
            <Button variant="link" size="sm">
              See All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              No recent activity.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
