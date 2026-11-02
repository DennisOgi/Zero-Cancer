-- Lock down the public schema so the published anon key cannot read or write data.
-- The Worker uses the Supabase secret (service role) key, which bypasses RLS.
-- The anon key keeps working only for requests that carry the backend gate
-- header (see public.is_zerocancer_backend / scripts/seed-backend-gate.mjs).

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND c.relname <> '_backend_gate'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.relname);

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t.relname
    ) THEN
      EXECUTE format(
        'CREATE POLICY backend_access ON public.%I FOR ALL TO anon, authenticated '
        'USING (public.is_zerocancer_backend()) WITH CHECK (public.is_zerocancer_backend())',
        t.relname
      );
    END IF;
  END LOOP;
END $$;

ALTER TABLE public._backend_gate ENABLE ROW LEVEL SECURITY;

-- Wallet RPCs must only be callable by the backend.
REVOKE EXECUTE ON FUNCTION public.credit_platform_wallet FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.credit_center_wallet FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.debit_center_wallet FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_payment_split FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_center_wallet_trigger FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_platform_wallet TO service_role;
GRANT EXECUTE ON FUNCTION public.credit_center_wallet TO service_role;
GRANT EXECUTE ON FUNCTION public.debit_center_wallet TO service_role;
GRANT EXECUTE ON FUNCTION public.process_payment_split TO service_role;
GRANT EXECUTE ON FUNCTION public.create_center_wallet_trigger TO service_role;

-- New tables and functions must not be exposed to anon by default.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
