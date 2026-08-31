import { zValidator } from "@hono/zod-validator";
import type { TErrorResponse } from "@zerocancer/shared/types";
import { Hono } from "hono";
import { z } from "zod";
import {
  completeSavingsDepositByReference,
  createSavingsPlan,
  initializeSavingsDeposit,
} from "../lib/savings.service";
import { getAgentNetworkConfig } from "../lib/agent-network-config";
import { getSupabaseClient } from "../lib/supabase";
import { THonoApp } from "../lib/types";
import { authMiddleware } from "../middleware/auth.middleware";
import { getPaystackKeys } from "../lib/paystack-config";
import { CryptoUtils } from "../lib/crypto.utils";

export const savingsApp = new Hono<THonoApp>();

const createPlanSchema = z.object({
  screeningTypeId: z.string().uuid(),
  preferredCenterId: z.string().uuid().optional().nullable(),
  targetAmount: z.number().positive().optional(),
});

const depositSchema = z.object({
  amount: z.number().positive(),
});

// GET /api/v1/savings
savingsApp.get("/", authMiddleware(["patient"]), async (c) => {
  const supabase = getSupabaseClient(c);
  const userId = c.get("jwtPayload")?.id as string;
  const config = getAgentNetworkConfig(c.env || {});

  const { data: plans } = await supabase
    .from("SavingsPlan")
    .select("*")
    .eq("patientId", userId)
    .order("createdAt", { ascending: false });

  return c.json({
    ok: true,
    data: {
      plans: plans || [],
      minDeposit: config.savingsMinDeposit,
    },
  });
});

// POST /api/v1/savings
savingsApp.post(
  "/",
  authMiddleware(["patient"]),
  zValidator("json", createPlanSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    try {
      const userId = c.get("jwtPayload")?.id as string;
      const body = c.req.valid("json");
      const plan = await createSavingsPlan(c, userId, body);
      return c.json({ ok: true, data: plan });
    } catch (error: any) {
      return c.json<TErrorResponse>(
        { ok: false, error: error?.message || "Could not create savings plan" },
        400
      );
    }
  }
);

// POST /api/v1/savings/:id/deposit
savingsApp.post(
  "/:id/deposit",
  authMiddleware(["patient"]),
  zValidator("json", depositSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    try {
      const userId = c.get("jwtPayload")?.id as string;
      const planId = c.req.param("id");
      const { amount } = c.req.valid("json");
      const result = await initializeSavingsDeposit(c, userId, planId, amount);
      return c.json({ ok: true, data: result });
    } catch (error: any) {
      return c.json<TErrorResponse>(
        { ok: false, error: error?.message || "Could not start deposit" },
        400
      );
    }
  }
);

// GET /api/v1/savings/verify/:reference
savingsApp.get(
  "/verify/:reference",
  authMiddleware(["patient"]),
  async (c) => {
    try {
      const reference = c.req.param("reference");
      const { secretKey } = getPaystackKeys(c);

      const verifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: { Authorization: `Bearer ${secretKey}` },
        }
      );
      const verifyBody = await verifyRes.json();
      if (!verifyRes.ok || verifyBody?.data?.status !== "success") {
        return c.json<TErrorResponse>(
          { ok: false, error: "Payment not successful yet" },
          400
        );
      }

      const completed = await completeSavingsDepositByReference(
        c,
        reference,
        verifyBody?.data?.channel
      );

      return c.json({ ok: true, data: completed });
    } catch (error: any) {
      return c.json<TErrorResponse>(
        { ok: false, error: error?.message || "Verification failed" },
        500
      );
    }
  }
);

// POST /api/v1/savings/webhook — optional dedicated path; also handled via donor webhook bridge
savingsApp.post("/webhook", async (c) => {
  try {
    const signature = c.req.header("x-paystack-signature");
    const rawBody = await c.req.text();
    if (!signature) {
      return c.json({ ok: false, error: "Missing Paystack signature" }, 401);
    }
    const { secretKey } = getPaystackKeys(c);
    if (!CryptoUtils.verifyWebhookSignature(rawBody, signature, secretKey)) {
      return c.json({ ok: false, error: "Invalid signature" }, 401);
    }

    const payload = JSON.parse(rawBody);
    if (payload.event !== "charge.success") {
      return c.json({ ok: true, ignored: true });
    }
    const reference = payload?.data?.reference as string | undefined;
    const metaType = payload?.data?.metadata?.payment_type;
    if (!reference || metaType !== "savings_deposit") {
      return c.json({ ok: true, ignored: true });
    }
    const completed = await completeSavingsDepositByReference(
      c,
      reference,
      payload?.data?.channel
    );
    return c.json({ ok: true, data: completed });
  } catch (error) {
    console.error("Savings webhook error:", error);
    return c.json({ ok: false }, 500);
  }
});
