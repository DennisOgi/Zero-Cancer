import { createFileRoute } from '@tanstack/react-router'
import { useScreeningTypes } from '@/services/providers/screeningType.provider'
import { CreateCampaignPage } from '@/components/DonorPage/Campaigns/CreateCampaign.page'
import { z } from 'zod'

const createCampaignSearchSchema = z.object({
  targetIndividualId: z.string().optional(),
  targetGroupId: z.string().optional(),
  groupName: z.string().optional(),
  screeningTypeId: z.string().optional(),
})

export const Route = createFileRoute('/donor/campaigns/create')({
  validateSearch: createCampaignSearchSchema,
  component: CreateCampaignPage,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(useScreeningTypes({}))
  },
})
