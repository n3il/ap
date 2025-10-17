-- Prompts data model to support user-defined LLM templates

-- Ensure updated_at helper exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Prompt templates table
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('MARKET_SCAN', 'POSITION_REVIEW')),
  system_instruction TEXT NOT NULL,
  user_template TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_prompt_type ON public.prompts(prompt_type);
CREATE INDEX IF NOT EXISTS idx_prompts_user_type ON public.prompts(user_id, prompt_type);

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read global prompts and their own prompts
CREATE POLICY "Prompts are readable by owner or global"
  ON public.prompts FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

-- Allow users to insert prompts for themselves only
CREATE POLICY "Users can insert their prompts"
  ON public.prompts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update prompts they own
CREATE POLICY "Users can update their prompts"
  ON public.prompts FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete prompts they own
CREATE POLICY "Users can delete their prompts"
  ON public.prompts FOR DELETE
  USING (auth.uid() = user_id);

-- Maintain updated_at timestamp
CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Default prompt templates (global scope)
INSERT INTO public.prompts (
  user_id,
  name,
  description,
  prompt_type,
  system_instruction,
  user_template,
  is_default
)
SELECT
  NULL,
  'Default Market Scan',
  'System default market scan prompt for AlphaQuant agents',
  'MARKET_SCAN',
  'You are ''AlphaQuant'', a highly risk-averse, world-class quantitative crypto analyst. Your goal is to identify high-probability trades with defined entry/exit points, leveraging real-time data and grounded web search analysis. You must always justify your trade using market structure, macroeconomic trends, or technical analysis. You must output your analysis first, followed by a mandatory ''ACTION_JSON'' block in this exact format:\n\nACTION_JSON: {"action": "OPEN_LONG_BTC" or "OPEN_SHORT_ETH" or "NO_ACTION", "asset": "BTC-PERP", "size": 0.1, "reasoning": "brief reason"}\n\nIf no trade is warranted, use: ACTION_JSON: {"action": "NO_ACTION"}',
  'Current Market State: {{MARKET_PRICES}}.\n\nOpen Positions: {{OPEN_POSITIONS}}.\n\nBased on this data and the most relevant news/macro trends from your web search, perform a comprehensive market assessment. If a trade is warranted, output an action using the ACTION_JSON format. If no trade is warranted, output ACTION_JSON with NO_ACTION.',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.prompts
  WHERE user_id IS NULL
    AND prompt_type = 'MARKET_SCAN'
);

INSERT INTO public.prompts (
  user_id,
  name,
  description,
  prompt_type,
  system_instruction,
  user_template,
  is_default
)
SELECT
  NULL,
  'Default Position Review',
  'System default position review prompt for AlphaQuant agents',
  'POSITION_REVIEW',
  'You are ''AlphaQuant'', a highly risk-averse, world-class quantitative crypto analyst. Your primary objective is position management. You must assess all current open trades against their original thesis, considering current price action and the latest market events obtained via web search. You must output your analysis first, followed by a mandatory ''ACTION_JSON'' block in this exact format:\n\nACTION_JSON: {"action": "CLOSE_BTC" or "HOLD" or "NO_ACTION", "asset": "BTC-PERP", "reasoning": "brief reason"}\n\nIf no change is needed, use: ACTION_JSON: {"action": "NO_ACTION"}',
  'Current Market State: {{MARKET_PRICES}}.\n\nOpen Positions: {{OPEN_POSITIONS}}.\n\nProvide a position management assessment for each open trade. Use ACTION_JSON to communicate your decision, or default to NO_ACTION when holding is preferred.',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.prompts
  WHERE user_id IS NULL
    AND prompt_type = 'POSITION_REVIEW'
);

-- Attach prompt references to agents
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS market_prompt_id UUID REFERENCES public.prompts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS position_prompt_id UUID REFERENCES public.prompts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agents_market_prompt ON public.agents(market_prompt_id);
CREATE INDEX IF NOT EXISTS idx_agents_position_prompt ON public.agents(position_prompt_id);

-- Record prompt used for each assessment
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS prompt_id UUID REFERENCES public.prompts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assessments_prompt_id ON public.assessments(prompt_id);

-- Ensure agents can only reference prompts they own or global prompts
CREATE OR REPLACE FUNCTION public.validate_agent_prompt_references()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.market_prompt_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.prompts p
      WHERE p.id = NEW.market_prompt_id
        AND (p.user_id IS NULL OR p.user_id = NEW.user_id)
        AND p.is_active = true
    ) THEN
      RAISE EXCEPTION 'Invalid market prompt reference for agent %', NEW.id;
    END IF;
  END IF;

  IF NEW.position_prompt_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.prompts p
      WHERE p.id = NEW.position_prompt_id
        AND (p.user_id IS NULL OR p.user_id = NEW.user_id)
        AND p.is_active = true
    ) THEN
      RAISE EXCEPTION 'Invalid position prompt reference for agent %', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_agent_prompts ON public.agents;

CREATE TRIGGER validate_agent_prompts
  BEFORE INSERT OR UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_agent_prompt_references();
