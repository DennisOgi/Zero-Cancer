import request from '@/lib/request'
import * as endpoints from '@/services/endpoints'
import {
  anonymousDonationSchema,
  createCampaignSchema,
  deleteCampaignSchema,
  fundCampaignSchema,
  getCampaignsSchema,
  updateCampaignSchema,
} from '@zerocancer/shared/schemas/donation.schema'
import type {
  TAnonymousDonationResponse,
  TCreateCampaignResponse,
  TDeleteCampaignResponse,
  TFundCampaignResponse,
  TGetCampaignResponse,
  TGetCampaignsResponse,
  // TGetDonorReceiptsResponse,
  TPaymentVerificationResponse,
  TUpdateCampaignResponse,
} from '@zerocancer/shared/types'
import { z } from 'zod'

// Anonymous donation
export const donateAnonymous = async (
  data: z.infer<typeof anonymousDonationSchema>,
): Promise<TAnonymousDonationResponse> => {
  const res = await request.post(endpoints.donateAnonymous(), data)
  return res as TAnonymousDonationResponse
}

// Create campaign
export const createCampaign = async (
  data: z.infer<typeof createCampaignSchema>,
): Promise<TCreateCampaignResponse> => {
  const res = await request.post(endpoints.createCampaign(), data)
  return res as TCreateCampaignResponse
}

// Get donor's campaigns (paginated, filterable)
export const getCampaigns = async (params: {
  page?: number
  pageSize?: number
  status?: 'ACTIVE' | 'COMPLETED' | 'DELETED' //| 'PENDING'
  search?: string
}) => {
  const response = await request.get<TGetCampaignsResponse>(
    endpoints.getCampaigns(params),
  )
  return response as TGetCampaignsResponse
}

// Get specific campaign details
export const getCampaign = async (
  campaignId: string,
): Promise<TGetCampaignResponse> => {
  const res = await request.get(endpoints.getCampaign(campaignId))
  return res as TGetCampaignResponse
}

// Fund existing campaign
export const fundCampaign = async (
  campaignId: string,
  data: z.infer<typeof fundCampaignSchema>,
): Promise<TFundCampaignResponse> => {
  const res = await request.post(endpoints.fundCampaign(campaignId), data)
  return res as TFundCampaignResponse
}

// Update existing campaign details
export const updateCampaign = async (
  campaignId: string,
  data: z.infer<typeof updateCampaignSchema>,
): Promise<TUpdateCampaignResponse> => {
  const res = await request.patch(endpoints.updateCampaign(campaignId), data)
  return res as TUpdateCampaignResponse
}

// Delete existing campaign and recycle funds
export const deleteCampaign = async (
  campaignId: string,
  data: z.infer<typeof deleteCampaignSchema>,
): Promise<TDeleteCampaignResponse> => {
  const res = await request.deleteWithOptions(
    endpoints.deleteCampaign(campaignId),
    { data },
  )
  return res as TDeleteCampaignResponse
}

// Get donor receipts (paginated)
// export const getDonorReceipts = async (params: {
//   page?: number
//   size?: number
// }): Promise<TGetDonorReceiptsResponse> => {
//   const res = await request.get(endpoints.getDonorReceipts(params.page, params.size))
//   return res as TGetDonorReceiptsResponse
// }

// ========================================
// PAYMENT VERIFICATION
// ========================================

/**
 * PAYMENT FLOW EXPLANATION FOR FRONTEND DEVELOPERS:
 *
 * 1. PAYMENT INITIATION:
 *    - User clicks donate/fund button → Frontend calls donateAnonymous(), createCampaign(), or fundCampaign()
 *    - Backend returns Paystack authorization URL → Frontend redirects user to this URL
 *    - User completes payment on Paystack's secure checkout page
 *
 * 2. RETURN TO APP (Context-Aware Redirects):
 *    - After payment, Paystack redirects to these URLs based on payment type:
 *      • Anonymous donations: `/donation/payment-status?ref=${reference}&type=anonymous`
 *      • Campaign creation: `/donor/campaigns/payment-status?ref=${reference}&type=create&campaignId=${campaignId}`
 *      • Campaign funding: `/donor/campaigns/${campaignId}/payment-status?ref=${reference}&type=fund`
 *
 * 3. PAYMENT STATUS PAGE IMPLEMENTATION:
 *    - Parse URL parameters: reference (required), type (required), campaignId (optional)
 *    - Call verifyPayment(reference) to get payment status and context data
 *    - Show appropriate success/failure message based on payment type and status
 *    - Redirect user to appropriate next page (dashboard, campaign details, etc.)
 *
 * 4. PAYMENT VERIFICATION RESPONSE:
 *    - Contains payment status (success/failed/abandoned/pending)
 *    - Contains context object with payment-type-specific data:
 *      • anonymous_donation: { wantsReceipt, message }
 *      • campaign_creation: { campaignId, campaign, initialFunding }
 *      • campaign_funding: { campaignId, campaign, fundingAmount }
 *
 * 5. UI RECOMMENDATIONS:
 *    - Show loading spinner while verifying payment
 *    - Handle all payment statuses (success, failed, abandoned, pending)
 *    - For successful payments, show context-appropriate success message
 *    - For failed payments, show retry option or contact support
 *    - Auto-redirect to relevant page after 3-5 seconds
 */

// Verify payment status with Paystack and get context data
export const verifyPayment = async (
  reference: string,
): Promise<TPaymentVerificationResponse> => {
  const res = await request.get(endpoints.verifyPayment(reference))
  return res as TPaymentVerificationResponse
}
