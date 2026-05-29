// Supabase client for Cloudflare Workers
import { createClient } from '@supabase/supabase-js';
import type { Context } from 'hono';
import { env } from 'hono/adapter';
import type { TEnvs } from './types';

export const getSupabaseClient = (c: Context) => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } =
    env<TEnvs>(c);
  const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !supabaseKey) {
    console.error("Supabase configuration missing", {
      hasUrl: Boolean(SUPABASE_URL),
      hasAnonKey: Boolean(SUPABASE_ANON_KEY),
      hasServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
    });
    throw new Error("Supabase configuration missing");
  }
  
  return createClient(SUPABASE_URL, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

export type SupabaseClient = ReturnType<typeof getSupabaseClient>;
