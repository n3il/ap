-- Remove legacy prompt_type column and related indexes
DROP INDEX IF EXISTS idx_prompts_prompt_type;
DROP INDEX IF EXISTS idx_prompts_user_type;

ALTER TABLE public.prompts
  DROP CONSTRAINT IF EXISTS prompts_prompt_type_check;

ALTER TABLE public.prompts
  DROP COLUMN IF EXISTS prompt_type;
