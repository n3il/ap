-- Remove legacy prompt_type column and related indexes
DROP INDEX IF EXISTS idx_prompts_prompt_type;
DROP INDEX IF EXISTS idx_prompts_user_type;

DO $$
BEGIN
  -- Only attempt to alter the table if it exists (older environments may not have prompts yet)
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'prompts'
  ) THEN
    ALTER TABLE public.prompts
      DROP CONSTRAINT IF EXISTS prompts_prompt_type_check;

    ALTER TABLE public.prompts
      DROP COLUMN IF EXISTS prompt_type;
  END IF;
END
$$;
