import megaphone from '@/assets/images/megaphone.png'
import { Badge } from '@/components/shared/ui/badge'
import { Progress } from '@/components/shared/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shared/ui/table'

function getStatusColor(status: string) {
  if (status === 'ACTIVE') return 'bg-green-500/10 text-green-600'
  if (status === 'COMPLETED') return 'bg-blue-500/10 text-blue-600'
  return 'bg-gray-500/10 text-gray-600'
}

function getCampaignProgress(campaign: any) {
  if (!campaign?.targetAmount || campaign.targetAmount === 0) return 0
  return Math.min((campaign.usedAmount / campaign.targetAmount) * 100, 100)
}

export default function RecentCampaignsTable({
  campaigns,
  loading,
}: {
  campaigns: any[]
  loading: boolean
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Campaign Name</TableHead>
          <TableHead>Donation</TableHead>
          <TableHead>Sponsored</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={5} className="h-48 text-center">
              Loading campaigns...
            </TableCell>
          </TableRow>
        ) : campaigns.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="h-48 text-center">
              <div className="flex flex-col items-center gap-4">
                <img src={megaphone} alt="No campaigns" className="w-16 h-16" />
                <p className="font-medium">You have no active campaigns</p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          campaigns.map((campaign) => (
            <TableRow key={campaign.id}>
              <TableCell className="font-medium">{campaign.title}</TableCell>
              <TableCell>
                ₦{campaign.fundingAmount?.toLocaleString?.() || 0}
              </TableCell>
              <TableCell>
                {campaign.patientAllocations?.patientsHelped || 0}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress
                    value={getCampaignProgress(campaign)}
                    className="w-20 h-2"
                  />
                  <span className="text-xs text-gray-500">
                    {getCampaignProgress(campaign).toFixed(0)}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={getStatusColor(campaign.status)}
                >
                  {campaign.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
