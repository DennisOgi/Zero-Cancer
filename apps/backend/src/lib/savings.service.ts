import { getAgentNetworkConfig } from "./agent-network-config";
import { getPaystackKeys } from "./paystack-config";
import { getSupabaseClient } from "./supabase";
import { env } from "hono/adapter";
import type { TEnvs } from "./types";

export async function createSavingsPlan(
  c: any,
  patientId: string,
  payload: {
    screeningTypeId: string;
    preferredCenterId?: string | null;
    targetAmount?: number;
  }
) {
  const supabase = getSupabaseClient(c);

  let targetAmount = payload.targetAmount;
  if (!targetAmount || targetAmount <= 0) {
    if (payload.preferredCenterId) {
      const { data: link } = await supabase
        .from("ServiceCenterScreeningType")
        .select("amount")
        .eq("centerId", payload.preferredCenterId)
        .eq("screeningTypeId", payload.screeningTypeId)
        .maybeSingle();
      targetAmount = Number(link?.amount || 10000);
    } else {
      const { data: st } = await supabase
        .from("ScreeningType")
        .select("agreedPrice")
        .eq("id", payload.screeningTypeId)
        .maybeSingle();
      targetAmount = Number(st?.agreedPrice || 10000);
    }
  }

  const row = {
    id: crypto.randomUUID(),
    patientId,
    screeningTypeId: payload.screeningTypeId,
    preferredCenterId: payload.preferredCenterId || null,
    targetAmount,
    savedAmount: 0,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("SavingsPlan")
    .insert(row)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function initializeSavingsDeposit(
  c: any,
  patientId: string,
  planId: string,
  amount: number
) {
  const supabase = getSupabaseClient(c);
  const config = getAgentNetworkConfig(c.env || {});
  const { FRONTEND_URL } = env<TEnvs>(c);
  const { secretKey } = getPaystackKeys(c);

  if (amount < config.savingsMinDeposit) {
    throw new Error(
      `Minimum deposit is ₦${config.savingsMinDeposit.toLocaleString()}`
    );
  }

  const { data: plan } = await supabase
    .from("SavingsPlan")
    .select("*")
    .eq("id", planId)
    .eq("patientId", patientId)
    .single();

  if (!plan || !["ACTIVE", "READY"].includes(plan.status)) {
    throw new Error("Savings plan not found or not open for deposits");
  }

  const { data: user } = await supabase
    .from("User")
    .select("email")
    .eq("id", patientId)
    .single();

  const reference = `sav_${planId.slice(0, 8)}_${Date.now()}`;
  const deposit = {
    id: crypto.randomUUID(),
    planId,
    amount,
    status: "PENDING",
    paymentReference: reference,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { error: dErr } = await supabase.from("SavingsDeposit").insert(deposit);
  if (dErr) throw dErr;

  const response = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user?.email,
        amount: Math.round(amount * 100),
        reference,
        callback_url: `${FRONTEND_URL}/patient/savings/payment-status?ref=${reference}`,
        metadata: {
          payment_type: "savings_deposit",
          plan_id: planId,
          patient_id: patientId,
          deposit_id: deposit.id,
        },
      }),
    }
  );

  const body = await response.json();
  if (!response.ok) {
    await supabase
      .from("SavingsDeposit")
      .update({ status: "FAILED", updatedAt: new Date().toISOString() })
      .eq("id", deposit.id);
    throw new Error(body?.message || "Failed to initialize savings payment");
  }

  return {
    deposit,
    authorizationUrl: body.data.authorization_url,
    accessCode: body.data.access_code,
    reference,
  };
}

export async function completeSavingsDepositByReference(
  c: any,
  reference: string,
  channel?: string
) {
  const supabase = getSupabaseClient(c);

  const { data: deposit } = await supabase
    .from("SavingsDeposit")
    .select("*")
    .eq("paymentReference", reference)
    .maybeSingle();

  if (!deposit) return null;
  if (deposit.status === "COMPLETED") return deposit;

  const { data: plan } = await supabase
    .from("SavingsPlan")
    .select("*")
    .eq("id", deposit.planId)
    .single();

  if (!plan) return null;

  const savedAmount = Number(plan.savedAmount || 0) + Number(deposit.amount);
  const status = savedAmount >= Number(plan.targetAmount) ? "READY" : "ACTIVE";

  await supabase
    .from("SavingsDeposit")
    .update({
      status: "COMPLETED",
      paymentChannel: channel || null,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", deposit.id);

  await supabase
    .from("SavingsPlan")
    .update({
      savedAmount,
      status,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", plan.id);

  return { ...deposit, status: "COMPLETED", planStatus: status, savedAmount };
}
