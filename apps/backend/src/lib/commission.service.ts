import { getAgentNetworkConfig } from "./agent-network-config";
import { creditAgentWallet } from "./agent.service";
import { getSupabaseClient } from "./supabase";

export async function creditCommissionForCompletedAppointment(
  c: any,
  appointmentId: string
) {
  const supabase = getSupabaseClient(c);
  const config = getAgentNetworkConfig(c.env || {});

  const { data: appointment } = await supabase
    .from("Appointment")
    .select(
      "id, patientId, status, isHomeVisit, attributedAgentId, referralId, retailPriceSnapshot"
    )
    .eq("id", appointmentId)
    .single();

  if (!appointment || appointment.status !== "COMPLETED") return null;

  let agentId = appointment.attributedAgentId as string | null;
  let referralId = appointment.referralId as string | null;
  let commissionAllowed = true;

  if (!agentId) {
    const { data: referral } = await supabase
      .from("Referral")
      .select("*")
      .eq("referredUserId", appointment.patientId)
      .in("status", ["ACCEPTED", "SCREENED"])
      .order("acceptedAt", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (referral) {
      referralId = referral.id;
      commissionAllowed = referral.commissionAllowed !== false;
      agentId = commissionAllowed ? referral.referrerAgentId : null;

      if (!appointment.attributedAgentId && agentId) {
        await supabase
          .from("Appointment")
          .update({
            attributedAgentId: agentId,
            referralId: referral.id,
          })
          .eq("id", appointmentId);
      }
    }
  } else if (referralId) {
    const { data: referral } = await supabase
      .from("Referral")
      .select("commissionAllowed")
      .eq("id", referralId)
      .maybeSingle();
    commissionAllowed = referral?.commissionAllowed !== false;
    if (!commissionAllowed) return null;
  }

  // Also respect patient profile consent
  const { data: profile } = await supabase
    .from("PatientProfile")
    .select("commissionConsent")
    .eq("userId", appointment.patientId)
    .maybeSingle();
  if (profile && profile.commissionConsent === false) return null;

  if (!agentId) return null;

  const isHome = Boolean(appointment.isHomeVisit);
  const sourceType = isHome ? "HOME_SCREEN" : "SCREEN";
  const amount = isHome
    ? config.homeScreenCommissionFlat
    : config.screenCommissionFlat;

  const commissionRow = {
    id: crypto.randomUUID(),
    agentId,
    sourceType,
    sourceId: appointmentId,
    amount,
    status: "AVAILABLE",
    appointmentId,
    note: isHome ? "Home screening referral" : "Center screening referral",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data: commission, error } = await supabase
    .from("Commission")
    .upsert(commissionRow, { onConflict: "sourceType,sourceId,agentId" })
    .select("*")
    .maybeSingle();

  if (error) {
    // Unique conflict / already credited
    if (String(error.code) === "23505" || error.message?.includes("duplicate")) {
      return null;
    }
    console.error("Commission insert failed:", error);
    throw error;
  }

  if (!commission) return null;

  // Only credit wallet if this is a fresh AVAILABLE commission
  const { data: existingTx } = await supabase
    .from("AgentWalletTransaction")
    .select("id")
    .eq("commissionId", commission.id)
    .maybeSingle();

  if (!existingTx) {
    await creditAgentWallet(supabase, agentId, amount, {
      reference: `comm_${commission.id}`,
      description: commissionRow.note || "Referral commission",
      commissionId: commission.id,
    });
  }

  if (referralId) {
    await supabase
      .from("Referral")
      .update({ status: "SCREENED", updatedAt: new Date().toISOString() })
      .eq("id", referralId);
  }

  return commission;
}

export async function creditCommissionForSponsoredCampaign(
  c: any,
  campaignId: string,
  fundedAmountNgn: number
) {
  const supabase = getSupabaseClient(c);
  const config = getAgentNetworkConfig(c.env || {});

  const { data: campaign } = await supabase
    .from("DonationCampaign")
    .select("id, invitedByAgentId, title")
    .eq("id", campaignId)
    .single();

  if (!campaign?.invitedByAgentId || fundedAmountNgn <= 0) return null;

  const amount = Math.round(
    (fundedAmountNgn * config.sponsorCommissionPercent) / 100
  );
  if (amount <= 0) return null;

  const commissionRow = {
    id: crypto.randomUUID(),
    agentId: campaign.invitedByAgentId,
    sourceType: "SPONSOR_CAMPAIGN",
    sourceId: `${campaignId}:${Math.floor(fundedAmountNgn)}:${Date.now()}`,
    amount,
    status: "AVAILABLE",
    campaignId,
    note: `Sponsor campaign commission (${config.sponsorCommissionPercent}%)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Use a stable source for first fund event per campaign+amount bucket if needed —
  // for production we credit each successful fund with unique sourceId (timestamp).
  const { data: commission, error } = await supabase
    .from("Commission")
    .insert(commissionRow)
    .select("*")
    .single();

  if (error) {
    console.error("Sponsor commission failed:", error);
    return null;
  }

  await creditAgentWallet(supabase, campaign.invitedByAgentId, amount, {
    reference: `comm_${commission.id}`,
    description: commissionRow.note,
    commissionId: commission.id,
  });

  return commission;
}
