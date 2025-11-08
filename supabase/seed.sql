-- Seed data for Puppet super user, default prompts, and demo agents

-- Ensure pgcrypto is available for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Constants
DO $$
DECLARE
  puppet_id CONSTANT UUID := '11111111-1111-4111-8111-111111111111';
  market_prompt_id CONSTANT UUID := '22222222-2222-4222-8222-222222222222';
  position_prompt_id CONSTANT UUID := '33333333-3333-4333-8333-333333333333';
BEGIN
  -- Create Puppet super user in auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_sent_at,
    last_sign_in_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  )
  VALUES (
    puppet_id,
    '00000000-0000-0000-0000-000000000000',
    'puppet@example.com',
    crypt('PuppetPass123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"],"super_user":true}'::jsonb,
    '{"full_name":"Puppet"}'::jsonb,
    'authenticated',
    'authenticated'
  )
  ON CONFLICT DO NOTHING;

  -- Ensure Puppet has a profile
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    auth_provider,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    puppet_id,
    'puppet@example.com',
    'Puppet',
    'email',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Disable existing global default prompts
  UPDATE public.prompts
  SET is_default = false
  WHERE user_id IS NULL;

  -- Upsert Puppet default Market Scan prompt
  INSERT INTO public.prompts (
    id,
    user_id,
    name,
    description,
    system_instruction,
    user_template,
    is_default,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    market_prompt_id,
    NULL,
    'Alpha Arena Market Scan',
    'Structured market scan prompt seeded for Puppet.',
    $$You are 'AlphaQuant', a risk-managed crypto strategist. Reason through macro, structure, and technical catalysts before proposing trades. Respond with a single valid JSON object that matches this schema exactly (double quotes, no prose, no code fences):
{
  "headline": {
    "short_summary": string,
    "extended_summary": markdown,
    "thesis": string,
    "sentiment_word": string,
    "sentiment_score": float
  },
  "overview": {
    "macro": markdown,
    "market_structure": markdown,
    "technical_analysis": markdown
  },
  "tradeActions": [{
    "asset": string,
    "action": "OPEN_LONG" | "OPEN_SHORT" | "CLOSE_LONG" | "CLOSE_SHORT" | "NO_ACTION",
    "leverage": int,
    "size": float,
    "entry": float,
    "stopLoss": float,
    "takeProfit": float,
    "confidenceScore": float,
    "reasoning": string
  }]
}
If no trade is warranted, include a single trade action with "action": "NO_ACTION".$$,
    $$It has been a continuous session and the current time is {{TIMESTAMP}}. Below is the consolidated market telemetry (ordered oldest → newest unless stated otherwise). Use it to surface high-conviction setups and protect capital.

CURRENT MARKET STATE SUMMARY
{{MARKET_PRICES}}

DETAILED MARKET SNAPSHOT
{{MARKET_DATA_JSON}}

CURRENT ACCOUNT SNAPSHOT & OPEN POSITIONS
{{OPEN_POSITIONS_JSON}}

Populate every JSON field. headline.short_summary should be one sentence, extended_summary and overview fields can include markdown bullets, and tradeActions must size entries within AVAILABLE_USDT and cite one-sentence reasoning grounded in the data. Return the JSON object only.$$,
    true,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    system_instruction = EXCLUDED.system_instruction,
    user_template = EXCLUDED.user_template,
    is_default = true,
    is_active = true,
    updated_at = NOW();

  -- Upsert Puppet default Position Review prompt
  INSERT INTO public.prompts (
    id,
    user_id,
    name,
    description,
    system_instruction,
    user_template,
    is_default,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    position_prompt_id,
    NULL,
    'Alpha Arena Position Review',
    'Structured position review prompt seeded for Puppet.',
    $$You are 'AlphaQuant', focused on disciplined position management. Respond with a single valid JSON object in this exact schema (double quotes, no code fences, all reasoning embedded inside the structure):
{
  "headline": {
    "short_summary": string,
    "extended_summary": markdown,
    "thesis": string,
    "sentiment_word": string,
    "sentiment_score": float
  },
  "overview": {
    "macro": markdown,
    "market_structure": markdown,
    "technical_analysis": markdown
  },
  "tradeActions": [{
    "asset": string,
    "action": "OPEN_LONG" | "OPEN_SHORT" | "CLOSE_LONG" | "CLOSE_SHORT" | "NO_ACTION",
    "leverage": int,
    "size": float,
    "entry": float,
    "stopLoss": float,
    "takeProfit": float,
    "confidenceScore": float,
    "reasoning": string
  }]
}
When a position only needs monitoring, return a single trade action with "action": "NO_ACTION".$$,
    $$Position management cycle at {{TIMESTAMP}}. Evaluate every open position using the structured telemetry below. Validate that each trade still honors its thesis, risk limits, and invalidation triggers before proposing any change.

MARKET CONTEXT
{{MARKET_PRICES}}

RAW MARKET + SIGNAL FEED
{{MARKET_DATA_JSON}}

CURRENT LIVE POSITIONS
{{OPEN_POSITIONS_JSON}}

Fill every JSON field with updated context. overview.market_structure should cover position-specific criteria, overview.technical_analysis should reference current price action, and each tradeActions item must cite a one-sentence reasoning plus updated stops/targets if applicable. Return only the JSON object.$$,
    true,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    system_instruction = EXCLUDED.system_instruction,
    user_template = EXCLUDED.user_template,
    is_default = true,
    is_active = true,
    updated_at = NOW();

  -- Seed three demo agents for Puppet
  INSERT INTO public.agents (
    id,
    user_id,
    name,
    llm_provider,
    model_name,
    hyperliquid_address,
    initial_capital,
    is_active,
    prompt_id,
    created_at
  )
  VALUES
    (
      '44444444-4444-4444-8444-444444444444',
      puppet_id,
      'Puppet Claude Scout',
      'anthropic',
      'claude-3-sonnet',
      '0xpuppetclaudescout',
      25000,
      true,
      market_prompt_id,
      NOW()
    ),
    (
      '55555555-5555-4555-8555-555555555555',
      puppet_id,
      'Puppet OpenAI Ranger',
      'openai',
      'gpt-4o',
      '0xpuppetopenairanger',
      25000,
      true,
      position_prompt_id,
      NOW()
    ),
    (
      '66666666-6666-4666-8666-666666666666',
      puppet_id,
      'Puppet Google Sentinel',
      'google',
      'gemini-2.0-flash-exp',
      '0xpuppetgooglesentinel',
      25000,
      true,
      market_prompt_id,
      NOW()
    )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    llm_provider = EXCLUDED.llm_provider,
    model_name = EXCLUDED.model_name,
    hyperliquid_address = EXCLUDED.hyperliquid_address,
    initial_capital = EXCLUDED.initial_capital,
    is_active = EXCLUDED.is_active,
    prompt_id = EXCLUDED.prompt_id;
END
$$;
