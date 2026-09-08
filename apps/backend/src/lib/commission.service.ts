import { getAgentNetworkConfig } from "./agent-network-config";
import { creditAgentWallet } from "./agent.service";
import { creditStaffWallet, ensureStaffWallet } from "./staff-wallet.service";
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
      "id, patientId, centerId, status, isHomeVisit, attributedAgentId, referralId, retailPriceSnapshot"
    )
    .eq("id", appointmentId)
    .single();

  if (!appointment || appointment.status !== "COMPLETED") return null;

  let agentId = appointment.attributedAgentId as string | null;
  let referralId = appointment.referralId as string | null;
  let commissionAllowed = true;
  let preferredCenterId: string | null = null;

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
      preferredCenterId = referral.preferredCenterId || null;
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
      .select("commissionAllowed, preferredCenterId")
      .eq("id", referralId)
      .maybeSingle();
    commissionAllowed = referral?.commissionAllowed !== false;
    preferredCenterId = referral?.preferredCenterId || null;
    if (!commissionAllowed) agentId = null;
  }

  const { data: profile } = await supabase
    .from("PatientProfile")
    .select("commissionConsent")
    .eq("userId", appointment.patientId)
    .maybeSingle();
  if (profile && profile.commissionConsent === false) return null;

  // Nurse-direct referrals pay at any center, independent of hospital-bound agent links.
  await creditStaffDirectReferralCommission(c, {
    appointmentId,
    patientId: appointment.patientId,
    isHome: Boolean(appointment.isHomeVisit),
  });

  if (
    preferredCenterId &&
    appointment.centerId &&
    preferredCenterId !== appointment.centerId
  ) {
    return null;
  }

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
    if (String(error.code) === "23505" || error.message?.includes("duplicate")) {
      await creditNurseUplineCommission(c, {
        appointmentId,
        agentId,
        preferredCenterId,
        amount: config.nurseReferralCommissionFlat,
      });
      return null;
    }
    console.error("Commission insert failed:", error);
    throw error;
  }

  if (commission) {
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
  }

  if (referralId) {
    await supabase
      .from("Referral")
      .update({ status: "SCREENED", updatedAt: new Date().toISOString() })
      .eq("id", referralId);
  }

  await creditNurseUplineCommission(c, {
    appointmentId,
    agentId,
    preferredCenterId,
    amount: config.nurseReferralCommissionFlat,
  });

  return commission;
}

async function creditNurseUplineCommission(
  c: any,
  params: {
    appointmentId: string;
    agentId: string;
    preferredCenterId: string | null;
    amount: number;
  }
) {
  if (!params.amount || params.amount <= 0) return null;
  const supabase = getSupabaseClient(c);

  const { data: agent } = await supabase
    .from("AgentProfile")
    .select("userId")
    .eq("id", params.agentId)
    .maybeSingle();
  if (!agent?.userId) return null;

  const { data: referrerProfile } = await supabase
    .from("PatientProfile")
    .select("onboardedByStaffId, onboardedByCenterId, assignedCenterId")
    .eq("userId", agent.userId)
    .maybeSingle();

  const staffId = referrerProfile?.onboardedByStaffId;
  if (!staffId) return null;

  const boundCenterId =
    params.preferredCenterId ||
    referrerProfile?.onboardedByCenterId ||
    referrerProfile?.assignedCenterId;
  if (!boundCenterId) return null;

  const { data: staff } = await supabase
    .from("CenterStaff")
    .select("id, centerId, status")
    .eq("id", staffId)
    .maybeSingle();
  if (!staff || staff.centerId !== boundCenterId) return null;
  if (staff.status && staff.status !== "ACTIVE") return null;

  await ensureStaffWallet(supabase, staff.id);

  const staffCommission = {
    id: crypto.randomUUID(),
    staffId: staff.id,
    sourceType: "PATIENT_REFERRAL_SCREEN",
    sourceId: params.appointmentId,
    amount: params.amount,
    status: "AVAILABLE",
    appointmentId: params.appointmentId,
    note: "Nurse reward for a referred screening at this center",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data: created, error } = await supabase
    .from("StaffCommission")
    .insert(staffCommission)
    .select("*")
    .maybeSingle();

  if (error) {
    if (String(error.code) === "23505" || error.message?.includes("duplicate")) {
      return null;
    }
    console.error("Staff commission insert failed:", error);
    return null;
  }
  if (!created) return null;

  await creditStaffWallet(supabase, staff.id, params.amount, {
    reference: `staff_comm_${created.id}`,
    description: staffCommission.note,
    commissionId: created.id,
  });

  return created;
}

async function creditStaffDirectReferralCommission(
  c: any,
  params: { appointmentId: string; patientId: string; isHome: boolean }
) {
  const supabase = getSupabaseClient(c);
  const config = getAgentNetworkConfig(c.env || {});

  const { data: referral } = await supabase
    .from("StaffReferral")
    .select("*")
    .eq("referredUserId", params.patientId)
    .in("status", ["ACCEPTED", "SCREENED"])
    .order("acceptedAt", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!referral || referral.commissionAllowed === false) return null;

  const { data: staff } = await supabase
    .from("CenterStaff")
    .select("id, status")
    .eq("id", referral.staffId)
    .maybeSingle();
  if (!staff) return null;
  if (staff.status && staff.status !== "ACTIVE") return null;

  const amount = params.isHome
    ? config.homeScreenCommissionFlat
    : config.screenCommissionFlat;
  if (!amount || amount <= 0) return null;

  const sourceType = params.isHome
    ? "NURSE_DIRECT_HOME_SCREEN"
    : "NURSE_DIRECT_SCREEN";
  const staffCommission = {
    id: crypto.randomUUID(),
    staffId: staff.id,
    sourceType,
    sourceId: params.appointmentId,
    amount,
    status: "AVAILABLE",
    appointmentId: params.appointmentId,
    note: params.isHome
      ? "Nurse referral — home screening (any center)"
      : "Nurse referral — screening at any center",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await ensureStaffWallet(supabase, staff.id);
  const { data: created, error } = await supabase
    .from("StaffCommission")
    .insert(staffCommission)
    .select("*")
    .maybeSingle();
  if (error) {
    if (String(error.code) === "23505" || error.message?.includes("duplicate")) {
      return null;
    }
    console.error("Nurse direct commission insert failed:", error);
    return null;
  }
  if (!created) return null;

  await creditStaffWallet(supabase, staff.id, amount, {
    reference: `staff_direct_${created.id}`,
    description: staffCommission.note,
    commissionId: created.id,
  });

  await supabase
    .from("StaffReferral")
    .update({ status: "SCREENED", updatedAt: new Date().toISOString() })
    .eq("id", referral.id);

  return created;
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
