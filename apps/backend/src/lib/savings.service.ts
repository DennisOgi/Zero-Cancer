import { getAgentNetworkConfig } from "./agent-network-config";
import { initializeFlutterwavePayment } from "./flutterwave";
import { getSupabaseClient } from "./supabase";

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

  try {
    const checkout = await initializeFlutterwavePayment(c, {
      email: user?.email || "",
      amount,
      reference,
      paymentType: "savings_deposit",
      metadata: {
        payment_type: "savings_deposit",
        plan_id: planId,
        patient_id: patientId,
        deposit_id: deposit.id,
      },
    });

    return {
      deposit,
      authorizationUrl: checkout.authorization_url,
      accessCode: checkout.access_code,
      reference,
    };
  } catch (error) {
    await supabase
      .from("SavingsDeposit")
      .update({ status: "FAILED", updatedAt: new Date().toISOString() })
      .eq("id", deposit.id);
    throw error instanceof Error
      ? error
      : new Error("Failed to initialize savings payment");
  }
}

export async function completeSavingsDepositByReference(
  c: any,
  reference: string,
  channel?: string,
  paidAmountNaira?: number
) {
  const supabase = getSupabaseClient(c);

  const { data: deposit } = await supabase
    .from("SavingsDeposit")
    .select("*")
    .eq("paymentReference", reference)
    .maybeSingle();

  if (!deposit) return null;
  if (deposit.status === "COMPLETED") return deposit;
  if (
    paidAmountNaira !== undefined &&
    paidAmountNaira + 0.01 < Number(deposit.amount)
  ) {
    console.error("[SAVINGS] Paid amount does not match deposit:", {
      reference,
      expected: deposit.amount,
      paid: paidAmountNaira,
    });
    return null;
  }

  // Claim the deposit atomically so concurrent webhook/verify calls credit once.
  const { data: claimed } = await supabase
    .from("SavingsDeposit")
    .update({
      status: "COMPLETED",
      paymentChannel: channel || null,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", deposit.id)
    .neq("status", "COMPLETED")
    .select("id");
  if (!claimed?.length) return deposit;

  const { data: plan } = await supabase
    .from("SavingsPlan")
    .select("*")
    .eq("id", deposit.planId)
    .single();

  if (!plan) return null;

  // Recompute from completed deposits instead of incrementing, so two deposits
  // settling at once cannot overwrite each other's total.
  const { data: completedDeposits } = await supabase
    .from("SavingsDeposit")
    .select("amount")
    .eq("planId", plan.id)
    .eq("status", "COMPLETED");
  const savedAmount = (completedDeposits || []).reduce(
    (total: number, row: { amount: number }) => total + Number(row.amount || 0),
    0
  );
  // A plan already spent on a booking must never become spendable again.
  const status =
    plan.status === "USED"
      ? "USED"
      : savedAmount >= Number(plan.targetAmount)
        ? "READY"
        : "ACTIVE";

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
