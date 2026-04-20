import { createFileRoute } from '@tanstack/react-router'
import { useDonorCampaigns } from '@/services/providers/donor.provider'
import { DonorCampaignsPage } from '@/components/DonorPage/Campaigns/DonorCampaigns.page'

export const Route = createFileRoute('/donor/campaigns/')({
  component: DonorCampaignsPage,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(
      useDonorCampaigns({ page: 1, pageSize: 10 }),
    )
  },
})
