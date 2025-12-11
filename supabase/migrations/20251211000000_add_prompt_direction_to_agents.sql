-- Add prompt_direction column to agents table
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS prompt_direction TEXT;

COMMENT ON COLUMN public.agents.prompt_direction IS 'Custom prompt directions or instructions for the agent to guide its behavior and decision-making.';
