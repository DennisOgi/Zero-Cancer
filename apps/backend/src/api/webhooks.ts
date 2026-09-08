import { Hono } from "hono";
import { settleAgentCashoutFromFlutterwave } from "../lib/agent.service";
import { verifyFlutterwaveWebhook } from "../lib/flutterwave";
import { settleStaffCashoutFromFlutterwave } from "../lib/staff-wallet.service";
import { getSupabaseClient } from "../lib/supabase";
import { THonoApp } from "../lib/types";

export const webhooksApp = new Hono<THonoApp>();

webhooksApp.post("/flutterwave", async (c) => {
  const signature =
    c.req.header("verif-hash") || c.req.header("Verif-Hash") || undefined;
  if (!verifyFlutterwaveWebhook(c, signature)) {
    return c.json({ ok: false, error: "Invalid Flutterwave signature" }, 401);
  }

  const body = await c.req.json().catch(() => ({}));
  const data = body?.data || body || {};
  const payload = {
    reference: String(data?.reference || body?.reference || ""),
    status: String(data?.status || body?.status || ""),
    id: data?.id ?? body?.id,
  };

  const supabase = getSupabaseClient(c);
  await settleAgentCashoutFromFlutterwave(c, payload);
  await settleStaffCashoutFromFlutterwave(supabase, payload);

  return c.json({ ok: true });
});
