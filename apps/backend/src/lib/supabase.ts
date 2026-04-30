// Supabase client for Cloudflare Workers
import { createClient } from '@supabase/supabase-js';
import type { Context } from 'hono';
import { env } from 'hono/adapter';
import type { TEnvs } from './types';

export const getSupabaseClient = (c: Context) => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = env<TEnvs>(c);
  
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

export type SupabaseClient = ReturnType<typeof getSupabaseClient>;
