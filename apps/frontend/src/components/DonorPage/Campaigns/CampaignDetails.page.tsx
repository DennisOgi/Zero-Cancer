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
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import { Progress } from '@/components/shared/ui/progress'
import { Separator } from '@/components/shared/ui/separator'
import {
  useDeleteCampaign,
  useDonorCampaign,
  useFundCampaign,
} from '@/services/providers/donor.provider'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { format } from 'date-fns'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Download,
  Edit,
  Info,
  Paperclip,
  Plus,
  Share2,
  Trash2,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import donationIcon from '@/assets/images/donor.png'
import locationIcon from '@/assets/images/health.png'
import screeningIcon from '@/assets/images/screening.png'
import sponsoredIcon from '@/assets/images/sponsored.png'
import { formatCurrency } from '@/lib/utils'
import CampaignImpactList from './components/CampaignImpactList'
import DonationLogTable from './components/DonationLogTable'

interface CampaignDetailsPageProps {
  campaignId: string
}

// --- Sub-components for cleaner structure ---

function StatCard({
  icon,
  title,
  value,
  description,
  color,
}: {
  icon: string
  title: string
  value: string | number
  description: string
  color: string
}) {
  return (
    <Card className={`p-4 shadow-sm border-0 bg-gradient-to-br ${color}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm font-semibold text-gray-700">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
          <p className="text-xs text-gray-600">{description}</p>
        </div>
        <div className="p-2 bg-white/50 rounded-full">
          <img src={icon} alt={title} className="w-6 h-6" />
        </div>
      </div>
    </Card>
  )
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: React.ElementType
  label: string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <Button
      variant="outline"
      className="flex-col h-24 gap-2 shadow-sm bg-white"
      onClick={onClick}
      disabled={disabled}
    >
      <div className="p-2 bg-slate-100 rounded-full">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </Button>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: React.ElementType
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-4">
      <Icon className="h-5 w-5 text-slate-500 mt-1" />
      <div className="w-full">
        <p className="font-medium text-slate-800">{label}</p>
        {value && <p className="text-slate-600">{value}</p>}
        {children}
      </div>
    </div>
  )
}

export function CampaignDetailsPage({ campaignId }: CampaignDetailsPageProps) {
  const navigate = useNavigate()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fundDialogOpen, setFundDialogOpen] = useState(false)
  const [fundAmount, setFundAmount] = useState('')

  const {
    data: campaignData,
    isLoading,
    error,
  } = useQuery(useDonorCampaign(campaignId))

  const deleteCampaignMutation = useDeleteCampaign()
  const fundCampaignMutation = useFundCampaign()

  const campaign = campaignData?.data

  const handleDelete = async () => {
    if (!campaign) return
    try {
      await deleteCampaignMutation.mutateAsync({
        campaignId,
        action: 'recycle_to_general',
        reason: 'Deleted by donor from campaign details',
      })
      toast.success(`Campaign "${campaign.title}" deleted successfully.`)
      navigate({ to: '/donor/campaigns' })
    } catch (err) {
      toast.error('Failed to delete campaign.')
    }
  }

  const handleFundCampaign = async () => {
    const amount = parseFloat(fundAmount)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount.')
      return
    }

    try {
      const paymentLink = await fundCampaignMutation.mutateAsync({
        campaignId,
        amount,
      })
      if (paymentLink?.data?.authorizationUrl) {
        window.location.href = paymentLink.data.authorizationUrl
      }
      toast.success('Redirecting to payment page...')
      setFundDialogOpen(false)
      setFundAmount('')
    } catch (err) {
      toast.error('Failed to initiate funding.')
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-muted-foreground">
          Loading campaign details...
        </p>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Campaign Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The campaign you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link to="/donor/campaigns">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Campaigns
          </Link>
        </Button>
      </div>
    )
  }

  const targetSponsored = Math.floor(campaign.fundingAmount / 2500)
  const progressPercentage =
    campaign.fundingAmount > 0
      ? (campaign.usedAmount / campaign.fundingAmount) * 100
      : 0

  // Placeholder data for Donation Log and Campaign Impact
  const donationLog = [
    {
      amount: '₦1,240,000',
      sponsored: 200,
      date: '10 Jul 2025',
      status: 'Active',
    },
    {
      amount: '₦20,000,000',
      sponsored: 2000,
      date: '10 Jul 2025',
      status: 'Active',
    },
  ]

  const campaignImpact = [
    {
      time: '10:30 AM',
      message:
        'A woman you sponsored in Lagos just completed her cervical cancer screening. Thank you for your support.',
    },
    {
      time: '10:30 AM',
      message:
        'One of your beneficiaries has booked her screening appointment and will visit the clinic soon. Thank you for your support.',
    },
    {
      time: '10:30 AM',
      message:
        'A woman you helped tested positive and needs follow-up care to stay healthy. Thank you for your support.',
    },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            {campaign.title}
          </h1>
          <p className="text-gray-500 mt-1">Campaign Details & Impact</p>
        </div>
        <Badge className="bg-green-100 text-green-700 border border-green-200 text-sm px-3 py-1">
          Active
        </Badge>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Donated"
          value={formatCurrency(campaign.fundingAmount, 'NGN')}
          description="NGN"
          icon={donationIcon}
          color="from-purple-100 to-purple-200"
        />
        <StatCard
          title="Total Sponsored"
          value={targetSponsored.toLocaleString()}
          description="People"
          icon={sponsoredIcon}
          color="from-pink-100 to-pink-200"
        />
        <StatCard
          title="Total Awaiting Screening"
          value={campaign.patientAllocations.patientPendingAcceptance.toLocaleString()}
          description="People"
          icon={screeningIcon}
          color="from-blue-100 to-blue-200"
        />
        <StatCard
          title="Locations Impacted"
          value={campaign.targetStates?.length || 0}
          description="States"
          icon={locationIcon}
          color="from-green-100 to-green-200"
        />
      </div>

      {/* Progress Section */}
      <Card className="bg-slate-800 text-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-slate-300">Progress</p>
              <p>
                <span className="font-bold text-lg">
                  {campaign.patientAllocations.patientsHelped}
                </span>{' '}
                Screened
              </p>
              <p>
                <span className="font-bold text-lg">
                  {formatCurrency(campaign.usedAmount)}
                </span>{' '}
                Spent
              </p>
            </div>
            <div className="w-full md:w-1/2 mx-4">
              <Progress
                value={progressPercentage}
                className="h-2 [&>div]:bg-white"
              />
              <div className="text-center mt-1 text-sm font-bold">
                {Math.round(progressPercentage)}%
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-slate-300">Target</p>
              <p>
                <span className="font-bold text-lg">
                  {targetSponsored.toLocaleString()}
                </span>{' '}
                Sponsored
              </p>
              <p>
                <span className="font-bold text-lg">
                  {formatCurrency(campaign.fundingAmount)}
                </span>{' '}
                Donated
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <ActionButton
          icon={Plus}
          label="Add Donation"
          onClick={() => setFundDialogOpen(true)}
        />
        <ActionButton icon={Share2} label="Share Campaign" disabled />
        <ActionButton icon={Edit} label="Edit Campaign" disabled />
        <ActionButton icon={Download} label="Download Report" disabled />
        <ActionButton
          icon={Trash2}
          label="End Campaign"
          onClick={() => setDeleteDialogOpen(true)}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <DonationLogTable items={donationLog} />

          <CampaignImpactList campaignId={campaignId} items={campaignImpact} />
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6 lg:sticky lg:top-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Campaign Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <InfoRow
                icon={Info}
                label="Description"
                value={campaign.description}
              />
              <Separator />
              <InfoRow icon={Paperclip} label="Screening Types">
                <div className="flex flex-wrap gap-2">
                  {campaign.screeningTypes?.length > 0 ? (
                    campaign.screeningTypes.map((type) => (
                      <Badge
                        key={type.id}
                        variant="secondary"
                        className="bg-slate-200"
                      >
                        {type.name}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="secondary">All Types</Badge>
                  )}
                </div>
              </InfoRow>
              <Separator />
              <InfoRow icon={User} label="Target Gender">
                <Badge variant="secondary" className="bg-slate-200">
                  {campaign.targetGender || 'All'}
                </Badge>
              </InfoRow>
              <Separator />
              <InfoRow
                icon={CalendarDays}
                label="Date Created"
                value={format(new Date(campaign.createdAt), 'dd MMM, yyyy')}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fund Campaign Dialog */}
      <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fund Campaign</DialogTitle>
            <DialogDescription>
              Add additional funds to "{campaign.title}" to help more patients.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="amount">Additional Amount (NGN)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g., 50000"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFundDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFundCampaign}
              disabled={fundCampaignMutation.isPending || !fundAmount}
            >
              {fundCampaignMutation.isPending
                ? 'Processing...'
                : 'Proceed to Fund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-red-500" />
              Delete Campaign
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{campaign.title}"? This action
              cannot be undone. Any unused funds will be moved to the general
              donation pool.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCampaignMutation.isPending}
            >
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
