import { Button } from '@/components/shared/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card'
import { useAuthUser } from '@/services/providers/auth.provider'
import { useDonorCampaigns } from '@/services/providers/donor.provider'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import center from '@/assets/images/center.png'
import impact from '@/assets/images/impact.png'
import DonorStatsGrid from './DonorStatsGrid'
import RecentCampaignsTable from './RecentCampaignsTable'

export function DonorDashboardPage() {
  const { data: authData } = useQuery(useAuthUser())
  const { data: campaignsData, isLoading: campaignsLoading } = useQuery(
    useDonorCampaigns({ page: 1, pageSize: 5 }),
  )

  const donorName = authData?.data?.user?.fullName || 'Valued Donor'
  const campaigns = campaignsData?.data?.campaigns || []

  // --- Stat Calculations ---
  const totalDonated = campaigns.reduce((sum, c) => sum + c.fundingAmount, 0)
  const totalPatientsHelped = campaigns.reduce(
    (sum, c) => sum + (c.patientAllocations?.patientsHelped || 0),
    0,
  )
  const totalCampaigns = campaigns.length
  const locationsImpacted = new Set(
    campaigns.flatMap((c) => c.targetStates || []),
  ).size

  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000) {
      return `₦${(amount / 1_000_000).toFixed(1)}m`
    }
    if (amount >= 1_000) {
      return `₦${Math.round(amount / 1_000)}k`
    }
    return `₦${amount}`
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
          Welcome, {donorName} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Here's a summary of your health journey.
        </p>
      </div>

      <div className="">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-8 text-white">
              <div className="absolute -bottom-10 -right-10 opacity-20">
                <img src={center} alt="Hospital" className="w-48 h-48" />
              </div>
              <div className="relative">
                <h2 className="text-2xl font-bold mb-6">Acme Foundation!</h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold">
                      {campaignsLoading ? '...' : formatCurrency(totalDonated)}
                    </p>
                    <p className="text-sm opacity-80">Total Donated</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">
                      {campaignsLoading ? '...' : totalCampaigns}
                    </p>
                    <p className="text-sm opacity-80">Total Campaigns</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">
                      {campaignsLoading ? '...' : totalPatientsHelped}
                    </p>
                    <p className="text-sm opacity-80">Total Lives Impacted</p>
                  </div>
                </div>
              </div>
            </div>
            <Link
              to="/donor/campaigns/create"
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl bg-pink-500 text-white p-6 hover:bg-pink-600 transition-all"
            >
              <div className="p-3 bg-white/20 rounded-full">
                <Plus className="h-6 w-6" />
              </div>
              <p className="font-semibold text-lg">Create New Campaign</p>
            </Link>
          </div>

          {/* Stat Cards */}
          <DonorStatsGrid
            patientsHelped={totalPatientsHelped}
            locationsImpacted={locationsImpacted}
            loading={campaignsLoading}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Recent Campaigns</CardTitle>
                    <Button variant="link" asChild>
                      <Link to="/donor/campaigns">View All</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <RecentCampaignsTable
                    campaigns={campaigns}
                    loading={!!campaignsLoading}
                  />
                </CardContent>
              </Card>
            </div>
            {/* Side Content */}
            <div className="space-y-6">
              {/* Recent Impact */}
              <Card className="h-full">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Recent Impact</CardTitle>
                    <Button variant="link">See All</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-4">
                    <img
                      src={impact}
                      alt="No impact yet"
                      className="w-24 h-24"
                    />
                    <p>Your campaign impacts will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
