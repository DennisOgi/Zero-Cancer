import type { Context } from "hono";
import { env } from "hono/adapter";
import type { TEnvs } from "./types";

const FLUTTERWAVE_API = "https://api.flutterwave.com/v3";

export function getFlutterwaveSecret(c: Context): string {
  const { FLUTTERWAVE_SECRET_KEY } = env<TEnvs>(c);
  if (!FLUTTERWAVE_SECRET_KEY?.trim()) {
    throw new Error(
      "Flutterwave is not configured. Set FLUTTERWAVE_SECRET_KEY on the worker."
    );
  }
  return FLUTTERWAVE_SECRET_KEY.trim();
}

export function isFlutterwaveConfigured(c: Context): boolean {
  const { FLUTTERWAVE_SECRET_KEY } = env<TEnvs>(c);
  return Boolean(FLUTTERWAVE_SECRET_KEY?.trim());
}

function headers(secret: string) {
  return {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  };
}

export async function resolveFlutterwaveAccount(
  c: Context,
  payload: { accountNumber: string; bankCode: string }
) {
  const secret = getFlutterwaveSecret(c);
  const res = await fetch(`${FLUTTERWAVE_API}/accounts/resolve`, {
    method: "POST",
    headers: headers(secret),
    body: JSON.stringify({
      account_number: payload.accountNumber,
      account_bank: payload.bankCode,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.status !== "success") {
    throw new Error(
      body?.message || "Could not verify the Nigerian bank account with Flutterwave"
    );
  }
  return {
    accountName: String(body?.data?.account_name || "").trim(),
    accountNumber: String(body?.data?.account_number || payload.accountNumber),
  };
}

export function flutterwaveWebhookUrl(c: Context) {
  try {
    return `${new URL(c.req.url).origin}/api/v1/webhooks/flutterwave`;
  } catch {
    return undefined;
  }
}

export async function initiateFlutterwaveTransfer(
  c: Context,
  payload: {
    accountNumber: string;
    bankCode: string;
    amountNgn: number;
    reference: string;
    narration: string;
    callbackUrl?: string;
  }
) {
  const secret = getFlutterwaveSecret(c);
  const callbackUrl = payload.callbackUrl || flutterwaveWebhookUrl(c);
  const res = await fetch(`${FLUTTERWAVE_API}/transfers`, {
    method: "POST",
    headers: headers(secret),
    body: JSON.stringify({
      account_bank: payload.bankCode,
      account_number: payload.accountNumber,
      amount: Math.round(payload.amountNgn),
      narration: payload.narration,
      currency: "NGN",
      reference: payload.reference,
      ...(callbackUrl ? { callback_url: callbackUrl } : {}),
      debit_currency: "NGN",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.status !== "success") {
    throw new Error(body?.message || "Flutterwave transfer failed");
  }
  return {
    transferId: body?.data?.id != null ? String(body.data.id) : null,
    reference: String(body?.data?.reference || payload.reference),
    status: String(body?.data?.status || "NEW"),
  };
}

export function verifyFlutterwaveWebhook(c: Context, signature: string | undefined) {
  const { FLUTTERWAVE_WEBHOOK_HASH } = env<TEnvs>(c);
  if (!FLUTTERWAVE_WEBHOOK_HASH?.trim()) return true;
  return signature === FLUTTERWAVE_WEBHOOK_HASH.trim();
}
