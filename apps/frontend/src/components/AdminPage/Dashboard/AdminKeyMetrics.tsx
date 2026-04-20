import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Building2, DollarSign, HeartHandshake, Users } from 'lucide-react'

export interface AdminKeyMetricsProps {
  totalUsers: number
  activeCenters: number
  totalCenters: number
  activeCampaigns: number
  totalCampaigns: number
  totalRevenue: number
  completedTransactions: number
}

export function AdminKeyMetrics({
  totalUsers,
  activeCenters,
  totalCenters,
  activeCampaigns,
  totalCampaigns,
  totalRevenue,
  completedTransactions,
}: AdminKeyMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalUsers.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Patients, donors, and staff
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Centers</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeCenters}</div>
          <p className="text-xs text-muted-foreground">
            of {totalCenters} total centers
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Campaigns
          </CardTitle>
          <HeartHandshake className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeCampaigns}</div>
          <p className="text-xs text-muted-foreground">
            of {totalCampaigns} total campaigns
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₦{totalRevenue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            From {completedTransactions} transactions
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminKeyMetrics
