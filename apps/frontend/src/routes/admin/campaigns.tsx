import { AdminCampaignsPage } from '@/components/AdminPage/Campaigns/AdminCampaigns.page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/campaigns')({
  component: AdminCampaignsPage,
})
