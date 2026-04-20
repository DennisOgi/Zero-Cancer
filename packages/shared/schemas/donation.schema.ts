import { z } from "zod";

// Anonymous donation schemas
export const anonymousDonationSchema = z
  .object({
    amount: z.number().min(100, "Minimum donation is ₦100"),
    message: z.string().optional(),
    wantsReceipt: z.boolean().default(false),
    email: z.string().email().optional(),
  })
  .refine(
    (data) => {
      // If wants receipt, email is required
      if (data.wantsReceipt && !data.email) {
        return false;
      }
      return true;
    },
    {
      message: "Email is required when requesting receipt",
      path: ["email"],
    }
  );

// Campaign creation schemas
export const createCampaignSchema = z
  .object({
    title: z.string().min(1, "Campaign title is required").max(100),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(500),
    fundingAmount: z.number().min(1000, "Minimum campaign amount is ₦1,000"),
    // maxPerPatient: z.number().min(100, "Minimum per patient is ₦100"),
    // initialFunding: z.number().min(100, "Minimum initial funding is ₦100"),
    // expiryMonths: z
    //   .number()
    //   .min(1, "Minimum 1 month")
    //   .max(12, "Maximum 12 months"),

    // Targeting filters
    targetStates: z.array(z.string()).optional(),
    targetLgas: z.array(z.string()).optional(),
    targetGender: z.enum(["MALE", "FEMALE", "ALL"]).default("ALL"),
    targetAgeMin: z.number().min(0).max(100).optional(),
    targetAgeMax: z.number().min(0).max(100).optional(),
    screeningTypeIds: z.array(z.string()).optional(),
    // .min(1, "At least one screening type is required"),

    // Targeted individual/group/association
    targetAssociationId: z.string().uuid().optional(),
    targetGroupId: z.string().uuid().optional(),
    targetIndividualId: z.string().uuid().optional(),
    targetPhone: z.string().optional(),
  })
  .refine(
    (data) => {
      // Validate age range
      if (
        data.targetAgeMin &&
        data.targetAgeMax &&
        data.targetAgeMin > data.targetAgeMax
      ) {
        return false;
      }
      // Max per patient can't exceed target amount
      // if (data.maxPerPatient > data.fundingAmount) {
      //   return false;
      // }
      return true;
    },
    {
      message: "Invalid campaign parameters",
    }
  );

// Campaign funding schema
export const fundCampaignSchema = z.object({
  campaignId: z.string().uuid(),
  amount: z.number().min(100, "Minimum funding amount is ₦100"),
});

// Get campaigns schema
export const getCampaignsSchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "DELETED"]).optional(),
  search: z.string().optional(),
});

// Get campaign analytics schema
export const getCampaignAnalyticsSchema = z.object({
  campaignId: z.string().uuid(),
  timeRange: z
    .enum(["7d", "30d", "90d", "1y", "all"])
    .default("30d")
    .optional(),
});

// Update campaign schema
export const updateCampaignSchema = z
  .object({
    campaignId: z.string().uuid(),
    title: z.string().min(1).max(100).optional(),
    description: z.string().min(10).max(500).optional(),
    targetStates: z.array(z.string()).optional(),
    targetLgas: z.array(z.string()).optional(),
    targetGender: z.enum(["MALE", "FEMALE", "ALL"]).optional(),
    targetAgeMin: z.number().min(0).max(100).optional(),
    targetAgeMax: z.number().min(0).max(100).optional(),
    screeningTypeIds: z
      .array(z.string().uuid())
      .min(1, "At least one screening type is required")
      .optional(),
    // expiryDate: z.string().datetime().optional(),
    targetAssociationId: z.string().uuid().optional(),
    targetGroupId: z.string().uuid().optional(),
    targetIndividualId: z.string().uuid().optional(),
    targetPhone: z.string().optional(),
  })
  .refine(
    (data) => {
      // Validate age range if both provided
      if (
        data.targetAgeMin &&
        data.targetAgeMax &&
        data.targetAgeMin > data.targetAgeMax
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Invalid age range",
    }
  );

// Delete campaign schema
export const deleteCampaignSchema = z
  .object({
    campaignId: z.string().uuid(),
    action: z.enum([
      "recycle_to_general",
      "transfer_to_campaign",
      "request_refund",
    ]),
    targetCampaignId: z.string().uuid().optional(),
    reason: z.string().optional(),
  })
  .refine(
    (data) => {
      // If transferring to another campaign, target campaign ID is required
      if (data.action === "transfer_to_campaign" && !data.targetCampaignId) {
        return false;
      }
      return true;
    },
    {
      message: "Target campaign ID required for transfer action",
    }
  );

// Payment initialization schemas
export const initializePaymentSchema = z
  .object({
    paymentType: z.enum([
      "anonymous_donation",
      "campaign_creation",
      "campaign_funding",
    ]),
    amount: z.number().min(100),
    email: z.string().email(),

    // For anonymous donations
    donationData: z
      .object({
        message: z.string().optional(),
        wantsReceipt: z.boolean(),
      })
      .optional(),

    // For campaign creation
    campaignData: createCampaignSchema.optional(),

    // For campaign funding
    campaignId: z.string().uuid().optional(),
  })
  .refine(
    (data) => {
      // Validate required data based on payment type
      if (data.paymentType === "anonymous_donation" && !data.donationData) {
        return false;
      }
      if (data.paymentType === "campaign_creation" && !data.campaignData) {
        return false;
      }
      if (data.paymentType === "campaign_funding" && !data.campaignId) {
        return false;
      }
      return true;
    },
    {
      message: "Required data missing for payment type",
    }
  );

// Payment verification schema
export const verifyPaymentSchema = z.object({
  reference: z.string().min(1),
});

// Webhook verification schema
export const paystackWebhookSchema = z.object({
  event: z.string(),
  data: z
    .object({
      reference: z.string(),
      status: z.string(),
      amount: z.number(),
      customer: z
        .object({
          email: z.string().email(),
        })
        .passthrough(),
      metadata: z.record(z.any()).optional(),
    })
    .passthrough(), // allows extra keys, but requires the specified ones
});
