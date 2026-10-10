import type { Context } from "hono";
import { getDB } from "./db";
import { addToGeneralDonorPool } from "./paystack";
import { generateHexId, triggerWaitlistMatching } from "./utils";
import { creditCommissionForSponsoredCampaign } from "./commission.service";
import { completeSavingsDepositByReference } from "./savings.service";
import { connectPatientAfterBooking } from "./confirm-booking";

type PaystackChargeMetadata = {
  payment_type?: string;
  campaign_id?: string | null;
  appointmentId?: string;
  plan_id?: string;
  [key: string]: unknown;
};

export type ProcessChargeSuccessInput = {
  reference: string;
  amountNaira: number;
  metadata?: PaystackChargeMetadata;
};

export type ProcessChargeSuccessResult = {
  alreadyProcessed: boolean;
  paymentType?: string;
};

/** @deprecated Prefer processSuccessfulCharge. Kept for in-flight Paystack webhooks. */
export async function processSuccessfulPaystackCharge(
  c: Context,
  input: { reference: string; amountKobo: number; metadata?: PaystackChargeMetadata }
): Promise<ProcessChargeSuccessResult> {
  return processSuccessfulCharge(c, {
    reference: input.reference,
    amountNaira: input.amountKobo / 100,
    metadata: input.metadata,
  });
}

export async function processSuccessfulCharge(
  c: Context,
  input: ProcessChargeSuccessInput
): Promise<ProcessChargeSuccessResult> {
  const db = getDB(c);
  const { reference, amountNaira, metadata = {} } = input;
  const paymentType = String(
    metadata.payment_type || metadata.paymentType || ""
  ) || undefined;
  const campaignId = metadata.campaign_id || metadata.campaignId;
  const appointmentId = metadata.appointmentId || metadata.appointment_id;

  // Savings deposits are tracked on SavingsDeposit, not Transaction
  if (paymentType === "savings_deposit") {
    await completeSavingsDepositByReference(
      c,
      reference,
      undefined
    );
    return { alreadyProcessed: false, paymentType };
  }

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
        "[PAYMENT] Waitlist matching failed after anonymous donation:",
        error
      );
    }
  } else if (
    (paymentType === "campaign_creation" || paymentType === "campaign_funding") &&
    campaignId
  ) {
    const fundedCampaignId = String(campaignId);
    await db.donationCampaign.update({
      where: { id: fundedCampaignId },
      data: {
        totalAmount: { increment: amountNaira },
        availableAmount: { increment: amountNaira },
        status: "ACTIVE",
      },
    });

    try {
      await creditCommissionForSponsoredCampaign(c, fundedCampaignId, amountNaira);
    } catch (error) {
      console.error("[PAYMENT] Sponsor commission failed:", error);
    }

    try {
      await triggerWaitlistMatching(c);
    } catch (error) {
      console.error(
        "[PAYMENT] Waitlist matching failed after campaign payment:",
        error
      );
    }
  } else if (paymentType === "appointment_booking" && appointmentId) {
    await db.appointment.update({
      where: { id: String(appointmentId) },
      data: {
        status: "SCHEDULED",
        checkInCode: generateHexId(6).toUpperCase(),
        checkInCodeExpiresAt: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ),
      },
    });
    const appointment = await db.appointment.findUnique({
      where: { id: String(appointmentId) },
    });
    if (appointment?.patientId && appointment.centerId) {
      await connectPatientAfterBooking(c, {
        patientId: appointment.patientId,
        centerId: appointment.centerId,
        appointmentId: appointment.id!,
        appointmentDateTime: appointment.appointmentDateTime,
      });
    }
  }

  return { alreadyProcessed: false, paymentType };
}
