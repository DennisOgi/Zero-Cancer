import { createFileRoute } from '@tanstack/react-router'
import { useDonorCampaigns } from '@/services/providers/donor.provider'
import { DonorDashboardPage } from '@/components/DonorPage/Dashboard/DonorDashboard.page'

export const Route = createFileRoute('/donor/')({
  component: DonorDashboardPage,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(
      useDonorCampaigns({
        page: 1,
        pageSize: 5,
      }),
    )
  },
})
