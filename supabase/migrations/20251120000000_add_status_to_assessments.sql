-- Add a status column so we can track assessment execution state
ALTER TABLE public.assessments
  ADD COLUMN status text;

-- Existing assessments are already completed
UPDATE public.assessments
SET status = 'completed'
WHERE status IS NULL;

ALTER TABLE public.assessments
  ALTER COLUMN status SET DEFAULT 'in_progress',
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.assessments
  ADD CONSTRAINT assessments_status_check
  CHECK (status IN ('in_progress', 'completed', 'errored'));

COMMENT ON COLUMN public.assessments.status IS
  'Tracks assessment execution status (in_progress, completed, errored).';
