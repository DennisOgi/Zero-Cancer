import { getSupabaseClient } from "./supabase";

function makeCode(prefix: string, len = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = prefix;
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function ensureStaffReferralCode(supabase: any, staffId: string) {
  const { data: staff } = await supabase
    .from("CenterStaff")
    .select("id, referralCode, fullName, email, status")
    .eq("id", staffId)
    .maybeSingle();
  if (!staff) return null;
  if (staff.referralCode) return staff;

  let referralCode = makeCode("NS");
  for (let i = 0; i < 8; i++) {
    const { data: clash } = await supabase
      .from("CenterStaff")
      .select("id")
      .eq("referralCode", referralCode)
      .maybeSingle();
    if (!clash) break;
    referralCode = makeCode("NS");
  }

  const { data: updated, error } = await supabase
    .from("CenterStaff")
    .update({ referralCode })
    .eq("id", staffId)
    .select("id, referralCode, fullName, email, status")
    .single();
  if (error) throw error;
  return updated;
}

export async function getStaffByReferralCode(c: any, code: string) {
  const supabase = getSupabaseClient(c);
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const { data: invite } = await supabase
    .from("StaffReferral")
    .select("*")
    .eq("inviteCode", normalized)
    .maybeSingle();
  if (invite) {
    const { data: staff } = await supabase
      .from("CenterStaff")
      .select("id, referralCode, fullName, email, status, centerId")
      .eq("id", invite.staffId)
      .maybeSingle();
    return staff ? { staff, referral: invite } : null;
  }

  const { data: staff } = await supabase
    .from("CenterStaff")
    .select("id, referralCode, fullName, email, status, centerId")
    .eq("referralCode", normalized)
    .maybeSingle();
  if (!staff) return null;
  return { staff, referral: null };
}

export async function acceptStaffReferral(
  c: any,
  userId: string,
  code: string,
  opts?: { commissionAllowed?: boolean }
) {
  const supabase = getSupabaseClient(c);
  const peeked = await getStaffByReferralCode(c, code);
  if (!peeked?.staff) {
    throw new Error("Invalid nurse referral code");
  }
  if (peeked.staff.status && peeked.staff.status !== "ACTIVE") {
    throw new Error("This referral is no longer active");
  }

  const { data: existing } = await supabase
    .from("StaffReferral")
    .select("*")
    .eq("referredUserId", userId)
    .maybeSingle();
  if (existing) return existing;

  let referral = peeked.referral;
  if (referral && referral.referredUserId && referral.referredUserId !== userId) {
    referral = null;
  }

  const row = {
    id: referral?.id || crypto.randomUUID(),
    staffId: peeked.staff.id,
    referredUserId: userId,
    inviteCode: referral?.inviteCode || peeked.staff.referralCode,
    status: "ACCEPTED",
    commissionAllowed: opts?.commissionAllowed !== false,
    acceptedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdAt: referral?.createdAt || new Date().toISOString(),
  };

  if (referral) {
    const { data, error } = await supabase
      .from("StaffReferral")
      .update({
        referredUserId: userId,
        status: "ACCEPTED",
        commissionAllowed: row.commissionAllowed,
        acceptedAt: row.acceptedAt,
        updatedAt: row.updatedAt,
      })
      .eq("id", referral.id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("StaffReferral")
    .insert(row)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function createStaffReferralInvite(
  supabase: any,
  staffId: string,
  payload: { invitePhone?: string; inviteEmail?: string; inviteName?: string }
) {
  const staff = await ensureStaffReferralCode(supabase, staffId);
  if (!staff) throw new Error("Staff account not found");

  let inviteCode = makeCode("NR");
  for (let i = 0; i < 8; i++) {
    const { data: clash } = await supabase
      .from("StaffReferral")
      .select("id")
      .eq("inviteCode", inviteCode)
      .maybeSingle();
    if (!clash) break;
    inviteCode = makeCode("NR");
  }

  const invite = {
    id: crypto.randomUUID(),
    staffId,
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
    .from("StaffReferral")
    .insert(invite)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
