import { zValidator } from "@hono/zod-validator";
import type { TErrorResponse } from "@zerocancer/shared/types";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { z } from "zod";
import { getAgentNetworkConfig } from "../lib/agent-network-config";
import {
  canAccessStaffEarnings,
  resolveCenterStaff,
} from "../lib/center-context";
import { getDB } from "../lib/db";
import {
  initiateFlutterwaveTransfer,
  isFlutterwaveConfigured,
  resolveFlutterwaveAccount,
} from "../lib/flutterwave";
import {
  createStaffReferralInvite,
  ensureStaffReferralCode,
} from "../lib/staff-referral.service";
import {
  debitStaffWallet,
  ensureStaffWallet,
} from "../lib/staff-wallet.service";
import { getSupabaseClient } from "../lib/supabase";
import { TEnvs, THonoApp } from "../lib/types";
import { authMiddleware } from "../middleware/auth.middleware";

export const staffEarningsApp = new Hono<THonoApp>();

staffEarningsApp.use("*", authMiddleware(["center", "center_staff"]));

const bankSchema = z.object({
  bankName: z.string().min(2),
  bankCode: z.string().min(2),
  accountNumber: z.string().min(10).max(10),
  accountName: z.string().min(2),
});

const cashoutSchema = z.object({
  amount: z.number().positive(),
});

const inviteSchema = z.object({
  invitePhone: z.string().min(7).optional(),
  inviteEmail: z.string().email().optional(),
  inviteName: z.string().min(2).optional(),
});

const MIN_CASHOUT_NGN = 100;

const EARNINGS_PRIVATE_ERROR =
  "Referral earnings are private to nurses and are not available to facility administrators.";

function staffShareUrl(frontendUrl: string, code: string) {
  const base = (frontendUrl || "https://zerocancer.africa").replace(/\/$/, "");
  return `${base}/sign-up/patient?ref=${encodeURIComponent(code)}`;
}

async function requireNurseEarnings(c: any) {
  const db = getDB(c);
  const resolved = await resolveCenterStaff(c, db);
  if (!canAccessStaffEarnings(resolved) || !resolved.staff) {
    return {
      error: c.json<TErrorResponse>(
        { ok: false, error: EARNINGS_PRIVATE_ERROR },
        403
      ),
      resolved: null,
    };
  }
  return { error: null, resolved };
}

staffEarningsApp.get("/me", async (c) => {
  try {
    const { error, resolved } = await requireNurseEarnings(c);
    if (error || !resolved?.staffId) return error!;

    const supabase = getSupabaseClient(c);
    const { FRONTEND_URL } = env<TEnvs>(c);
    const staff = await ensureStaffReferralCode(supabase, resolved.staffId);
    const wallet = await ensureStaffWallet(supabase, resolved.staffId);
    const config = getAgentNetworkConfig(c.env || {});
    const referralCode = staff?.referralCode || resolved.staff?.referralCode;
    const shareUrl = referralCode
      ? staffShareUrl(FRONTEND_URL, referralCode)
      : null;

    const [{ data: commissions }, { data: cashouts }, { data: referrals }] =
      await Promise.all([
        supabase
          .from("StaffCommission")
          .select("*")
          .eq("staffId", resolved.staffId)
          .order("createdAt", { ascending: false })
          .limit(50),
        supabase
          .from("StaffCashout")
          .select("*")
          .eq("staffId", resolved.staffId)
          .order("createdAt", { ascending: false })
          .limit(20),
        supabase
          .from("StaffReferral")
          .select(
            "id, inviteCode, inviteName, invitePhone, inviteEmail, status, acceptedAt, createdAt, referredUserId"
          )
          .eq("staffId", resolved.staffId)
          .order("createdAt", { ascending: false })
          .limit(50),
      ]);

    const referredIds = [
      ...new Set(
        (referrals || [])
          .map((row: any) => row.referredUserId)
          .filter(Boolean)
      ),
    ];
    const { data: referredUsers } = referredIds.length
      ? await supabase.from("User").select("id, fullName").in("id", referredIds)
      : { data: [] };
    const nameById = new Map(
      (referredUsers || []).map((user: any) => [user.id, user.fullName])
    );

    return c.json({
      ok: true,
      data: {
        staff: {
          id: resolved.staff.id,
          email: resolved.staff.email,
          fullName: resolved.staff.fullName,
          role: resolved.staffRole,
          status: resolved.staff.status,
          referralCode,
          bankName: resolved.staff.bankName,
          bankCode: resolved.staff.bankCode,
          accountNumber: resolved.staff.accountNumber,
          accountName: resolved.staff.accountName,
          totalEarned: resolved.staff.totalEarned,
          totalPaidOut: resolved.staff.totalPaidOut,
        },
        wallet,
        shareUrl,
        shareMessage: referralCode
          ? `Join me on ZeroCancer for cervical cancer screening — you can screen at any participating center. Use my code ${referralCode}: ${shareUrl}`
          : null,
        referrals: (referrals || []).map((row: any) => ({
          id: row.id,
          inviteCode: row.inviteCode,
          name:
            nameById.get(row.referredUserId) ||
            row.inviteName ||
            "Referred patient",
          status: row.status,
          acceptedAt: row.acceptedAt,
          createdAt: row.createdAt,
        })),
        commissions: commissions || [],
        cashouts: cashouts || [],
        config: {
          screenCommissionFlat: config.screenCommissionFlat,
          homeScreenCommissionFlat: config.homeScreenCommissionFlat,
          nurseReferralCommissionFlat: config.nurseReferralCommissionFlat,
          payoutProvider: "FLUTTERWAVE",
        },
      },
    });
  } catch (error: any) {
    return c.json<TErrorResponse>(
      { ok: false, error: error?.message || "Failed to load earnings" },
      500
    );
  }
});

staffEarningsApp.post(
  "/invites",
  zValidator("json", inviteSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    try {
      const { error, resolved } = await requireNurseEarnings(c);
      if (error || !resolved?.staffId) return error!;

      const supabase = getSupabaseClient(c);
      const { FRONTEND_URL } = env<TEnvs>(c);
      const body = c.req.valid("json");
      const invite = await createStaffReferralInvite(
        supabase,
        resolved.staffId,
        body
      );
      const shareUrl = staffShareUrl(FRONTEND_URL, invite.inviteCode);
      return c.json({
        ok: true,
        data: {
          ...invite,
          shareUrl,
          shareMessage: `Join me on ZeroCancer for cervical cancer screening — you can screen at any participating center. Use my code ${invite.inviteCode}: ${shareUrl}`,
        },
      });
    } catch (error: any) {
      return c.json<TErrorResponse>(
        { ok: false, error: error?.message || "Could not create invite" },
        400
      );
    }
  }
);

staffEarningsApp.patch(
  "/me/bank",
  zValidator("json", bankSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    try {
      const { error, resolved } = await requireNurseEarnings(c);
      if (error || !resolved?.staffId) return error!;

      if (!isFlutterwaveConfigured(c)) {
        return c.json<TErrorResponse>(
          {
            ok: false,
            error:
              "Flutterwave is not configured. Set FLUTTERWAVE_SECRET_KEY to enable payouts.",
          },
          503
        );
      }

      const supabase = getSupabaseClient(c);
      const body = c.req.valid("json");
      const resolvedAccount = await resolveFlutterwaveAccount(c, {
        accountNumber: body.accountNumber,
        bankCode: body.bankCode,
      });

      const { data, error: updateError } = await supabase
        .from("CenterStaff")
        .update({
          bankName: body.bankName,
          bankCode: body.bankCode,
          accountNumber: resolvedAccount.accountNumber || body.accountNumber,
          accountName: resolvedAccount.accountName || body.accountName,
          flutterwaveRecipientId: `fw:${body.bankCode}:${body.accountNumber}`,
        })
        .eq("id", resolved.staffId)
        .select(
          "id, email, fullName, role, status, bankName, bankCode, accountNumber, accountName"
        )
        .single();

      if (updateError) throw updateError;
      return c.json({ ok: true, data });
    } catch (error: any) {
      return c.json<TErrorResponse>(
        { ok: false, error: error?.message || "Failed to save bank details" },
        400
      );
    }
  }
);

staffEarningsApp.post(
  "/cashout",
  zValidator("json", cashoutSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    try {
      const { error, resolved } = await requireNurseEarnings(c);
      if (error || !resolved?.staffId || !resolved.staff) return error!;

      if (!isFlutterwaveConfigured(c)) {
        return c.json<TErrorResponse>(
          {
            ok: false,
            error:
              "Flutterwave is not configured. Set FLUTTERWAVE_SECRET_KEY to enable payouts.",
          },
          503
        );
      }

      const supabase = getSupabaseClient(c);
      const staff = resolved.staff;
      if (staff.status && staff.status !== "ACTIVE") {
        return c.json<TErrorResponse>(
          { ok: false, error: "This staff account cannot cash out" },
          400
        );
      }
      if (!staff.accountNumber || !staff.bankCode) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Add bank details before cashing out" },
          400
        );
      }

      const { amount } = c.req.valid("json");
      if (amount < MIN_CASHOUT_NGN) {
        return c.json<TErrorResponse>(
          { ok: false, error: `Minimum cashout is ₦${MIN_CASHOUT_NGN}` },
          400
        );
      }

      const { wallet, balanceAfter } = await debitStaffWallet(
        supabase,
        resolved.staffId,
        amount,
        { description: "Referral cashout request" }
      );

      const reference = `stf_fw_${resolved.staffId.slice(0, 8)}_${Date.now()}`;
      const cashout = {
        id: crypto.randomUUID(),
        walletId: wallet.id,
        staffId: resolved.staffId,
        amount,
        status: "PROCESSING",
        payoutProvider: "FLUTTERWAVE",
        flutterwaveReference: reference,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await supabase.from("StaffCashout").insert(cashout);

      try {
        const transfer = await initiateFlutterwaveTransfer(c, {
          accountNumber: staff.accountNumber,
          bankCode: staff.bankCode,
          amountNgn: amount,
          reference,
          narration: "ZeroCancer nurse referral payout",
        });

        await supabase
          .from("StaffCashout")
          .update({
            flutterwaveTransferId: transfer.transferId,
            flutterwaveReference: transfer.reference || reference,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", cashout.id);

        return c.json({
          ok: true,
          data: {
            cashout: { ...cashout, status: "PROCESSING" },
            balanceAfter,
          },
          message:
            "Cashout submitted. Flutterwave will send the funds to your bank.",
        });
      } catch (error: any) {
        await supabase
          .from("StaffWallet")
          .update({
            balance: Number(wallet.balance),
            updatedAt: new Date().toISOString(),
          })
          .eq("id", wallet.id);
        await supabase
          .from("StaffCashout")
          .update({
            status: "FAILED",
            failureReason: error?.message || "Transfer failed",
            updatedAt: new Date().toISOString(),
          })
          .eq("id", cashout.id);

        return c.json<TErrorResponse>(
          { ok: false, error: error?.message || "Cashout transfer failed" },
          400
        );
      }
    } catch (error: any) {
      return c.json<TErrorResponse>(
        { ok: false, error: error?.message || "Cashout failed" },
        400
      );
    }
  }
);
