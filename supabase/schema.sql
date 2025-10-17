-- User Profiles Table
-- This table stores additional user profile information and onboarding status
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  phone_number TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,

  -- Authentication metadata
  auth_provider TEXT, -- 'email', 'phone', 'google', 'apple'
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,

  -- App settings
  notifications_enabled BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'light',

  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_data JSONB DEFAULT '{}'::jsonb, -- Store custom onboarding responses

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Users can only read and update their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to automatically create a user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  provider TEXT;
  user_email TEXT;
  user_phone TEXT;
BEGIN
  -- Determine auth provider
  IF NEW.phone IS NOT NULL THEN
    provider := 'phone';
    user_phone := NEW.phone;
  ELSIF NEW.raw_user_meta_data->>'provider' = 'google' THEN
    provider := 'google';
    user_email := NEW.email;
  ELSIF NEW.raw_user_meta_data->>'provider' = 'apple' THEN
    provider := 'apple';
    user_email := NEW.email;
  ELSE
    provider := 'email';
    user_email := NEW.email;
  END IF;

  -- Insert user profile with appropriate data
  INSERT INTO public.profiles (
    id,
    email,
    phone_number,
    display_name,
    avatar_url,
    auth_provider,
    email_verified,
    phone_verified
  )
  VALUES (
    NEW.id,
    COALESCE(user_email, NEW.email),
    user_phone,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email,
      NEW.phone
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    provider,
    CASE WHEN provider IN ('google', 'apple') THEN true ELSE NEW.email_confirmed_at IS NOT NULL END,
    CASE WHEN provider = 'phone' THEN NEW.phone_confirmed_at IS NOT NULL ELSE false END
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profile changes
CREATE OR REPLACE TRIGGER on_user_profile_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_provider ON profiles(auth_provider);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed);

-- View to easily get complete user information
CREATE OR REPLACE VIEW user_info AS
SELECT
  up.id,
  up.email,
  up.phone_number,
  up.display_name,
  up.avatar_url,
  up.bio,
  up.auth_provider,
  up.email_verified,
  up.phone_verified,
  up.notifications_enabled,
  up.theme,
  up.onboarding_completed,
  up.onboarding_data,
  up.created_at,
  up.updated_at,
  au.last_sign_in_at,
  au.confirmed_at
FROM profiles up
LEFT JOIN auth.users au ON up.id = au.id;

-- Prompt Templates Table
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prompts are readable by owner or global"
  ON prompts FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert their prompts"
  ON prompts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their prompts"
  ON prompts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their prompts"
  ON prompts FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_prompt_type ON prompts(prompt_type);
CREATE INDEX IF NOT EXISTS idx_prompts_user_type ON prompts(user_id, prompt_type);

CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS market_prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS position_prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agents_market_prompt ON agents(market_prompt_id);
CREATE INDEX IF NOT EXISTS idx_agents_position_prompt ON agents(position_prompt_id);

ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assessments_prompt_id ON assessments(prompt_id);

CREATE OR REPLACE FUNCTION public.validate_agent_prompt_references()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.market_prompt_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM prompts p
      WHERE p.id = NEW.market_prompt_id
        AND (p.user_id IS NULL OR p.user_id = NEW.user_id)
        AND p.is_active = true
    ) THEN
      RAISE EXCEPTION 'Invalid market prompt reference for agent %', NEW.id;
    END IF;
  END IF;

  IF NEW.position_prompt_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM prompts p
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

DROP TRIGGER IF EXISTS validate_agent_prompts ON agents;

CREATE TRIGGER validate_agent_prompts
  BEFORE INSERT OR UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_agent_prompt_references();

-- Trading Ledger Tables (supports paper & real)

-- Cleanup legacy paper_* artifacts
DROP VIEW IF EXISTS paper_account_position_totals;
DROP VIEW IF EXISTS paper_position_aggregates;
DROP TABLE IF EXISTS paper_transactions;
DROP TABLE IF EXISTS paper_trades;
DROP TABLE IF EXISTS paper_orders;
DROP TABLE IF EXISTS paper_trading_accounts;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trading_record_type') THEN
    CREATE TYPE trading_record_type AS ENUM ('paper', 'real');
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS trading_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  label TEXT NOT NULL DEFAULT 'Primary',
  type trading_record_type NOT NULL DEFAULT 'paper',
  base_currency TEXT NOT NULL DEFAULT 'USD',
  starting_balance NUMERIC(18, 2) NOT NULL DEFAULT 100000.00,
  buying_power NUMERIC(18, 2) NOT NULL DEFAULT 100000.00,
  equity NUMERIC(18, 2) NOT NULL DEFAULT 100000.00,
  margin_used NUMERIC(18, 2) NOT NULL DEFAULT 0,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, label, type)
);

ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trading accounts"
  ON trading_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trading accounts"
  ON trading_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trading accounts"
  ON trading_accounts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trading accounts"
  ON trading_accounts
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trading_accounts_user ON trading_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_type ON trading_accounts(type);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_agent ON trading_accounts(agent_id);

CREATE TRIGGER update_trading_accounts_updated_at
  BEFORE UPDATE ON trading_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS trading_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  type trading_record_type NOT NULL DEFAULT 'paper',
  client_order_id TEXT,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  order_type TEXT NOT NULL CHECK (order_type IN ('MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT')),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED', 'EXPIRED')),
  quantity NUMERIC(18, 8) NOT NULL CHECK (quantity > 0),
  filled_quantity NUMERIC(18, 8) NOT NULL DEFAULT 0 CHECK (filled_quantity >= 0),
  limit_price NUMERIC(18, 8),
  stop_price NUMERIC(18, 8),
  average_fill_price NUMERIC(18, 8),
  time_in_force TEXT DEFAULT 'GTC',
  reduce_only BOOLEAN DEFAULT false,
  iceberg BOOLEAN DEFAULT false,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (account_id, client_order_id)
);

ALTER TABLE trading_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trading orders"
  ON trading_orders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trading orders"
  ON trading_orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trading orders"
  ON trading_orders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trading orders"
  ON trading_orders
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trading_orders_account ON trading_orders(account_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_user ON trading_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_agent ON trading_orders(agent_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_type ON trading_orders(type);
CREATE INDEX IF NOT EXISTS idx_trading_orders_symbol ON trading_orders(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_orders_status ON trading_orders(status);

CREATE TRIGGER update_trading_orders_updated_at
  BEFORE UPDATE ON trading_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS trading_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES trading_orders(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  type trading_record_type NOT NULL DEFAULT 'paper',
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  quantity NUMERIC(18, 8) NOT NULL CHECK (quantity > 0),
  price NUMERIC(18, 8) NOT NULL CHECK (price > 0),
  fee NUMERIC(18, 8) NOT NULL DEFAULT 0,
  liquidity TEXT CHECK (liquidity IN ('MAKER', 'TAKER')),
  realized_pnl NUMERIC(18, 8) NOT NULL DEFAULT 0,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE trading_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trading trades"
  ON trading_trades
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trading trades"
  ON trading_trades
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trading_trades_account_symbol ON trading_trades(account_id, symbol);
CREATE INDEX IF NOT EXISTS idx_trading_trades_user ON trading_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_trades_agent ON trading_trades(agent_id);
CREATE INDEX IF NOT EXISTS idx_trading_trades_type ON trading_trades(type);
CREATE INDEX IF NOT EXISTS idx_trading_trades_order ON trading_trades(order_id);
CREATE INDEX IF NOT EXISTS idx_trading_trades_executed_at ON trading_trades(executed_at DESC);

CREATE TABLE IF NOT EXISTS trading_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  type trading_record_type NOT NULL DEFAULT 'paper',
  category TEXT NOT NULL CHECK (category IN ('DEPOSIT', 'WITHDRAWAL', 'ADJUSTMENT', 'TRADE', 'FEE', 'TRANSFER')),
  amount NUMERIC(18, 8) NOT NULL,
  balance_after NUMERIC(18, 8),
  reference_order_id UUID REFERENCES trading_orders(id) ON DELETE SET NULL,
  reference_trade_id UUID REFERENCES trading_trades(id) ON DELETE SET NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE trading_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trading transactions"
  ON trading_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trading transactions"
  ON trading_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trading_transactions_account ON trading_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_trading_transactions_user ON trading_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_transactions_agent ON trading_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_trading_transactions_type ON trading_transactions(type);
CREATE INDEX IF NOT EXISTS idx_trading_transactions_category ON trading_transactions(category);
CREATE INDEX IF NOT EXISTS idx_trading_transactions_occurred_at ON trading_transactions(occurred_at DESC);

CREATE OR REPLACE VIEW trading_position_aggregates AS
SELECT
  t.account_id,
  t.user_id,
  t.agent_id,
  t.type,
  t.symbol,
  SUM(CASE WHEN t.side = 'BUY' THEN t.quantity ELSE 0 END) AS long_quantity,
  SUM(CASE WHEN t.side = 'BUY' THEN t.quantity * t.price ELSE 0 END) AS long_notional,
  SUM(CASE WHEN t.side = 'SELL' THEN t.quantity ELSE 0 END) AS short_quantity,
  SUM(CASE WHEN t.side = 'SELL' THEN t.quantity * t.price ELSE 0 END) AS short_notional,
  SUM(CASE WHEN t.side = 'BUY' THEN t.quantity ELSE -t.quantity END) AS net_quantity,
  SUM(CASE WHEN t.side = 'BUY' THEN t.quantity * t.price ELSE -t.quantity * t.price END) AS net_notional
FROM trading_trades t
GROUP BY t.account_id, t.user_id, t.agent_id, t.type, t.symbol;

CREATE OR REPLACE VIEW trading_account_position_totals AS
SELECT
  account_id,
  user_id,
  agent_id,
  type,
  SUM(long_quantity) AS total_long_quantity,
  SUM(long_notional) AS total_long_notional,
  SUM(short_quantity) AS total_short_quantity,
  SUM(short_notional) AS total_short_notional,
  SUM(net_quantity) AS net_quantity,
  SUM(net_notional) AS net_notional
FROM trading_position_aggregates
GROUP BY account_id, user_id, agent_id, type;
