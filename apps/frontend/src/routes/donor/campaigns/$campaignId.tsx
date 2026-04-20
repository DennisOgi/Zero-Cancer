import { CampaignDetailsPage } from '@/components/DonorPage/Campaigns/CampaignDetails.page'
import { createFileRoute } from '@tanstack/react-router'

function DonorCampaignDetailsPage() {
  const { campaignId } = Route.useParams()
  return <CampaignDetailsPage campaignId={campaignId} />
}

export const Route = createFileRoute('/donor/campaigns/$campaignId')({
  component: DonorCampaignDetailsPage,
})
