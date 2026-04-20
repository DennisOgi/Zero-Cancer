import { Badge } from '@/components/shared/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Label } from '@/components/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select'
import {
  useAdminAppointments,
  useAdminCampaigns,
  useAdminCenters,
  useAdminTransactions,
  useAdminUsers,
} from '@/services/providers/admin.provider'
import { format, subDays } from 'date-fns'
import {
  Activity,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle,
  DollarSign,
  Heart,
  MapPin,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useState } from 'react'

export function AdminAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<'7' | '30' | '90'>('30')

  // Calculate date range based on timeframe
  const dateFrom = format(
    subDays(new Date(), parseInt(timeframe)),
    'yyyy-MM-dd',
  )
  const dateTo = format(new Date(), 'yyyy-MM-dd')

  // Fetch aggregated data from all admin endpoints (max pageSize is 100)
  const { data: centersData } = useAdminCenters({ pageSize: 100 })
  const { data: usersData } = useAdminUsers({ pageSize: 100 })
  const { data: campaignsData } = useAdminCampaigns({ pageSize: 100 })
  const { data: appointmentsData } = useAdminAppointments({
    pageSize: 100,
    dateFrom,
    dateTo,
  })
  const { data: transactionsData } = useAdminTransactions({
    pageSize: 100,
    dateFrom,
    dateTo,
  })

  // Future: Waitlist analytics could be added here
  // const { data: waitlistByState } = useQuery(useAdminWaitlist({ groupBy: 'state' }))

  // Process data for analytics
  const centers = centersData?.data?.centers || []
  const users = usersData?.data?.users || []
  const campaigns = campaignsData?.data?.campaigns || []
  const appointments = appointmentsData?.data?.appointments || []
  const transactions = transactionsData?.data?.transactions || []

  // Calculate key metrics
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Platform Overview Metrics
  const totalCenters = centers.length
  const activeCenters = centers.filter((c) => c.status === 'ACTIVE').length
  const totalPatients = users.filter((u) => u.patientProfile).length
  const totalDonors = users.filter((u) => u.donorProfile).length
  const totalCampaigns = campaigns.length
  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length

  // Financial Metrics
  const totalRevenue = transactions
    .filter((t) => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0)

  const donationRevenue = transactions
    .filter((t) => t.type === 'DONATION' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0)

  const appointmentRevenue = transactions
    .filter((t) => t.type === 'APPOINTMENT' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalCampaignFunding = campaigns.reduce(
    (sum, c) => sum + c.initialAmount,
    0,
  )
  const availableFunding = campaigns.reduce(
    (sum, c) => sum + c.availableAmount,
    0,
  )

  // Appointment Analytics
  const totalAppointments = appointments.length
  const completedAppointments = appointments.filter(
    (a) => a.status === 'COMPLETED',
  ).length
  const donationAppointments = appointments.filter((a) => a.isDonation).length
  const selfPayAppointments = appointments.filter((a) => !a.isDonation).length

  // Center Distribution by State
  const centersByState = centers.reduce(
    (acc, center) => {
      acc[center.state] = (acc[center.state] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const topStates = Object.entries(centersByState)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Transaction Status Distribution
  const transactionsByStatus = transactions.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Campaign Performance
  const campaignUtilization =
    totalCampaignFunding > 0
      ? Math.round(
          ((totalCampaignFunding - availableFunding) / totalCampaignFunding) *
            100,
        )
      : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Platform Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and metrics across the Zero Cancer platform
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="space-y-2">
          <Label>Time Period</Label>
          <Select
            value={timeframe}
            onValueChange={(value) => setTimeframe(value as '7' | '30' | '90')}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Platform Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Platform Overview</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Centers
                </p>
                <p className="text-2xl font-bold">{totalCenters}</p>
                <p className="text-xs text-green-600">{activeCenters} active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Users
                </p>
                <p className="text-2xl font-bold">
                  {totalPatients + totalDonors}
                </p>
                <p className="text-xs text-muted-foreground">
                  {totalPatients} patients, {totalDonors} donors
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Heart className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Campaigns
                </p>
                <p className="text-2xl font-bold">{totalCampaigns}</p>
                <p className="text-xs text-green-600">
                  {activeCampaigns} active
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Appointments
                </p>
                <p className="text-2xl font-bold">{totalAppointments}</p>
                <p className="text-xs text-green-600">
                  {completedAppointments} completed
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Financial Analytics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Financial Analytics</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalRevenue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last {timeframe} days
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Heart className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Donation Revenue
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(donationRevenue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {totalRevenue > 0
                    ? Math.round((donationRevenue / totalRevenue) * 100)
                    : 0}
                  % of total
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Self-Pay Revenue
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(appointmentRevenue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {totalRevenue > 0
                    ? Math.round((appointmentRevenue / totalRevenue) * 100)
                    : 0}
                  % of total
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Campaign Utilization
                </p>
                <p className="text-2xl font-bold">{campaignUtilization}%</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(totalCampaignFunding - availableFunding)} used
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Geographic Distribution</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span>Centers by State</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topStates.map(([state, count]) => (
                  <div
                    key={state}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium">{state}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(count / totalCenters) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <span>Transaction Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(transactionsByStatus).map(([status, count]) => {
                  const percentage = (count / transactions.length) * 100
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'COMPLETED':
                        return 'bg-green-600'
                      case 'PENDING':
                        return 'bg-yellow-600'
                      case 'FAILED':
                        return 'bg-red-600'
                      default:
                        return 'bg-gray-600'
                    }
                  }

                  return (
                    <div
                      key={status}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            status === 'COMPLETED'
                              ? 'default'
                              : status === 'PENDING'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getStatusColor(status)}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {count}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Appointment Analytics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Appointment Insights</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center p-6">
              <Heart className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Donation Funded
                </p>
                <p className="text-2xl font-bold">{donationAppointments}</p>
                <p className="text-xs text-muted-foreground">
                  {totalAppointments > 0
                    ? Math.round(
                        (donationAppointments / totalAppointments) * 100,
                      )
                    : 0}
                  % of total
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Self-Pay
                </p>
                <p className="text-2xl font-bold">{selfPayAppointments}</p>
                <p className="text-xs text-muted-foreground">
                  {totalAppointments > 0
                    ? Math.round(
                        (selfPayAppointments / totalAppointments) * 100,
                      )
                    : 0}
                  % of total
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Completion Rate
                </p>
                <p className="text-2xl font-bold">
                  {totalAppointments > 0
                    ? Math.round(
                        (completedAppointments / totalAppointments) * 100,
                      )
                    : 0}
                  %
                </p>
                <p className="text-xs text-muted-foreground">
                  {completedAppointments} of {totalAppointments}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Health */}
      <div>
        <h2 className="text-xl font-semibold mb-4">System Health</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <Activity className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Active Centers
                </p>
                <p className="text-2xl font-bold">
                  {Math.round((activeCenters / totalCenters) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {activeCenters} of {totalCenters}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <CheckCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Transaction Success
                </p>
                <p className="text-2xl font-bold">
                  {transactions.length > 0
                    ? Math.round(
                        ((transactionsByStatus.COMPLETED || 0) /
                          transactions.length) *
                          100,
                      )
                    : 0}
                  %
                </p>
                <p className="text-xs text-muted-foreground">
                  Last {timeframe} days
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Heart className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Active Campaigns
                </p>
                <p className="text-2xl font-bold">
                  {totalCampaigns > 0
                    ? Math.round((activeCampaigns / totalCampaigns) * 100)
                    : 0}
                  %
                </p>
                <p className="text-xs text-muted-foreground">
                  {activeCampaigns} of {totalCampaigns}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Target className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Platform Utilization
                </p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    ((completedAppointments + donationAppointments) /
                      Math.max(totalCenters * 10, 1)) *
                      100,
                  )}
                  %
                </p>
                <p className="text-xs text-muted-foreground">
                  Estimated capacity usage
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
