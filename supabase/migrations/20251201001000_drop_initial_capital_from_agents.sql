-- Drop initial_capital column from agents
ALTER TABLE public.agents
  DROP COLUMN IF EXISTS initial_capital;
