import { env } from "hono/adapter";
import { getDB } from "./db";
import { TEnvs } from "./types";

// Helper function to initialize Paystack payment with context-aware callback URLs
export async function initializePaystackPayment(
  c: any,
  data: {
    email: string;
    amount: number; // in kobo
    reference: string;
    paymentType:
      | "anonymous_donation"
      | "campaign_creation"
      | "campaign_funding"
      | "appointment_booking";
    campaignId?: string; // Required for campaign-related payments
    patientId?: string; // Optional for appointment payments
    metadata?: any;
  }
) {
  const { PAYSTACK_SECRET_KEY, FRONTEND_URL } = env<TEnvs>(c);

  // Generate context-aware callback URL based on payment type
  let callbackUrl: string;

  switch (data.paymentType) {
    case "anonymous_donation":
      callbackUrl = `${FRONTEND_URL}/donation/payment-status?ref=${data.reference}&type=anonymous`;
      break;
    case "campaign_creation":
      if (!data.campaignId)
        throw new Error("Campaign ID required for campaign creation");
      callbackUrl = `${FRONTEND_URL}/donor/campaigns/payment-status?ref=${data.reference}&type=create&campaignId=${data.campaignId}`;
      break;
    case "campaign_funding":
      if (!data.campaignId)
        throw new Error("Campaign ID required for campaign funding");
      callbackUrl = `${FRONTEND_URL}/donor/campaigns/${data.campaignId}/payment-status?ref=${data.reference}&type=fund`;
      break;
    case "appointment_booking":
      if (!data.patientId)
        throw new Error("Patient ID required for appointment payment");
      callbackUrl = `${FRONTEND_URL}/patient/book/payment-status?ref=${data.reference}&type=book&patientId=${data.patientId}`;
      break;
    default:
      throw new Error(`Unknown payment type: ${data.paymentType}`);
  }

  const response = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        amount: data.amount,
        reference: data.reference,
        callback_url: callbackUrl,
        metadata: {
          ...data.metadata,
          payment_type: data.paymentType,
          campaign_id: data.campaignId || null,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to initialize Paystack payment");
  }

  const result = await response.json();
  console.log("Paystack payment initialized:", result.data);
  return result.data;
}

// Helper function to add funds to general donor pool
export async function addToGeneralDonorPool(amount: number, c: any) {
  const db = getDB(c);

  // Find or create general donor pool campaign
  let generalPool = await db.donationCampaign.findFirst({
    where: { id: "general-donor-pool" },
  });

  if (!generalPool) {
    // Create general pool if it doesn't exist
    generalPool = await db.donationCampaign.create({
      data: {
        id: "general-donor-pool",
        donorId: "system", // System-managed campaign
        title: "General donation public pool",
        totalAmount: amount,
        availableAmount: amount,
        purpose: "General Donation Pool",
        status: "ACTIVE",
      },
    });
  } else {
    // Add to existing pool
    await db.donationCampaign.update({
      where: { id: "general-donor-pool" },
      data: {
        availableAmount: { increment: amount },
        totalAmount: { increment: amount },
      },
    });
  }
}
