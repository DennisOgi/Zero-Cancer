import { Button } from '@/components/shared/ui/button'
import {
  adminAppointments,
  adminCampaigns,
  adminCenters,
  adminStoreProducts,
  adminTransactions,
  adminUsers,
} from '@/services/providers/admin.provider'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Bell, TrendingUp } from 'lucide-react'
import AdminInventoryAlert from './AdminInventoryAlert'
import AdminKeyMetrics from './AdminKeyMetrics'
import AdminQuickActions from './AdminQuickActions'
import AdminRecentActivity from './AdminRecentActivity'
import AdminSystemHealth from './AdminSystemHealth'

const AdminDashboardPage = () => {
  const { data: users } = useQuery(adminUsers({ profileType: undefined }))
  const { data: centers } = useQuery(adminCenters({ search: '' }))
  const { data: campaigns } = useQuery(adminCampaigns({ search: '' }))
  const { data: appointments } = useQuery(adminAppointments({}))
  const { data: transactions } = useQuery(adminTransactions({}))
  const { data: storeProducts } = useQuery(adminStoreProducts({ search: '' }))

  // Calculate key metrics
  const totalUsers = users?.data?.users?.length || 0
  const totalCenters = centers?.data?.centers?.length || 0
  const activeCenters =
    centers?.data?.centers?.filter((center) => center.status === 'ACTIVE')
      .length || 0
  const totalCampaigns = campaigns?.data?.campaigns?.length || 0
  const activeCampaigns =
    campaigns?.data?.campaigns?.filter(
      (campaign) => campaign.status === 'ACTIVE',
    ).length || 0
  const scheduledAppointments =
    appointments?.data?.appointments?.filter(
      (apt) => apt.status === 'SCHEDULED',
    ).length || 0
  const totalTransactions = transactions?.data?.transactions?.length || 0
  const completedTransactions =
    transactions?.data?.transactions?.filter(
      (txn) => txn.status === 'COMPLETED',
    ).length || 0
  const lowStockProducts =
    storeProducts?.data?.products?.filter((product) => product.stock <= 10)
      .length || 0

  const totalRevenue =
    transactions?.data?.transactions
      ?.filter((txn) => txn.status === 'COMPLETED')
      ?.reduce((sum, txn) => sum + (txn.amount || 0), 0) || 0

  const recentAppointments = appointments?.data?.appointments?.slice(0, 5) || []
  const recentTransactions = transactions?.data?.transactions?.slice(0, 5) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage your Zero Cancer platform
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/analytics">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/admin/notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Link>
          </Button>
        </div>
      </div>

      <AdminKeyMetrics
        totalUsers={totalUsers}
        activeCenters={activeCenters}
        totalCenters={totalCenters}
        activeCampaigns={activeCampaigns}
        totalCampaigns={totalCampaigns}
        totalRevenue={totalRevenue}
        completedTransactions={completedTransactions}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AdminSystemHealth
          scheduledAppointments={scheduledAppointments}
          completedTransactions={completedTransactions}
          totalTransactions={totalTransactions}
          activeCenters={activeCenters}
          totalCenters={totalCenters}
          activeCampaigns={activeCampaigns}
          lowStockProducts={lowStockProducts}
        />
        <AdminQuickActions />
      </div>

      <AdminRecentActivity
        recentAppointments={recentAppointments}
        recentTransactions={recentTransactions}
      />

      <AdminInventoryAlert lowStockProducts={lowStockProducts} />
    </div>
  )
}

export default AdminDashboardPage
