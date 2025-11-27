-- Migration: Remove legacy trades table and related artifacts
-- This ensures environments that still have the old Alpha Arena table drop it cleanly

BEGIN;

-- Drop any lingering policies explicitly in case they were not removed earlier
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'trades'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.trades;', policy_record.policyname);
  END LOOP;
END;
$$;

-- Drop the table itself (cascade ensures dependent indexes or constraints are removed)
DROP TABLE IF EXISTS public.trades CASCADE;

COMMIT;
