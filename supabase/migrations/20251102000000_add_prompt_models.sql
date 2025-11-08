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
  system_instruction TEXT NOT NULL,
  user_template TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON public.prompts(user_id);

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
  system_instruction,
  user_template,
  is_default
)
SELECT
  NULL,
  'Default Market Scan',
  'System default market scan prompt for AlphaQuant agents',
  'You are ''AlphaQuant'', a highly risk-averse, world-class quantitative crypto analyst. Provide disciplined reasoning rooted in macro data, market structure, and technical signals. Respond with a single valid JSON object that matches this schema exactly (double quotes, no prose, no code fences):\n{\n  "headline": {\n    "short_summary": string,\n    "extended_summary": markdown,\n    "thesis": string,\n    "sentiment_word": string,\n    "sentiment_score": float\n  },\n  "overview": {\n    "macro": markdown,\n    "market_structure": markdown,\n    "technical_analysis": markdown\n  },\n  "tradeActions": [{\n    "asset": string,\n    "action": "OPEN_LONG" | "OPEN_SHORT" | "CLOSE_LONG" | "CLOSE_SHORT" | "NO_ACTION",\n    "leverage": int,\n    "size": float,\n    "entry": float,\n    "stopLoss": float,\n    "takeProfit": float,\n    "confidenceScore": float,\n    "reasoning": string\n  }]\n}\nIf no trade is warranted, return a single trade action object where "action" is "NO_ACTION".',
  'Current Market State: {{MARKET_PRICES}}.\n\nOpen Positions: {{OPEN_POSITIONS}}.\n\nUse the telemetry plus relevant macro context to populate every JSON field. headline.short_summary must be one sentence, extended_summary and overview fields can include markdown bullets, and tradeActions must size entries within AVAILABLE_USDT while citing one-sentence reasoning tied to the provided data. Return only the JSON object.',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.prompts
  WHERE user_id IS NULL
);

INSERT INTO public.prompts (
  user_id,
  name,
  description,
  system_instruction,
  user_template,
  is_default
)
SELECT
  NULL,
  'Default Position Review',
  'System default position review prompt for AlphaQuant agents',
  'You are ''AlphaQuant'', a highly risk-averse, world-class quantitative crypto analyst. Your primary objective is disciplined position management. Respond with a single valid JSON object that follows this schema exactly (double quotes, no prose, no code fences):\n{\n  "headline": {\n    "short_summary": string,\n    "extended_summary": markdown,\n    "thesis": string,\n    "sentiment_word": string,\n    "sentiment_score": float\n  },\n  "overview": {\n    "macro": markdown,\n    "market_structure": markdown,\n    "technical_analysis": markdown\n  },\n  "tradeActions": [{\n    "asset": string,\n    "action": "OPEN_LONG" | "OPEN_SHORT" | "CLOSE_LONG" | "CLOSE_SHORT" | "NO_ACTION",\n    "leverage": int,\n    "size": float,\n    "entry": float,\n    "stopLoss": float,\n    "takeProfit": float,\n    "confidenceScore": float,\n    "reasoning": string\n  }]\n}\nWhen a position only needs monitoring, return a single trade action object where "action" is "NO_ACTION".',
  'Current Market State: {{MARKET_PRICES}}.\n\nOpen Positions: {{OPEN_POSITIONS}}.\n\nProvide a thesis-led assessment for each live trade. overview.market_structure should tie back to individual positions, overview.technical_analysis must cite price action or levels, and tradeActions must include updated stops/targets plus reasoning. Return only the JSON object.',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.prompts
  WHERE user_id IS NULL
);

-- Attach prompt references to agents
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS prompt_id UUID REFERENCES public.prompts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agents_prompt ON public.agents(prompt_id);

-- Record prompt used for each assessment
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS prompt_id UUID REFERENCES public.prompts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assessments_prompt_id ON public.assessments(prompt_id);

-- Ensure agents can only reference prompts they own or global prompts
CREATE OR REPLACE FUNCTION public.validate_agent_prompt_references()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.prompt_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.prompts p
      WHERE p.id = NEW.prompt_id
        AND (p.user_id IS NULL OR p.user_id = NEW.user_id)
        AND p.is_active = true
    ) THEN
      RAISE EXCEPTION 'Invalid prompt reference for agent %', NEW.id;
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
