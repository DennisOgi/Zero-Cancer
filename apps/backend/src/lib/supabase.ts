// Supabase client for Cloudflare Workers
import { createClient } from '@supabase/supabase-js';
import type { Context } from 'hono';
import { env } from 'hono/adapter';
import type { TEnvs } from './types';

export const getSupabaseClient = (c: Context) => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } =
    env<TEnvs>(c);
  const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  
  return createClient(SUPABASE_URL, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

export type SupabaseClient = ReturnType<typeof getSupabaseClient>;
