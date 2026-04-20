import { Badge } from '@/components/shared/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { Activity } from 'lucide-react'

export interface AdminSystemHealthProps {
  scheduledAppointments: number
  completedTransactions: number
  totalTransactions: number
  activeCenters: number
  totalCenters: number
  activeCampaigns: number
  lowStockProducts: number
}

export function AdminSystemHealth({
  scheduledAppointments,
  completedTransactions,
  totalTransactions,
  activeCenters,
  totalCenters,
  activeCampaigns,
  lowStockProducts,
}: AdminSystemHealthProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Appointments</span>
              <Badge variant="secondary">
                {scheduledAppointments} scheduled
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Transaction Success</span>
              <Badge
                variant={
                  completedTransactions > totalTransactions * 0.8
                    ? 'default'
                    : 'destructive'
                }
              >
                {totalTransactions > 0
                  ? Math.round(
                      (completedTransactions / totalTransactions) * 100,
                    )
                  : 0}
                %
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Platform Utilization</span>
              <Badge
                variant={
                  activeCenters > totalCenters * 0.7 ? 'default' : 'secondary'
                }
              >
                {totalCenters > 0
                  ? Math.round((activeCenters / totalCenters) * 100)
                  : 0}
                %
              </Badge>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Campaign Funding</span>
              <Badge variant={activeCampaigns > 0 ? 'default' : 'secondary'}>
                {activeCampaigns} active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Store Inventory</span>
              <Badge variant={lowStockProducts > 0 ? 'destructive' : 'default'}>
                {lowStockProducts > 0
                  ? `${lowStockProducts} low stock`
                  : 'Healthy'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Center Network</span>
              <Badge variant="default">{totalCenters} locations</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AdminSystemHealth
