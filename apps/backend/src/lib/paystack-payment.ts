import type { Context } from "hono";
import { getDB } from "./db";
import { addToGeneralDonorPool } from "./paystack";
import { generateHexId, triggerWaitlistMatching } from "./utils";

type PaystackChargeMetadata = {
  payment_type?: string;
  campaign_id?: string | null;
  appointmentId?: string;
  [key: string]: unknown;
};

export type ProcessChargeSuccessInput = {
  reference: string;
  amountKobo: number;
  metadata?: PaystackChargeMetadata;
};

export type ProcessChargeSuccessResult = {
  alreadyProcessed: boolean;
  paymentType?: string;
};

export async function processSuccessfulPaystackCharge(
  c: Context,
  input: ProcessChargeSuccessInput
): Promise<ProcessChargeSuccessResult> {
  const db = getDB(c);
  const { reference, amountKobo, metadata = {} } = input;
  const paymentType = metadata.payment_type;
  const amountNaira = amountKobo / 100;

  const existing = await db.transaction.findFirst({
    where: { paymentReference: reference },
  });

  if (existing?.status === "COMPLETED") {
    return { alreadyProcessed: true, paymentType };
  }

  await db.transaction.updateMany({
    where: { paymentReference: reference },
    data: { status: "COMPLETED" },
  });

  if (paymentType === "anonymous_donation") {
    await addToGeneralDonorPool(amountNaira, c);

    try {
      await triggerWaitlistMatching(c);
    } catch (error) {
      console.error(
        "[PAYSTACK] Waitlist matching failed after anonymous donation:",
        error
      );
    }
  } else if (
    (paymentType === "campaign_creation" || paymentType === "campaign_funding") &&
    metadata.campaign_id
  ) {
    const campaignId = String(metadata.campaign_id);
    await db.donationCampaign.update({
      where: { id: campaignId },
      data: {
        totalAmount: { increment: amountNaira },
        availableAmount: { increment: amountNaira },
        status: "ACTIVE",
      },
    });

    try {
      await triggerWaitlistMatching(c);
    } catch (error) {
      console.error(
        "[PAYSTACK] Waitlist matching failed after campaign payment:",
        error
      );
    }
  } else if (paymentType === "appointment_booking" && metadata.appointmentId) {
    await db.appointment.update({
      where: { id: String(metadata.appointmentId) },
      data: {
        status: "SCHEDULED",
        checkInCode: generateHexId(6).toUpperCase(),
        checkInCodeExpiresAt: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ),
      },
    });
  }

  return { alreadyProcessed: false, paymentType };
}
