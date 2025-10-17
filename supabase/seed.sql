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
  WHERE user_id IS NULL
    AND prompt_type IN ('MARKET_SCAN', 'POSITION_REVIEW');

  -- Upsert Puppet default Market Scan prompt
  INSERT INTO public.prompts (
    id,
    user_id,
    name,
    description,
    prompt_type,
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
    'MARKET_SCAN',
    $$You are 'AlphaQuant', a risk-managed crypto strategist. You must reason carefully through every signal, cite supporting evidence, and conclude with ACTION_JSON that aligns with the trading plan and risk limits.$$,
    $$It has been a continuous session and the current time is {{TIMESTAMP}}. Below is the consolidated market telemetry (ordered oldest → newest unless stated otherwise). Use it to surface high-conviction setups and protect capital.

CURRENT MARKET STATE SUMMARY
{{MARKET_PRICES}}

DETAILED MARKET SNAPSHOT
{{MARKET_DATA_JSON}}

CURRENT ACCOUNT SNAPSHOT & OPEN POSITIONS
{{OPEN_POSITIONS_JSON}}

Respond with your full reasoning followed by ACTION_JSON describing the precise action, asset, size, and reasoning. If no trade is warranted, return ACTION_JSON with NO_ACTION.$$,
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
    prompt_type,
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
    'POSITION_REVIEW',
    $$You are 'AlphaQuant', focused on disciplined position management. Audit every live trade against its thesis, reference current signals, and conclude with ACTION_JSON reflecting any adjustments or NO_ACTION.$$,
    $$Position management cycle at {{TIMESTAMP}}. Evaluate every open position using the structured telemetry below. Validate that each trade still honors its thesis, risk limits, and invalidation triggers before proposing any change.

MARKET CONTEXT
{{MARKET_PRICES}}

RAW MARKET + SIGNAL FEED
{{MARKET_DATA_JSON}}

CURRENT LIVE POSITIONS
{{OPEN_POSITIONS_JSON}}

Provide thorough reasoning, then emit ACTION_JSON to CLOSE, REDUCE, ADJUST, or NO_ACTION for each relevant position.$$,
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
    market_prompt_id,
    position_prompt_id,
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
      position_prompt_id,
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
      market_prompt_id,
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
      position_prompt_id,
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
    market_prompt_id = EXCLUDED.market_prompt_id,
    position_prompt_id = EXCLUDED.position_prompt_id;
END
$$;
