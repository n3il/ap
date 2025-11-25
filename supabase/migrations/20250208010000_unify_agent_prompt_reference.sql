-- Unify agent prompt references into a single prompt_id column
DO $do$
BEGIN
  -- Skip if prompts table doesn't exist yet (older migrations create it later)
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'prompts'
  ) THEN
    ALTER TABLE public.agents
      ADD COLUMN IF NOT EXISTS prompt_id UUID REFERENCES public.prompts(id) ON DELETE SET NULL;

    UPDATE public.agents
    SET prompt_id = COALESCE(prompt_id, market_prompt_id, position_prompt_id)
    WHERE prompt_id IS NULL
      AND (market_prompt_id IS NOT NULL OR position_prompt_id IS NOT NULL);

    DROP INDEX IF EXISTS idx_agents_market_prompt;
    DROP INDEX IF EXISTS idx_agents_position_prompt;

    ALTER TABLE public.agents
      DROP COLUMN IF EXISTS market_prompt_id,
      DROP COLUMN IF EXISTS position_prompt_id;

    CREATE INDEX IF NOT EXISTS idx_agents_prompt ON public.agents(prompt_id);

    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.validate_agent_prompt_references()
      RETURNS TRIGGER AS $body$
      BEGIN
        IF NEW.prompt_id IS NOT NULL THEN
          IF NOT EXISTS (
            SELECT 1
            FROM public.prompts p
            WHERE p.id = NEW.prompt_id
              AND (p.user_id IS NULL OR p.user_id = NEW.user_id)
              AND p.is_active = true
          ) THEN
            RAISE EXCEPTION 'Invalid prompt reference for agent %', NEW.id;
          END IF;
        END IF;

        RETURN NEW;
      END;
      $body$ LANGUAGE plpgsql;
    $fn$;
  END IF;
END
$do$;
