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
  const expected = FLUTTERWAVE_WEBHOOK_HASH?.trim();
  if (!expected || !signature) return false;
  return signature === expected;
}

export function getFlutterwaveKeys(c: Context) {
  const secretKey = getFlutterwaveSecret(c);
  const { FLUTTERWAVE_PUBLIC_KEY, ENV_MODE } = env<TEnvs>(c);
  if (ENV_MODE === "production" && /_TEST/i.test(secretKey)) {
    throw new Error(
      "Test Flutterwave secret key cannot be used when ENV_MODE is production."
    );
  }
  return {
    secretKey,
    publicKey: FLUTTERWAVE_PUBLIC_KEY?.trim() || "",
    envMode: ENV_MODE,
  };
}

export type FlutterwavePaymentType =
  | "anonymous_donation"
  | "campaign_creation"
  | "campaign_funding"
  | "appointment_booking"
  | "savings_deposit";

export type FlutterwaveCheckoutStatus =
  | "success"
  | "failed"
  | "abandoned"
  | "pending";

export function mapFlutterwaveCheckoutStatus(
  status?: string | null
): FlutterwaveCheckoutStatus {
  const value = String(status || "").toLowerCase();
  if (value === "successful" || value === "success") return "success";
  if (value === "failed" || value === "failure") return "failed";
  if (value === "cancelled" || value === "canceled") return "abandoned";
  return "pending";
}

function checkoutCallbackUrl(
  c: Context,
  data: {
    reference: string;
    paymentType: FlutterwavePaymentType;
    campaignId?: string;
    patientId?: string;
  }
) {
  const { FRONTEND_URL } = env<{ FRONTEND_URL: string }>(c);
  switch (data.paymentType) {
    case "anonymous_donation":
      return `${FRONTEND_URL}/donation/payment-status?ref=${data.reference}&type=anonymous`;
    case "campaign_creation":
      if (!data.campaignId) {
        throw new Error("Campaign ID required for campaign creation");
      }
      return `${FRONTEND_URL}/donor/campaigns/payment-status?ref=${data.reference}&type=create&campaignId=${data.campaignId}`;
    case "campaign_funding":
      if (!data.campaignId) {
        throw new Error("Campaign ID required for campaign funding");
      }
      return `${FRONTEND_URL}/donor/campaigns/${data.campaignId}/payment-status?ref=${data.reference}&type=fund`;
    case "appointment_booking":
      if (!data.patientId) {
        throw new Error("Patient ID required for appointment payment");
      }
      return `${FRONTEND_URL}/patient/book/payment-status?ref=${data.reference}&type=book&patientId=${data.patientId}`;
    case "savings_deposit":
      return `${FRONTEND_URL}/patient/savings/payment-status?ref=${data.reference}`;
    default:
      throw new Error(`Unknown payment type: ${data.paymentType}`);
  }
}

const checkoutTitles: Record<FlutterwavePaymentType, string> = {
  anonymous_donation: "ZeroCancer donation",
  campaign_creation: "ZeroCancer campaign",
  campaign_funding: "ZeroCancer campaign funding",
  appointment_booking: "ZeroCancer screening booking",
  savings_deposit: "ZeroCancer savings deposit",
};

export async function initializeFlutterwavePayment(
  c: Context,
  data: {
    email: string;
    amount: number; // Naira
    reference: string;
    paymentType: FlutterwavePaymentType;
    campaignId?: string;
    patientId?: string;
    customerName?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const secret = getFlutterwaveSecret(c);
  const redirectUrl = checkoutCallbackUrl(c, data);
  const res = await fetch(`${FLUTTERWAVE_API}/payments`, {
    method: "POST",
    headers: headers(secret),
    body: JSON.stringify({
      tx_ref: data.reference,
      amount: data.amount,
      currency: "NGN",
      redirect_url: redirectUrl,
      payment_options: "card,banktransfer,ussd",
      customer: {
        email: data.email,
        name: data.customerName || data.email,
      },
      customizations: {
        title: "ZeroCancer",
        description: checkoutTitles[data.paymentType],
      },
      meta: {
        ...(data.metadata || {}),
        payment_type: data.paymentType,
        campaign_id: data.campaignId || null,
      },
    }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    status?: string;
    message?: string;
    data?: { link?: string };
  };
  if (!res.ok || body?.status !== "success" || !body?.data?.link) {
    throw new Error(
      body?.message || `Failed to initialize Flutterwave payment (${res.status})`
    );
  }
  return {
    authorization_url: body.data.link,
    access_code: "",
    reference: data.reference,
  };
}

export function flattenFlutterwaveMeta(meta: unknown): Record<string, any> {
  if (!meta) return {};
  if (typeof meta === "string") {
    try {
      return flattenFlutterwaveMeta(JSON.parse(meta));
    } catch {
      return {};
    }
  }
  if (typeof meta !== "object") return {};
  const source = meta as Record<string, any>;
  const nested = source.meta && typeof source.meta === "object" ? source.meta : {};
  return { ...nested, ...source };
}

export async function verifyFlutterwavePayment(
  c: Context,
  reference: string,
  transactionId?: string | number
) {
  const secret = getFlutterwaveSecret(c);
  const url = transactionId
    ? `${FLUTTERWAVE_API}/transactions/${encodeURIComponent(String(transactionId))}/verify`
    : `${FLUTTERWAVE_API}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`;
  const res = await fetch(url, { headers: headers(secret) });
  const body = (await res.json().catch(() => ({}))) as {
    status?: string;
    message?: string;
    data?: Record<string, any>;
  };
  if (!res.ok || !body?.data) {
    throw new Error(body?.message || "Failed to verify payment with Flutterwave");
  }
  const payment = body.data;
  return {
    reference: String(payment.tx_ref || reference),
    amountNaira: Number(payment.amount || 0),
    status: mapFlutterwaveCheckoutStatus(payment.status),
    rawStatus: String(payment.status || ""),
    paidAt: payment.created_at || null,
    channel: String(payment.payment_type || payment.auth_model || "flutterwave"),
    currency: String(payment.currency || "NGN"),
    transactionDate: String(payment.created_at || new Date().toISOString()),
    metadata: flattenFlutterwaveMeta(payment.meta || payment.meta_data),
    transactionId: payment.id != null ? String(payment.id) : undefined,
  };
}

export async function listFlutterwaveBanks(c: Context) {
  const secret = getFlutterwaveSecret(c);
  const res = await fetch(`${FLUTTERWAVE_API}/banks/NG`, {
    headers: headers(secret),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.status !== "success") {
    throw new Error(body?.message || "Could not load Nigerian banks from Flutterwave");
  }
  return (body?.data || []).map((bank: any) => ({
    id: bank.id,
    name: String(bank.name || ""),
    code: String(bank.code || ""),
  }));
}

export async function resolveFlutterwaveBankCode(
  c: Context,
  bankName?: string | null
) {
  if (!bankName?.trim()) return null;
  const banks = await listFlutterwaveBanks(c);
  const wanted = bankName.trim().toLowerCase();
  return (
    banks.find((bank) => bank.name.toLowerCase() === wanted)?.code ||
    banks.find((bank) => bank.name.toLowerCase().includes(wanted))?.code ||
    null
  );
}
