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
  useAdminCenters,
  useUpdateCenterStatus,
} from '@/services/providers/admin.provider'
import { MapPin, Stethoscope, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import CenterFilters from './CenterFilters'

export type CenterStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export function AdminCentersPage() {
  // Filters state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CenterStatus | 'ALL'>('ALL')
  const [stateFilter, setStateFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  // Status update dialog state
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean
    center: any
    newStatus: CenterStatus
    reason: string
  }>({
    open: false,
    center: null,
    newStatus: 'ACTIVE',
    reason: '',
  })

  // Build query parameters
  const queryParams = {
    page,
    pageSize: 20,
    ...(statusFilter !== 'ALL' && { status: statusFilter }),
    ...(stateFilter && { state: stateFilter }),
    ...(search && { search }),
  }

  // Fetch centers data
  const {
    data: centersData,
    isLoading,
    error,
    refetch,
  } = useAdminCenters(queryParams)

  // Status update mutation
  const updateStatusMutation = useUpdateCenterStatus()

  const handleStatusUpdate = async () => {
    if (!statusDialog.center) return

    try {
      await updateStatusMutation.mutateAsync({
        centerId: statusDialog.center.id,
        status: statusDialog.newStatus,
        reason: statusDialog.reason || undefined,
      })

      toast.success(`Center status updated to ${statusDialog.newStatus}`)
      setStatusDialog((prev) => ({ ...prev, open: false, reason: '' }))
      refetch()
    } catch (error) {
      toast.error('Failed to update center status')
    }
  }

  const openStatusDialog = (center: any, newStatus: CenterStatus) => {
    setStatusDialog({
      open: true,
      center,
      newStatus,
      reason: '',
    })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default'
      case 'INACTIVE':
        return 'secondary'
      case 'SUSPENDED':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('ALL')
    setStateFilter('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Centers Management</h1>
        <p className="text-muted-foreground">
          Manage and monitor all screening centers in the platform
        </p>
      </div>

      {/* Filters */}
      <CenterFilters
        search={search}
        statusFilter={statusFilter}
        stateFilter={stateFilter}
        setSearch={setSearch}
        setStatusFilter={setStatusFilter}
        setStateFilter={setStateFilter}
        reset={resetFilters}
      />

      {/* Centers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Centers ({centersData?.data?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading centers...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center h-64 flex items-center justify-center">
              <div>
                <p className="text-red-600 mb-4">Failed to load centers</p>
                <Button onClick={() => refetch()}>Try Again</Button>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Center Details</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Staff & Services</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {centersData?.data?.centers?.map((center) => (
                    <TableRow key={center.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{center.centerName}</div>
                          <div className="text-sm text-muted-foreground">
                            {center.email}
                          </div>
                          {center.phone && (
                            <div className="text-sm text-muted-foreground">
                              {center.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm">
                              {center.state}, {center.lga}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {center.address}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(center.status)}>
                          {center.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="h-4 w-4" />
                            <span>{center.staff?.length || 0} staff</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Stethoscope className="h-4 w-4" />
                            <span>{center.services?.length || 0} services</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {center.status !== 'ACTIVE' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openStatusDialog(center, 'ACTIVE')}
                            >
                              Activate
                            </Button>
                          )}
                          {center.status !== 'SUSPENDED' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                openStatusDialog(center, 'SUSPENDED')
                              }
                            >
                              Suspend
                            </Button>
                          )}
                          {center.status !== 'INACTIVE' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                openStatusDialog(center, 'INACTIVE')
                              }
                            >
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )) || []}
                </TableBody>
              </Table>

              {/* Pagination */}
              {centersData?.data?.totalPages &&
                centersData.data.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Page {centersData.data.page} of{' '}
                      {centersData.data.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= centersData.data.totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
            </>
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
            <DialogTitle>Update Center Status</DialogTitle>
            <DialogDescription>
              Change the status of "{statusDialog.center?.centerName}" to{' '}
              <strong>{statusDialog.newStatus}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason (Optional)</Label>
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
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
