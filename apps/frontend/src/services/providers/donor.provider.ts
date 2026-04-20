import * as donorService from '@/services/donor.service'
import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { MutationKeys, QueryKeys } from '../keys'

// Anonymous donation mutation
export const useDonateAnonymous = () => {
  return useMutation({
    mutationKey: [MutationKeys.donateAnonymous],
    mutationFn: donorService.donateAnonymous,
  })
}

// Create campaign mutation
export const useCreateCampaign = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.createCampaign],
    mutationFn: donorService.createCampaign,
    onSuccess: () => {
      // Invalidate campaigns list when a new campaign is created
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.donorCampaigns],
      })
    },
  })
}

// Fund campaign mutation
export const useFundCampaign = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.fundCampaign],
    mutationFn: ({
      campaignId,
      amount,
    }: {
      campaignId: string
      amount: number
    }) => donorService.fundCampaign(campaignId, { campaignId, amount }),
    onSuccess: (_, variables) => {
      // Invalidate campaigns list and specific campaign when funded
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.donorCampaigns],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.donorCampaign, variables.campaignId],
      })
    },
  })
}

// Update campaign mutation
export const useUpdateCampaign = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.updateCampaign],
    mutationFn: ({
      campaignId,
      ...data
    }: {
      campaignId: string
      title?: string
      description?: string
      targetStates?: string[]
      targetLgas?: string[]
      targetGender?: 'MALE' | 'FEMALE' | 'ALL'
      targetAgeMin?: number
      targetAgeMax?: number
      screeningTypeIds?: string[]
    }) => donorService.updateCampaign(campaignId, { campaignId, ...data }),
    onSuccess: (_, variables) => {
      // Invalidate campaigns list and specific campaign when updated
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.donorCampaigns],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.donorCampaign, variables.campaignId],
      })
    },
  })
}

// Delete campaign mutation
export const useDeleteCampaign = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [MutationKeys.deleteCampaign],
    mutationFn: ({
      campaignId,
      ...data
    }: {
      campaignId: string
      action: 'recycle_to_general' | 'transfer_to_campaign' | 'request_refund'
      targetCampaignId?: string
      reason?: string
    }) => donorService.deleteCampaign(campaignId, { campaignId, ...data }),
    onSuccess: (_, variables) => {
      // Invalidate campaigns list when deleted
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.donorCampaigns],
      })
      // Remove the specific campaign from cache
      queryClient.removeQueries({
        queryKey: [QueryKeys.donorCampaign, variables.campaignId],
      })
    },
  })
}

// Get donor's campaigns (paginated, filterable)
export const useDonorCampaigns = (params: {
  page?: number
  pageSize?: number
  status?: 'ACTIVE' | 'COMPLETED' | 'DELETED'
  search?: string
}) =>
  queryOptions({
    queryKey: [QueryKeys.donorCampaigns, params],
    queryFn: () => donorService.getCampaigns(params),
  })

// Get donor's campaigns with infinite loading (paginated, filterable)
export const useDonorCampaignsInfinite = (params: {
  pageSize?: number
  status?: 'ACTIVE' | 'COMPLETED' | 'DELETED'
  search?: string
}) =>
  infiniteQueryOptions({
    queryKey: [QueryKeys.donorCampaigns, 'infinite', params],
    queryFn: ({ pageParam }) => {
      return donorService.getCampaigns({
        ...params,
        page: pageParam,
      })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.data
      return page < totalPages ? page + 1 : undefined
    },
  })

// Get specific campaign details
export const useDonorCampaign = (campaignId: string) =>
  queryOptions({
    queryKey: [QueryKeys.donorCampaign, campaignId],
    queryFn: () => donorService.getCampaign(campaignId),
    enabled: !!campaignId,
  })

// Get donor receipts (paginated)
// export const useDonorReceipts = (params: {
//   page?: number
//   size?: number
// }) =>
//   queryOptions({
//     queryKey: [QueryKeys.donorReceipts, params],
//     queryFn: () => donorService.getDonorReceipts(params),
//   })

// ========================================
// PAYMENT VERIFICATION
// ========================================

/**
 * PAYMENT VERIFICATION PROVIDER USAGE:
 *
 * This provider is specifically designed for payment status pages.
 * Use it when users return from Paystack payment to verify their payment status.
 *
 * Example usage in a payment status page component:
 *
 * ```tsx
 * import { useVerifyPayment } from '@/services/providers/donor.provider'
 * import { useSearchParams } from '@tanstack/react-router'
 *
 * export function PaymentStatusPage() {
 *   const { ref, type, campaignId } = useSearchParams() // Get URL params
 *   const { data, isLoading, error } = useVerifyPayment(ref)
 *
 *   if (isLoading) return <PaymentVerificationSpinner />
 *   if (error) return <PaymentErrorMessage />
 *
 *   const { status, context } = data.data
 *
 *   if (status === 'success') {
 *     switch (context.type) {
 *       case 'anonymous_donation':
 *         return <AnonymousDonationSuccess message={context.message} />
 *       case 'campaign_creation':
 *         return <CampaignCreationSuccess campaign={context.campaign} />
 *       case 'campaign_funding':
 *         return <CampaignFundingSuccess campaign={context.campaign} amount={context.fundingAmount} />
 *     }
 *   }
 *
 *   return <PaymentFailedMessage status={status} />
 * }
 * ```
 *
 * The hook automatically refetches every 5 seconds if payment is still pending,
 * and stops refetching once payment is complete (success/failed/abandoned).
 */

// Verify payment status (used on payment status pages)
export const useVerifyPayment = (reference: string) =>
  queryOptions({
    queryKey: [QueryKeys.verifyPayment, reference],
    queryFn: () => donorService.verifyPayment(reference),
    enabled: !!reference,
    // Refetch every 5 seconds if payment is pending
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status
      return status === 'pending' ? 5000 : false
    },
    // Stop refetching on window focus if payment is complete
    refetchOnWindowFocus: (query) => {
      const status = query.state.data?.data?.status
      return status === 'pending'
    },
    // Cache for 1 minute for completed payments
    gcTime: 60 * 1000,
    staleTime: (query) => {
      const status = query.state.data?.data?.status
      return status === 'pending' ? 0 : 30 * 1000
    },
  })
