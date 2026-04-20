/**
 * Admin Waitlist Management Component
 *
 * This component demonstrates how to use the waitlist matching trigger
 * in an admin dashboard. It provides:
 *
 * 1. Real-time statistics about waitlist and matching status
 * 2. One-click manual trigger for the matching algorithm
 * 3. Service health monitoring
 * 4. Auto-refresh capabilities
 * 5. Comprehensive waitlist data tables and analytics
 * 6. Hot zones and demand trend analysis
 *
 * Usage:
 * - Import this component in your admin dashboard
 * - The component handles authentication through existing auth middleware
 * - Statistics auto-refresh every 5 minutes
 * - Manual trigger invalidates cache and refreshes data
 */

import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shared/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shared/ui/tabs'
import { useAdminWaitlist } from '@/services/providers/admin.provider'
import {
  useTriggerWaitlistMatching,
  waitlistMatchingStats,
  waitlistMatchingStatus,
} from '@/services/providers/waitlist.provider'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import React, { useState } from 'react'

type WaitlistStatus = 'PENDING' | 'MATCHED' | 'CLAIMED' | 'EXPIRED'

const AdminWaitlistPanel: React.FC = () => {
  // State for filters
  const [statusFilter, setStatusFilter] = useState<WaitlistStatus | undefined>(
    undefined,
  )
  const [stateFilter, setStateFilter] = useState<string | undefined>(undefined)
  const [screeningTypeFilter, setScreeningTypeFilter] = useState<
    string | undefined
  >(undefined)
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch waitlist matching data
  const stats = useQuery(waitlistMatchingStats())
  const status = useQuery(waitlistMatchingStatus())
  const triggerMatching = useTriggerWaitlistMatching()

  // Fetch waitlist entries for data table
  const waitlistEntries = useAdminWaitlist({
    page: 1,
    pageSize: 50,
    status: statusFilter,
    state: stateFilter,
    screeningTypeId: screeningTypeFilter,
  })

  // Fetch analytics data for hot zones
  const waitlistByState = useAdminWaitlist({
    groupBy: 'state',
    status: 'PENDING', // Focus on pending for hot zones
  })

  const waitlistByScreeningType = useAdminWaitlist({
    groupBy: 'screening_type',
    status: 'PENDING',
  })

  // Manual trigger function
  const handleTriggerMatch = () => {
    triggerMatching.mutate()
  }

  // Helper functions
  const getStatusColor = (serviceStatus?: string) => {
    switch (serviceStatus) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (serviceStatus?: string) => {
    switch (serviceStatus) {
      case 'healthy':
        return <CheckCircle className="w-3 h-3" />
      case 'warning':
        return <AlertCircle className="w-3 h-3" />
      case 'error':
        return <AlertCircle className="w-3 h-3" />
      default:
        return <RefreshCw className="w-3 h-3" />
    }
  }

  const getWaitlistStatusBadge = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      MATCHED: 'bg-green-100 text-green-800',
      CLAIMED: 'bg-blue-100 text-blue-800',
      EXPIRED: 'bg-red-100 text-red-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
  }

  // Type guards for union types
  const isWaitlistEntriesData = (
    data: any,
  ): data is { waitlistEntries: any[]; total: number } => {
    return data && 'waitlistEntries' in data
  }

  const isAggregationData = (
    data: any,
  ): data is { aggregation: any[]; groupBy: string } => {
    return data && 'aggregation' in data
  }

  const handleStatusFilterChange = (value: string) => {
    if (value === 'all') {
      setStatusFilter(undefined)
    } else {
      setStatusFilter(value as WaitlistStatus)
    }
  }

  return (
    <div className="space-y-6">
      {/* Service Status Badge */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Waitlist Management</h2>
        <Badge
          className={`${getStatusColor((status?.data as any)?.status)} flex items-center gap-1`}
        >
          {getStatusIcon((status?.data as any)?.status)}
          Service: {(status?.data as any)?.status || 'Unknown'}
        </Badge>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview & Stats</TabsTrigger>
          <TabsTrigger value="entries">Waitlist Entries</TabsTrigger>
          <TabsTrigger value="analytics">Hot Zones & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Patients
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {(stats?.data as any)?.pending || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Waiting for matches
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Matched Patients
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {(stats?.data as any)?.matched || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successfully matched
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Recent Matches
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {(stats?.data as any)?.recentMatches || 0}
                </div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Campaigns
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {(stats?.data as any)?.campaigns?.active || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {(stats?.data as any)?.campaigns?.total || 0} total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Actions Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Manual Actions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Trigger the waitlist matching algorithm to process pending
                patients
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Manual Trigger Button */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Run Matching Algorithm</h4>
                  <p className="text-sm text-muted-foreground">
                    Process up to 10 patients per screening type and match them
                    to available campaigns
                  </p>
                </div>
                <Button
                  onClick={handleTriggerMatch}
                  disabled={triggerMatching.isPending}
                  className="ml-4"
                >
                  {triggerMatching.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    'Run Matching'
                  )}
                </Button>
              </div>

              {/* Success Message */}
              {triggerMatching.isSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <h4 className="font-medium text-green-800">
                        Matching Completed Successfully!
                      </h4>
                      <p className="text-sm text-green-700">
                        Execution time:{' '}
                        {triggerMatching.data?.data?.executionTime}ms
                      </p>
                      <p className="text-sm text-green-700">
                        Triggered by:{' '}
                        {triggerMatching.data?.data?.triggeredBy?.adminEmail}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {triggerMatching.isError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <div>
                      <h4 className="font-medium text-red-800">
                        Matching Failed
                      </h4>
                      <p className="text-sm text-red-700">
                        {triggerMatching.error?.message ||
                          'Unknown error occurred'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Information Panel */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <p>
                    Processes up to 10 pending patients per screening type (FCFS
                    order)
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <p>
                    Skips patients with 3+ unclaimed allocations or existing
                    matches
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <p>
                    Prioritizes most specific campaigns, then highest amount,
                    then earliest created
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    4
                  </div>
                  <p>
                    Falls back to general donor pool if no specific campaign
                    matches
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    5
                  </div>
                  <p>
                    Creates notifications for matched patients and updates
                    campaign balances
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Waitlist Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={statusFilter || 'all'}
                    onValueChange={handleStatusFilterChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="MATCHED">Matched</SelectItem>
                      <SelectItem value="CLAIMED">Claimed</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select
                    value={stateFilter || 'all'}
                    onValueChange={(value) =>
                      setStateFilter(value === 'all' ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All states" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All states</SelectItem>
                      <SelectItem value="Lagos">Lagos</SelectItem>
                      <SelectItem value="Abuja">Abuja</SelectItem>
                      <SelectItem value="Kano">Kano</SelectItem>
                      <SelectItem value="Rivers">Rivers</SelectItem>
                      <SelectItem value="Oyo">Oyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Screening Type</Label>
                  <Select
                    value={screeningTypeFilter || 'all'}
                    onValueChange={(value) =>
                      setScreeningTypeFilter(
                        value === 'all' ? undefined : value,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All screening types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All screening types</SelectItem>
                      {/* These would be dynamically loaded in a real implementation */}
                      <SelectItem value="cervical-cancer">
                        Cervical Cancer
                      </SelectItem>
                      <SelectItem value="breast-cancer">
                        Breast Cancer
                      </SelectItem>
                      <SelectItem value="colorectal-cancer">
                        Colorectal Cancer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Waitlist Entries Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Waitlist Entries (
                {waitlistEntries.data?.data &&
                isWaitlistEntriesData(waitlistEntries.data.data)
                  ? waitlistEntries.data.data.total
                  : 0}
                )
              </CardTitle>
            </CardHeader>
            <CardContent>
              {waitlistEntries.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Screening Type</TableHead>
                      <TableHead>State/City</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Claimed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waitlistEntries.data?.data &&
                    isWaitlistEntriesData(waitlistEntries.data.data) ? (
                      waitlistEntries.data.data.waitlistEntries?.map(
                        (entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {entry.patient.fullName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {entry.patient.id}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{entry.screening.name}</TableCell>
                            <TableCell>
                              {entry.patient.patientProfile?.state && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {entry.patient.patientProfile.state}
                                  {entry.patient.patientProfile.city &&
                                    `, ${entry.patient.patientProfile.city}`}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={getWaitlistStatusBadge(entry.status)}
                              >
                                {entry.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(entry.joinedAt)}</TableCell>
                            <TableCell>
                              {entry.claimedAt
                                ? formatDate(entry.claimedAt)
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ),
                      )
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No waitlist entries found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hot Zones by State */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Demand Hot Zones by State
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  States with highest pending waitlist demand
                </p>
              </CardHeader>
              <CardContent>
                {waitlistByState.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {waitlistByState.data?.data &&
                    isAggregationData(waitlistByState.data.data) ? (
                      waitlistByState.data.data.aggregation
                        ?.slice(0, 10)
                        .map((item, index) => (
                          <div
                            key={item.state || index}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  item.count > 20
                                    ? 'bg-red-500'
                                    : item.count > 10
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                }`}
                              />
                              <span className="font-medium">
                                {item.state || 'Unknown'}
                              </span>
                            </div>
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              <Users className="h-3 w-3" />
                              {item.count} pending
                            </Badge>
                          </div>
                        ))
                    ) : (
                      <p className="text-center py-8 text-muted-foreground">
                        No state data available
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Demand by Screening Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Demand by Screening Type
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Most requested screening types
                </p>
              </CardHeader>
              <CardContent>
                {waitlistByScreeningType.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {waitlistByScreeningType.data?.data &&
                    isAggregationData(waitlistByScreeningType.data.data) ? (
                      waitlistByScreeningType.data.data.aggregation
                        ?.slice(0, 10)
                        .map((item, index) => (
                          <div
                            key={item.screeningType || index}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  item.count > 15
                                    ? 'bg-red-500'
                                    : item.count > 8
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                }`}
                              />
                              <span className="font-medium">
                                {item.screeningType || 'Unknown'}
                              </span>
                            </div>
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              <Target className="h-3 w-3" />
                              {item.count} pending
                            </Badge>
                          </div>
                        ))
                    ) : (
                      <p className="text-center py-8 text-muted-foreground">
                        No screening type data available
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center p-6">
                <MapPin className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Hot Zone Alert
                  </p>
                  <p className="text-2xl font-bold">
                    {waitlistByState.data?.data &&
                    isAggregationData(waitlistByState.data.data)
                      ? waitlistByState.data.data.aggregation?.filter(
                          (item) => item.count > 20,
                        ).length || 0
                      : 0}
                  </p>
                  <p className="text-xs text-red-600">
                    States with 20+ pending
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <Target className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    High Demand
                  </p>
                  <p className="text-2xl font-bold">
                    {waitlistByScreeningType.data?.data &&
                    isAggregationData(waitlistByScreeningType.data.data)
                      ? waitlistByScreeningType.data.data.aggregation?.filter(
                          (item) => item.count > 15,
                        ).length || 0
                      : 0}
                  </p>
                  <p className="text-xs text-orange-600">Screening types</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <Activity className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Coverage
                  </p>
                  <p className="text-2xl font-bold">
                    {waitlistByState.data?.data &&
                    isAggregationData(waitlistByState.data.data)
                      ? waitlistByState.data.data.aggregation?.length || 0
                      : 0}
                  </p>
                  <p className="text-xs text-green-600">States served</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated:{' '}
        {(stats?.data as any)?.lastUpdated
          ? new Date((stats.data as any).lastUpdated).toLocaleString()
          : 'Never'}
      </div>
    </div>
  )
}

export default AdminWaitlistPanel

/**
 * Usage Example in Admin Dashboard:
 *
 * import AdminWaitlistPanel from '@/components/admin/AdminWaitlistPanel';
 *
 * function AdminDashboard() {
 *   return (
 *     <div className="admin-dashboard">
 *       <AdminWaitlistPanel />
 *     </div>
 *   );
 * }
 *
 * The component will automatically:
 * - Load and display waitlist statistics
 * - Check service health status
 * - Provide manual trigger functionality
 * - Auto-refresh data every 5 minutes
 * - Show loading states and error handling
 * - Invalidate cache after successful triggers
 */
