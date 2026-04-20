import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog'
import { Label } from '@/components/shared/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shared/ui/table'
import { Textarea } from '@/components/shared/ui/textarea'
import {
  useAdminCampaigns,
  useUpdateAdminCampaignStatus,
} from '@/services/providers/admin.provider'
import { format } from 'date-fns'
import {
  AlertCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Heart,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import CampaignFilters from './CampaignFilters'

export type CampaignStatus = 'ACTIVE' | 'COMPLETED' | 'DELETED'

export function AdminCampaignsPage() {
  // Filters state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'ALL'>(
    'ALL',
  )
  const [page, setPage] = useState(1)

  // Status update dialog state
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean
    campaign: any
    newStatus: CampaignStatus
    reason: string
  }>({
    open: false,
    campaign: null,
    newStatus: 'ACTIVE',
    reason: '',
  })

  // Build query parameters
  const queryParams = {
    page,
    pageSize: 20,
    ...(statusFilter !== 'ALL' && { status: statusFilter }),
    ...(search && { search }),
  }

  // Fetch campaigns data
  const {
    data: campaignsData,
    isLoading,
    error,
    refetch,
  } = useAdminCampaigns(queryParams)

  // Status update mutation
  const updateStatusMutation = useUpdateAdminCampaignStatus()

  const handleStatusUpdate = async () => {
    if (!statusDialog.campaign) return

    try {
      await updateStatusMutation.mutateAsync({
        campaignId: statusDialog.campaign.id,
        status: statusDialog.newStatus,
        reason: statusDialog.reason || undefined,
      })

      toast.success(`Campaign status updated to ${statusDialog.newStatus}`)
      setStatusDialog((prev) => ({ ...prev, open: false, reason: '' }))
      refetch()
    } catch (error) {
      toast.error('Failed to update campaign status')
    }
  }

  const openStatusDialog = (campaign: any, newStatus: CampaignStatus) => {
    setStatusDialog({
      open: true,
      campaign,
      newStatus,
      reason: '',
    })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default'
      case 'COMPLETED':
        return 'secondary'
      case 'DELETED':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const calculateUtilizationRate = (campaign: any) => {
    if (campaign.initialAmount === 0) return 0
    const usedAmount = campaign.initialAmount - campaign.availableAmount
    return Math.round((usedAmount / campaign.initialAmount) * 100)
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('ALL')
    setPage(1)
  }

  const campaigns = campaignsData?.data?.campaigns || []
  const totalPages = campaignsData?.data?.totalPages || 0
  const total = campaignsData?.data?.total || 0

  // Calculate summary stats
  const totalDonated = campaigns.reduce((sum, c) => sum + c.initialAmount, 0)
  const availableFunds = campaigns.reduce(
    (sum, c) => sum + c.availableAmount,
    0,
  )
  const totalPatientsHelped = campaigns.reduce((sum, c) => {
    return sum + (c.allocations?.filter((a) => a.claimedAt).length || 0)
  }, 0)
  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Campaigns Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage all donation campaigns across the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Heart className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Total Campaigns
              </p>
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">
                {activeCampaigns} active
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Total Donated
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(totalDonated)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(totalDonated - availableFunds)} used
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Patients Helped
              </p>
              <p className="text-2xl font-bold">{totalPatientsHelped}</p>
              <p className="text-xs text-muted-foreground">
                Across all campaigns
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Available Funds
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(availableFunds)}
              </p>
              <p className="text-xs text-muted-foreground">
                Ready for allocation
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <CampaignFilters
        search={search}
        statusFilter={statusFilter}
        setSearch={setSearch}
        setStatusFilter={setStatusFilter}
        onClear={clearFilters}
      />

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campaigns ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading campaigns...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-destructive mb-4">
                  Failed to load campaigns
                </p>
                <Button onClick={() => refetch()} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No campaigns found</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign & Donor</TableHead>
                    <TableHead>Financial Status</TableHead>
                    <TableHead>Targeting</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => {
                    const utilizationRate = calculateUtilizationRate(campaign)
                    const claimedAllocations = campaign.allocations.filter(
                      (a) => a.claimedAt,
                    ).length

                    return (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">
                              {campaign.purpose || 'General Campaign'}
                            </p>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              <span>{campaign.donor.fullName}</span>
                              {campaign.donor.donorProfile
                                ?.organizationName && (
                                <span>
                                  (
                                  {campaign.donor.donorProfile.organizationName}
                                  )
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {campaign.donor.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="font-medium">
                                {formatCurrency(campaign.initialAmount)}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>
                                Available:{' '}
                                {formatCurrency(campaign.availableAmount)}
                              </p>
                              <p>
                                Reserved:{' '}
                                {formatCurrency(campaign.reservedAmount)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${utilizationRate}%` }}
                                ></div>
                              </div>
                              <span className="text-xs">
                                {utilizationRate}%
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {campaign.targetState && (
                              <div className="flex items-center space-x-1 text-sm">
                                <Target className="h-3 w-3" />
                                <span>{campaign.targetState}</span>
                                {campaign.targetLga && (
                                  <span>, {campaign.targetLga}</span>
                                )}
                              </div>
                            )}
                            {campaign.targetAgeRange && (
                              <p className="text-sm text-muted-foreground">
                                Age: {campaign.targetAgeRange}
                              </p>
                            )}
                            {campaign.targetGender && (
                              <p className="text-sm text-muted-foreground">
                                Gender:{' '}
                                {campaign.targetGender ? 'Targeted' : 'All'}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {campaign.screeningTypes
                                .slice(0, 2)
                                .map((type) => (
                                  <Badge
                                    key={type.id}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {type.name}
                                  </Badge>
                                ))}
                              {campaign.screeningTypes.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{campaign.screeningTypes.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">
                                {claimedAllocations}
                              </span>
                              <span className="text-muted-foreground">
                                helped
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {campaign.allocations.length} total allocations
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {campaign.transactions.length} transactions
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusBadgeVariant(campaign.status)}
                          >
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">
                              {format(
                                new Date(campaign.createdAt),
                                'MMM dd, yyyy',
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(campaign.createdAt), 'hh:mm a')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {campaign.status === 'ACTIVE' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    openStatusDialog(campaign, 'COMPLETED')
                                  }
                                >
                                  Complete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    openStatusDialog(campaign, 'DELETED')
                                  }
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                            {campaign.status === 'COMPLETED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  openStatusDialog(campaign, 'ACTIVE')
                                }
                              >
                                Reactivate
                              </Button>
                            )}
                            {campaign.status === 'DELETED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  openStatusDialog(campaign, 'ACTIVE')
                                }
                              >
                                Restore
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialog.open}
        onOpenChange={(open) => setStatusDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Campaign Status</DialogTitle>
            <DialogDescription>
              Change the status of "
              {statusDialog.campaign?.purpose || 'this campaign'}" to{' '}
              {statusDialog.newStatus.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for status change..."
                value={statusDialog.reason}
                onChange={(e) =>
                  setStatusDialog((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
              />
            </div>
            {statusDialog.newStatus === 'DELETED' && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-800">
                  This action will mark the campaign as deleted and may affect
                  ongoing allocations.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setStatusDialog((prev) => ({ ...prev, open: false }))
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={updateStatusMutation.isPending}
              variant={
                statusDialog.newStatus === 'DELETED' ? 'destructive' : 'default'
              }
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
