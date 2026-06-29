import type { Context } from "hono";
import { env } from "hono/adapter";
import type { TEnvs } from "./types";

export type PaystackKeys = {
  secretKey: string;
  publicKey: string;
  envMode: TEnvs["ENV_MODE"];
};

export function getPaystackKeys(c: Context): PaystackKeys {
  const { PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY, ENV_MODE } = env<TEnvs>(c);

  if (!PAYSTACK_SECRET_KEY?.trim()) {
    throw new Error(
      "Paystack is not configured. Set PAYSTACK_SECRET_KEY on the worker."
    );
  }

  if (ENV_MODE === "production" && PAYSTACK_SECRET_KEY.startsWith("sk_test_")) {
    throw new Error(
      "Test Paystack secret key cannot be used when ENV_MODE is production."
    );
  }

  return {
    secretKey: PAYSTACK_SECRET_KEY.trim(),
    publicKey: PAYSTACK_PUBLIC_KEY?.trim() || "",
    envMode: ENV_MODE,
  };
}

export function isPaystackConfigured(c: Context): boolean {
  try {
    getPaystackKeys(c);
    return true;
  } catch {
    return false;
  }
}
