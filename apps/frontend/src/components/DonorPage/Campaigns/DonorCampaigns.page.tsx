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
import {
  useDeleteCampaign,
  useDonorCampaigns,
} from '@/services/providers/donor.provider'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import health from '@/assets/images/health.png'
import location from '@/assets/images/location.png'
import megaphone from '@/assets/images/megaphone.png'
import sponsored from '@/assets/images/sponsored.png'
import CampaignFilters from './CampaignFilters'
import CampaignsTable from './CampaignsTable'

// Helper function to format currency concisely
const formatCurrency = (amount: number) => {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(0)}K`
  return `₦${amount}`
}

function StatCard({
  title,
  value,
  unit,
  icon,
  color,
  loading,
}: {
  title: string
  value: string | number
  unit: string
  icon: string
  color: string
  loading: boolean
}) {
  return (
    <Card className={`p-5 ${color} border-0 shadow-sm`}>
      <div className="flex justify-between items-center mb-1">
        <p className="text-sm font-semibold">{title}</p>
        <img src={icon} alt={title} className="w-9 h-9 opacity-70" />
      </div>
      {loading ? (
        <div className="h-9 w-1/2 bg-gray-400/20 rounded-md animate-pulse mt-2" />
      ) : (
        <p className="text-3xl font-bold">{value}</p>
      )}
      <p className="text-xs">{unit}</p>
    </Card>
  )
}

export function DonorCampaignsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'ACTIVE' | 'COMPLETED' | 'DELETED' | undefined
  >(undefined)
  const [page] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<any>(null)

  const {
    data: campaignsData,
    isLoading,
    error,
  } = useQuery(
    useDonorCampaigns({
      page,
      pageSize: 10,
      status: statusFilter,
      search: searchTerm || undefined,
    }),
  )

  const deleteCampaignMutation = useDeleteCampaign()

  const campaigns = campaignsData?.data?.campaigns || []

  // Note: These stats are calculated from ALL campaigns, not just the paginated result.
  const totalCampaigns = campaignsData?.data?.total || 0
  const totalSponsored = campaigns.reduce(
    (sum, c) => sum + (c.patientAllocations?.patientsHelped || 0),
    0,
  )
  const totalDonated = campaigns.reduce((sum, c) => sum + c.fundingAmount, 0)
  const locationsImpacted = new Set(
    campaigns.flatMap((c) => c.targetStates || []),
  ).size

  const handleDeleteCampaign = (campaign: any) => {
    setCampaignToDelete(campaign)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (campaignToDelete) {
      try {
        await deleteCampaignMutation.mutateAsync({
          campaignId: campaignToDelete.id,
          action: 'recycle_to_general',
          reason: 'Deleted by donor',
        })
        toast.success(`Campaign "${campaignToDelete.title}" deleted.`)
        setDeleteDialogOpen(false)
        setCampaignToDelete(null)
      } catch (err) {
        toast.error('Failed to delete campaign.')
      }
    }
  }

  return (
    <div className="p-2 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">My Campaigns</h1>
        <p className="text-gray-500 mt-1">
          Create and manage your donation campaigns to help patients access
          screening services.
        </p>
      </div>

      <div className="border-b border-dashed border-gray-200 -mx-8"></div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Campaigns"
          value={totalCampaigns}
          unit="People"
          icon={megaphone}
          color="bg-green-50 text-green-800"
          loading={isLoading}
        />
        <StatCard
          title="Total Sponsored"
          value={totalSponsored}
          unit="People"
          icon={sponsored}
          color="bg-blue-50 text-blue-800"
          loading={isLoading}
        />
        <StatCard
          title="Total Donated"
          value={formatCurrency(totalDonated)}
          unit="NGN"
          icon={health}
          color="bg-pink-50 text-pink-800"
          loading={isLoading}
        />
        <StatCard
          title="Locations Impacted"
          value={locationsImpacted}
          unit="States"
          icon={location}
          color="bg-purple-50 text-purple-800"
          loading={isLoading}
        />
      </div>

      {/* Table Section */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle>All Campaigns</CardTitle>
            <Button
              asChild
              className="bg-pink-500 hover:bg-pink-600 text-white"
            >
              <Link to="/donor/campaigns/create">
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <CampaignFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
          <CampaignsTable
            campaigns={campaigns}
            isLoading={!!isLoading}
            error={error}
            onDelete={handleDeleteCampaign}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Campaign
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the campaign titled "
              <strong>{campaignToDelete?.title}</strong>"? Any unused funds will
              be moved to the general donation pool. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {deleteCampaignMutation.isPending
                ? 'Deleting...'
                : 'Delete Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
