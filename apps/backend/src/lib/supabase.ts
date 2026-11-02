// Supabase client for Cloudflare Workers
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Context } from "hono";
import { env } from "hono/adapter";
import type { TEnvs } from "./types";

function backendGateToken(secret?: string) {
  if (!secret) return "";
  return createHash("sha256").update(secret).digest("hex");
}

export const getSupabaseClient = (c: Context) => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, JWT_TOKEN_SECRET } =
    env<TEnvs>(c);

  if (!SUPABASE_URL) {
    throw new Error("Supabase configuration missing");
  }

  if (SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  if (!SUPABASE_ANON_KEY) {
    throw new Error("Supabase configuration missing");
  }

  // The anon key + gate header is a local-development fallback only; production
  // must use the service role key so it never depends on the gate table.
  if (env<TEnvs>(c).ENV_MODE === "production") {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY must be set in production");
  }

  const gate = backendGateToken(JWT_TOKEN_SECRET);
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: gate ? { "x-zerocancer-backend": gate } : {},
    },
  });
};

export type SupabaseClient = ReturnType<typeof getSupabaseClient>;
