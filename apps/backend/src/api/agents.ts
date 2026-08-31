import { zValidator } from "@hono/zod-validator";
import type { TErrorResponse } from "@zerocancer/shared/types";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { z } from "zod";
import {
  activateAgent,
  createReferralInvite,
  debitAgentWallet,
  ensureAgentWallet,
  getAgentByUserId,
} from "../lib/agent.service";
import { getAgentNetworkConfig } from "../lib/agent-network-config";
import { getPaystackKeys } from "../lib/paystack-config";
import { getSupabaseClient } from "../lib/supabase";
import { TEnvs, THonoApp } from "../lib/types";
import { authMiddleware } from "../middleware/auth.middleware";

export const agentsApp = new Hono<THonoApp>();

agentsApp.use("*", authMiddleware(["patient"]));

const bankSchema = z.object({
  bankName: z.string().min(2),
  bankCode: z.string().min(2),
  accountNumber: z.string().min(10).max(10),
  accountName: z.string().min(2),
});

const inviteSchema = z.object({
  invitePhone: z.string().optional(),
  inviteEmail: z.string().email().optional().or(z.literal("")),
  inviteName: z.string().optional(),
});

const cashoutSchema = z.object({
  amount: z.number().positive(),
});

// POST /api/v1/agents/activate
agentsApp.post("/activate", async (c) => {
  try {
    const userId = c.get("jwtPayload")?.id as string;
    const agent = await activateAgent(c, userId);
    return c.json({ ok: true, data: agent });
  } catch (error: any) {
    return c.json<TErrorResponse>(
      { ok: false, error: error?.message || "Could not activate agent" },
      400
    );
  }
});

// GET /api/v1/agents/me
agentsApp.get("/me", async (c) => {
  const supabase = getSupabaseClient(c);
  const userId = c.get("jwtPayload")?.id as string;
  const { FRONTEND_URL } = env<TEnvs>(c);
  const config = getAgentNetworkConfig(c.env || {});

  let agent = await getAgentByUserId(c, userId);
  if (!agent) {
    return c.json({
      ok: true,
      data: {
        agent: null,
        eligible: false,
        config: {
          screenCommissionFlat: config.screenCommissionFlat,
          homeScreenCommissionFlat: config.homeScreenCommissionFlat,
          sponsorCommissionPercent: config.sponsorCommissionPercent,
          homeScreeningEnabled: config.homeScreeningEnabled,
        },
      },
    });
  }

  const wallet = await ensureAgentWallet(supabase, agent.id);

  const [{ data: referrals }, { data: commissions }, { count: screenedCount }] =
    await Promise.all([
      supabase
        .from("Referral")
        .select("*")
        .eq("referrerAgentId", agent.id)
        .order("createdAt", { ascending: false })
        .limit(50),
      supabase
        .from("Commission")
        .select("*")
        .eq("agentId", agent.id)
        .order("createdAt", { ascending: false })
        .limit(50),
      supabase
        .from("Referral")
        .select("id", { count: "exact", head: true })
        .eq("referrerAgentId", agent.id)
        .eq("status", "SCREENED"),
    ]);

  return c.json({
    ok: true,
    data: {
      agent,
      wallet,
      referrals: referrals || [],
      commissions: commissions || [],
      stats: {
        referralCount: referrals?.length || 0,
        screenedCount: screenedCount || 0,
        availableBalance: wallet.balance,
      },
      shareUrl: `${FRONTEND_URL}/register/patient?ref=${agent.referralCode}`,
      whatsappText: encodeURIComponent(
        `Join me on ZeroCancer for cervical cancer screening. Use my code ${agent.referralCode}: ${FRONTEND_URL}/register/patient?ref=${agent.referralCode}`
      ),
      config: {
        screenCommissionFlat: config.screenCommissionFlat,
        homeScreenCommissionFlat: config.homeScreenCommissionFlat,
        sponsorCommissionPercent: config.sponsorCommissionPercent,
        homeScreeningEnabled: config.homeScreeningEnabled,
      },
    },
  });
});

// PATCH /api/v1/agents/me/bank
agentsApp.patch(
  "/me/bank",
  zValidator("json", bankSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    try {
      const supabase = getSupabaseClient(c);
      const userId = c.get("jwtPayload")?.id as string;
      const body = c.req.valid("json");
      const { secretKey } = getPaystackKeys(c);

      const agent = await getAgentByUserId(c, userId);
      if (!agent) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Activate as an agent first" },
          400
        );
      }

      // Create Paystack transfer recipient
      const recipRes = await fetch(
        "https://api.paystack.co/transferrecipient",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "nuban",
            name: body.accountName,
            account_number: body.accountNumber,
            bank_code: body.bankCode,
            currency: "NGN",
          }),
        }
      );
      const recipBody = await recipRes.json();
      if (!recipRes.ok) {
        return c.json<TErrorResponse>(
          {
            ok: false,
            error: recipBody?.message || "Could not verify bank account",
          },
          400
        );
      }

      const { data, error } = await supabase
        .from("AgentProfile")
        .update({
          bankName: body.bankName,
          bankCode: body.bankCode,
          accountNumber: body.accountNumber,
          accountName: body.accountName,
          paystackRecipientCode: recipBody.data.recipient_code,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", agent.id)
        .select("*")
        .single();

      if (error) throw error;
      return c.json({ ok: true, data });
    } catch (error: any) {
      return c.json<TErrorResponse>(
        { ok: false, error: error?.message || "Failed to update bank details" },
        500
      );
    }
  }
);

// POST /api/v1/agents/invites
agentsApp.post(
  "/invites",
  zValidator("json", inviteSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    try {
      const userId = c.get("jwtPayload")?.id as string;
      const body = c.req.valid("json");
      const { FRONTEND_URL } = env<TEnvs>(c);

      let agent = await getAgentByUserId(c, userId);
      if (!agent) agent = await activateAgent(c, userId);

      const invite = await createReferralInvite(c, agent.id, {
        invitePhone: body.invitePhone,
        inviteEmail: body.inviteEmail || undefined,
        inviteName: body.inviteName,
      });

      return c.json({
        ok: true,
        data: {
          ...invite,
          shareUrl: `${FRONTEND_URL}/register/patient?ref=${invite.inviteCode}`,
        },
      });
    } catch (error: any) {
      return c.json<TErrorResponse>(
        { ok: false, error: error?.message || "Failed to create invite" },
        400
      );
    }
  }
);

// POST /api/v1/agents/cashout
agentsApp.post(
  "/cashout",
  zValidator("json", cashoutSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    try {
      const supabase = getSupabaseClient(c);
      const userId = c.get("jwtPayload")?.id as string;
      const { amount } = c.req.valid("json");
      const { secretKey } = getPaystackKeys(c);

      const agent = await getAgentByUserId(c, userId);
      if (!agent?.paystackRecipientCode) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Add bank details before cashing out" },
          400
        );
      }

      const { wallet, balanceAfter } = await debitAgentWallet(
        supabase,
        agent.id,
        amount,
        { description: "Cashout request" }
      );

      const reference = `agc_${agent.id.slice(0, 8)}_${Date.now()}`;
      const cashout = {
        id: crypto.randomUUID(),
        walletId: wallet.id,
        agentId: agent.id,
        amount,
        status: "PROCESSING",
        paystackReference: reference,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await supabase.from("AgentCashout").insert(cashout);

      const transferRes = await fetch("https://api.paystack.co/transfer", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "balance",
          amount: Math.round(amount * 100),
          recipient: agent.paystackRecipientCode,
          reference,
          reason: "ZeroCancer agent commission payout",
        }),
      });
      const transferBody = await transferRes.json();

      if (!transferRes.ok) {
        // refund wallet
        await supabase
          .from("AgentWallet")
          .update({
            balance: Number(wallet.balance),
            updatedAt: new Date().toISOString(),
          })
          .eq("id", wallet.id);
        await supabase
          .from("AgentCashout")
          .update({
            status: "FAILED",
            failureReason: transferBody?.message || "Transfer failed",
            updatedAt: new Date().toISOString(),
          })
          .eq("id", cashout.id);

        return c.json<TErrorResponse>(
          {
            ok: false,
            error: transferBody?.message || "Cashout transfer failed",
          },
          400
        );
      }

      await supabase
        .from("AgentCashout")
        .update({
          status: "SUCCESS",
          paystackTransferCode: transferBody?.data?.transfer_code || null,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", cashout.id);

      await supabase
        .from("AgentProfile")
        .update({
          totalPaidOut: Number(agent.totalPaidOut || 0) + amount,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", agent.id);

      return c.json({
        ok: true,
        data: { cashout, balanceAfter },
        message: "Cashout successful",
      });
    } catch (error: any) {
      return c.json<TErrorResponse>(
        { ok: false, error: error?.message || "Cashout failed" },
        400
      );
    }
  }
);
