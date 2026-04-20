import { createFileRoute } from '@tanstack/react-router'
import { useScreeningTypes } from '@/services/providers/screeningType.provider'
import { CreateCampaignPage } from '@/components/DonorPage/Campaigns/CreateCampaign.page'

export const Route = createFileRoute('/donor/campaigns/create')({
  component: CreateCampaignPage,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(useScreeningTypes({}))
  },
})
