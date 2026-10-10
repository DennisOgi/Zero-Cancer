import { Hono } from "hono";
import { settleAgentCashoutFromFlutterwave } from "../lib/agent.service";
import { getDB } from "../lib/db";
import {
  verifyFlutterwavePayment,
  verifyFlutterwaveWebhook,
} from "../lib/flutterwave";
import { processSuccessfulCharge } from "../lib/paystack-payment";
import { settleStaffCashoutFromFlutterwave } from "../lib/staff-wallet.service";
import { getSupabaseClient } from "../lib/supabase";
import { THonoApp } from "../lib/types";
import { settleCenterCashoutFromFlutterwave } from "../lib/wallet.service";

export const webhooksApp = new Hono<THonoApp>();

webhooksApp.post("/flutterwave", async (c) => {
  const signature =
    c.req.header("verif-hash") || c.req.header("Verif-Hash") || undefined;
  if (!verifyFlutterwaveWebhook(c, signature)) {
    return c.json({ ok: false, error: "Invalid Flutterwave signature" }, 401);
  }

  const body = await c.req.json().catch(() => ({}));
  const event = String(body?.event || "").toLowerCase();
  const data = body?.data || body || {};
  const payload = {
    reference: String(data?.tx_ref || data?.reference || body?.tx_ref || body?.reference || ""),
    status: String(data?.status || body?.status || ""),
    id: data?.id ?? body?.id,
  };

  const looksLikeCheckout = /^(donation-|campaign-|book-appointment-|sav_)/.test(
    payload.reference
  );
  if (event.startsWith("charge.") || looksLikeCheckout) {
    const isCharge =
      event.startsWith("charge.") ||
      String(data?.status || "").toLowerCase() === "successful";
    if (isCharge && payload.reference) {
      try {
        const verified = await verifyFlutterwavePayment(
          c,
          payload.reference,
          payload.id
        );
        if (verified.status === "success") {
          await processSuccessfulCharge(c, {
            reference: verified.reference,
            amountNaira: verified.amountNaira,
            metadata: verified.metadata,
          });
        }
      } catch (error) {
        console.error("[FLUTTERWAVE] Charge verification failed:", error);
      }
    }
  }

  const supabase = getSupabaseClient(c);
  await settleAgentCashoutFromFlutterwave(c, payload);
  await settleStaffCashoutFromFlutterwave(supabase, payload);
  await settleCenterCashoutFromFlutterwave(c, payload);

  if (payload.reference) {
    const status = payload.status.toLowerCase();
    if (status === "successful" || status === "success") {
      await getDB(c).payout.updateMany({
        where: { transferReference: payload.reference },
        data: { status: "SUCCESS", completedAt: new Date() },
      });
    } else if (status === "failed" || status === "failure") {
      await getDB(c).payout.updateMany({
        where: { transferReference: payload.reference },
        data: {
          status: "FAILED",
          failureReason: "Flutterwave transfer failed",
        },
      });
    }
  }

  return c.json({ ok: true });
});
