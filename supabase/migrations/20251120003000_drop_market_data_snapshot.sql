-- Drop obsolete market_data_snapshot column which is no longer populated
ALTER TABLE public.assessments
  DROP COLUMN IF EXISTS market_data_snapshot;
