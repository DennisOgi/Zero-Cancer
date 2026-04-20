import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shared/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shared/ui/table'
import { Link } from '@tanstack/react-router'
import { Eye, MoreHorizontal, Trash2 } from 'lucide-react'

export default function CampaignsTable({
  campaigns,
  isLoading,
  error,
  onDelete,
}: {
  campaigns: any[]
  isLoading: boolean
  error: any
  onDelete: (c: any) => void
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-green-100 text-green-700 border border-green-200">
            Active
          </Badge>
        )
      case 'COMPLETED':
        return (
          <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
            Completed
          </Badge>
        )
      case 'DELETED':
        return (
          <Badge className="bg-red-100 text-red-700 border border-red-200">
            Deleted
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaign Name</TableHead>
            <TableHead>Sponsored Tests</TableHead>
            <TableHead>Donation</TableHead>
            <TableHead>Sponsored Patients</TableHead>
            <TableHead>Date Created</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="h-64 text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={7} className="h-64 text-center text-red-500">
                Error loading campaigns.
              </TableCell>
            </TableRow>
          ) : campaigns.length > 0 ? (
            campaigns.map((campaign) => (
              <TableRow key={campaign.id} className="hover:bg-gray-50/50">
                <TableCell className="font-medium">{campaign.title}</TableCell>
                <TableCell className="text-sm text-gray-600">
                  {campaign.screeningTypes?.length > 0
                    ? campaign.screeningTypes
                        .map((st: any) => st.name)
                        .join(', ')
                    : 'All Types'}
                </TableCell>
                <TableCell>
                  ₦{campaign.fundingAmount.toLocaleString()}
                </TableCell>
                <TableCell>
                  {campaign.patientAllocations.patientsHelped}
                </TableCell>
                <TableCell>
                  {new Date(campaign.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          to="/donor/campaigns/$campaignId"
                          params={{ campaignId: campaign.id }}
                          className="cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </Link>
                      </DropdownMenuItem>
                      {campaign.status === 'ACTIVE' && (
                        <DropdownMenuItem
                          onClick={() => onDelete(campaign)}
                          className="text-red-500 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-64 text-center">
                <p className="font-medium">No campaigns found.</p>
                <p className="text-sm text-gray-500">
                  Create your first campaign to get started.
                </p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
