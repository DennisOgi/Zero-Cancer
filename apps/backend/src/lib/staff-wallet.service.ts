import { getSupabaseClient } from "./supabase";

export async function ensureStaffWallet(supabase: any, staffId: string) {
  const { data: existing } = await supabase
    .from("StaffWallet")
    .select("*")
    .eq("staffId", staffId)
    .maybeSingle();
  if (existing) return existing;

  const wallet = {
    id: crypto.randomUUID(),
    staffId,
    balance: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("StaffWallet")
    .insert(wallet)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function creditStaffWallet(
  supabase: any,
  staffId: string,
  amount: number,
  meta: {
    reference?: string;
    description?: string;
    commissionId?: string;
    skipEarnings?: boolean;
  }
) {
  const wallet = await ensureStaffWallet(supabase, staffId);
  const balanceAfter = Number(wallet.balance || 0) + Number(amount);
  const { error } = await supabase
    .from("StaffWallet")
    .update({ balance: balanceAfter, updatedAt: new Date().toISOString() })
    .eq("id", wallet.id);
  if (error) throw error;

  if (!meta.skipEarnings) {
    const { data: staff } = await supabase
      .from("CenterStaff")
      .select("totalEarned")
      .eq("id", staffId)
      .single();
    await supabase
      .from("CenterStaff")
      .update({
        totalEarned: Number(staff?.totalEarned || 0) + Number(amount),
      })
      .eq("id", staffId);
  }

  await supabase.from("StaffWalletTransaction").insert({
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

  return { wallet: { ...wallet, balance: balanceAfter }, balanceAfter };
}

export async function debitStaffWallet(
  supabase: any,
  staffId: string,
  amount: number,
  meta: { description?: string }
) {
  const wallet = await ensureStaffWallet(supabase, staffId);
  const current = Number(wallet.balance || 0);
  if (amount > current) {
    throw new Error("Insufficient wallet balance");
  }
  const balanceAfter = current - Number(amount);
  const { error } = await supabase
    .from("StaffWallet")
    .update({ balance: balanceAfter, updatedAt: new Date().toISOString() })
    .eq("id", wallet.id);
  if (error) throw error;

  await supabase.from("StaffWalletTransaction").insert({
    id: crypto.randomUUID(),
    walletId: wallet.id,
    type: "DEBIT",
    amount,
    balanceAfter,
    description: meta.description || null,
    createdAt: new Date().toISOString(),
  });

  return { wallet, balanceAfter };
}

export async function settleStaffCashoutFromPaystack(
  c: any,
  payload: { event?: string; data?: { reference?: string; id?: string | number } }
) {
  const supabase = getSupabaseClient(c);
  const reference = payload?.data?.reference;
  const event = payload?.event || "";
  if (!reference || !event.startsWith("transfer.")) {
    return { handled: false };
  }

  return settleStaffCashoutFromFlutterwave(supabase, {
    reference,
    status:
      event === "transfer.success"
        ? "SUCCESS"
        : event === "transfer.failed" || event === "transfer.reversed"
          ? "FAILED"
          : event,
    id: payload.data?.id,
  });
}

export async function settleStaffCashoutFromFlutterwave(
  supabase: any,
  payload: { reference?: string; status?: string; id?: string | number }
) {
  const reference = payload?.reference;
  if (!reference) return { handled: false };

  const { data: cashout } = await supabase
    .from("StaffCashout")
    .select("*")
    .eq("flutterwaveReference", reference)
    .maybeSingle();
  if (!cashout) return { handled: false };
  if (cashout.status === "SUCCESS" || cashout.status === "FAILED") {
    return { handled: true, alreadySettled: true };
  }

  const status = String(payload.status || "").toUpperCase();
  if (status === "SUCCESSFUL" || status === "SUCCESS") {
    await supabase
      .from("StaffCashout")
      .update({
        status: "SUCCESS",
        flutterwaveTransferId: payload.id != null ? String(payload.id) : cashout.flutterwaveTransferId,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", cashout.id);

    const { data: staff } = await supabase
      .from("CenterStaff")
      .select("totalPaidOut")
      .eq("id", cashout.staffId)
      .single();
    await supabase
      .from("CenterStaff")
      .update({
        totalPaidOut: Number(staff?.totalPaidOut || 0) + Number(cashout.amount),
      })
      .eq("id", cashout.staffId);

    return { handled: true, status: "SUCCESS" };
  }

  if (status !== "FAILED") {
    return { handled: true, status: "PENDING" };
  }

  await supabase
    .from("StaffCashout")
    .update({
      status: "FAILED",
      failureReason: String(payload.status || "FAILED"),
      updatedAt: new Date().toISOString(),
    })
    .eq("id", cashout.id);

  await creditStaffWallet(supabase, cashout.staffId, Number(cashout.amount), {
    reference,
    description: "Cashout reversed after Flutterwave failure",
    skipEarnings: true,
  });

  return { handled: true, status: "FAILED" };
}
