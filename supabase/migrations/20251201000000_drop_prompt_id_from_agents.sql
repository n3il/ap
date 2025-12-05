-- Drop prompt_id column from agents
ALTER TABLE public.agents
  DROP CONSTRAINT IF EXISTS agents_prompt_id_fkey;

DROP TRIGGER IF EXISTS validate_agent_prompts ON public.agents;
DROP FUNCTION IF EXISTS public.validate_agent_prompt_references();
DROP INDEX IF EXISTS idx_agents_prompt;

ALTER TABLE public.agents
  DROP COLUMN IF EXISTS prompt_id;
