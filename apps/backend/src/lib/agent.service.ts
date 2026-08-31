import { getAgentNetworkConfig } from "./agent-network-config";
import { getSupabaseClient } from "./supabase";

function makeCode(prefix: string, len = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = prefix;
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function ensureAgentWallet(supabase: any, agentId: string) {
  const { data: existing } = await supabase
    .from("AgentWallet")
    .select("*")
    .eq("agentId", agentId)
    .maybeSingle();
  if (existing) return existing;

  const wallet = {
    id: crypto.randomUUID(),
    agentId,
    balance: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("AgentWallet")
    .insert(wallet)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function activateAgent(c: any, userId: string) {
  const supabase = getSupabaseClient(c);
  const config = getAgentNetworkConfig(c.env || {});

  const { data: existing } = await supabase
    .from("AgentProfile")
    .select("*")
    .eq("userId", userId)
    .maybeSingle();
  if (existing) {
    await ensureAgentWallet(supabase, existing.id);
    return existing;
  }

  if (config.requireCompletedScreen) {
    const { data: completed } = await supabase
      .from("Appointment")
      .select("id")
      .eq("patientId", userId)
      .eq("status", "COMPLETED")
      .limit(1)
      .maybeSingle();
    if (!completed) {
      throw new Error(
        "Complete at least one screening before becoming an agent."
      );
    }
  }

  let referralCode = makeCode("ZC");
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await supabase
      .from("AgentProfile")
      .select("id")
      .eq("referralCode", referralCode)
      .maybeSingle();
    if (!clash) break;
    referralCode = makeCode("ZC");
  }

  const agent = {
    id: crypto.randomUUID(),
    userId,
    referralCode,
    status: "ACTIVE",
    totalEarned: 0,
    totalPaidOut: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("AgentProfile")
    .insert(agent)
    .select("*")
    .single();
  if (error) throw error;

  await ensureAgentWallet(supabase, data.id);
  return data;
}

export async function getAgentByUserId(c: any, userId: string) {
  const supabase = getSupabaseClient(c);
  const { data } = await supabase
    .from("AgentProfile")
    .select("*")
    .eq("userId", userId)
    .maybeSingle();
  return data;
}

export async function getAgentByCode(c: any, code: string) {
  const supabase = getSupabaseClient(c);
  const { data } = await supabase
    .from("AgentProfile")
    .select("*")
    .eq("referralCode", code.trim().toUpperCase())
    .eq("status", "ACTIVE")
    .maybeSingle();
  return data;
}

export async function createReferralInvite(
  c: any,
  agentId: string,
  payload: {
    invitePhone?: string;
    inviteEmail?: string;
    inviteName?: string;
  }
) {
  const supabase = getSupabaseClient(c);
  let inviteCode = makeCode("RF", 10);
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await supabase
      .from("Referral")
      .select("id")
      .eq("inviteCode", inviteCode)
      .maybeSingle();
    if (!clash) break;
    inviteCode = makeCode("RF", 10);
  }

  const row = {
    id: crypto.randomUUID(),
    referrerAgentId: agentId,
    inviteCode,
    invitePhone: payload.invitePhone || null,
    inviteEmail: payload.inviteEmail || null,
    inviteName: payload.inviteName || null,
    status: "PENDING",
    commissionAllowed: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("Referral")
    .insert(row)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function acceptReferralInvite(
  c: any,
  userId: string,
  code: string,
  opts?: { commissionAllowed?: boolean; preferredCenterId?: string | null }
) {
  const supabase = getSupabaseClient(c);
  const config = getAgentNetworkConfig(c.env || {});
  const normalized = code.trim().toUpperCase();

  // Prefer invite-code referral; fall back to agent referral code
  let { data: referral } = await supabase
    .from("Referral")
    .select("*")
    .eq("inviteCode", normalized)
    .maybeSingle();

  if (!referral) {
    const agent = await getAgentByCode(c, normalized);
    if (!agent) throw new Error("Invalid referral code");
    if (agent.userId === userId) {
      throw new Error("You cannot use your own referral code");
    }
    referral = await createReferralInvite(c, agent.id, {});
  }

  if (referral.referredUserId && referral.referredUserId !== userId) {
    throw new Error("This invite was already used by another person");
  }

  const commissionAllowed =
    opts?.commissionAllowed ?? config.defaultCommissionAllowed;

  const { data: updated, error } = await supabase
    .from("Referral")
    .update({
      referredUserId: userId,
      status: "ACCEPTED",
      commissionAllowed,
      preferredCenterId: opts?.preferredCenterId ?? referral.preferredCenterId,
      acceptedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq("id", referral.id)
    .select("*")
    .single();
  if (error) throw error;

  const { data: agent } = await supabase
    .from("AgentProfile")
    .select("referralCode")
    .eq("id", updated.referrerAgentId)
    .single();

  await supabase
    .from("PatientProfile")
    .update({
      referralCodeUsed: agent?.referralCode || normalized,
      commissionConsent: commissionAllowed,
    })
    .eq("userId", userId);

  return updated;
}

export async function updateReferralConsent(
  c: any,
  userId: string,
  payload: { commissionAllowed: boolean; preferredCenterId?: string | null }
) {
  const supabase = getSupabaseClient(c);

  await supabase
    .from("PatientProfile")
    .update({
      commissionConsent: payload.commissionAllowed,
      ...(payload.preferredCenterId !== undefined
        ? { assignedCenterId: payload.preferredCenterId || null }
        : {}),
    })
    .eq("userId", userId);

  const { data: referral } = await supabase
    .from("Referral")
    .select("*")
    .eq("referredUserId", userId)
    .order("acceptedAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!referral) return null;

  const { data, error } = await supabase
    .from("Referral")
    .update({
      commissionAllowed: payload.commissionAllowed,
      preferredCenterId:
        payload.preferredCenterId !== undefined
          ? payload.preferredCenterId
          : referral.preferredCenterId,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", referral.id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function resolveAttributionForPatient(c: any, patientId: string) {
  const supabase = getSupabaseClient(c);
  const { data: referral } = await supabase
    .from("Referral")
    .select("*")
    .eq("referredUserId", patientId)
    .in("status", ["ACCEPTED", "SCREENED"])
    .order("acceptedAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!referral) return { referral: null, agentId: null };

  return {
    referral,
    agentId: referral.commissionAllowed ? referral.referrerAgentId : null,
  };
}

export async function creditAgentWallet(
  supabase: any,
  agentId: string,
  amount: number,
  meta: { reference?: string; description?: string; commissionId?: string }
) {
  const wallet = await ensureAgentWallet(supabase, agentId);
  const balanceAfter = Number(wallet.balance || 0) + amount;

  const { error: wErr } = await supabase
    .from("AgentWallet")
    .update({ balance: balanceAfter, updatedAt: new Date().toISOString() })
    .eq("id", wallet.id);
  if (wErr) throw wErr;

  await supabase.from("AgentWalletTransaction").insert({
    id: crypto.randomUUID(),
    walletId: wallet.id,
    type: "CREDIT",
    amount,
    balanceAfter,
    reference: meta.reference || null,
    description: meta.description || null,
    commissionId: meta.commissionId || null,
    createdAt: new Date().toISOString(),
  });

  await supabase
    .from("AgentProfile")
    .update({
      totalEarned: supabase.rpc ? undefined : undefined,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", agentId);

  // Increment totalEarned safely
  const { data: agent } = await supabase
    .from("AgentProfile")
    .select("totalEarned")
    .eq("id", agentId)
    .single();
  await supabase
    .from("AgentProfile")
    .update({
      totalEarned: Number(agent?.totalEarned || 0) + amount,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", agentId);

  return balanceAfter;
}

export async function debitAgentWallet(
  supabase: any,
  agentId: string,
  amount: number,
  meta: { reference?: string; description?: string }
) {
  const wallet = await ensureAgentWallet(supabase, agentId);
  const current = Number(wallet.balance || 0);
  if (amount > current) throw new Error("Insufficient wallet balance");
  const balanceAfter = current - amount;

  const { error: wErr } = await supabase
    .from("AgentWallet")
    .update({ balance: balanceAfter, updatedAt: new Date().toISOString() })
    .eq("id", wallet.id);
  if (wErr) throw wErr;

  await supabase.from("AgentWalletTransaction").insert({
    id: crypto.randomUUID(),
    walletId: wallet.id,
    type: "DEBIT",
    amount,
    balanceAfter,
    reference: meta.reference || null,
    description: meta.description || null,
    createdAt: new Date().toISOString(),
  });

  return { wallet, balanceAfter };
}
