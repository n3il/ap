-- Add parsed_llm_response column to assessments for structured LLM outputs
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS parsed_llm_response JSONB;

COMMENT ON COLUMN public.assessments.parsed_llm_response IS
  'Structured LLM output (headline, overview, tradeActions) stored as JSON.';
