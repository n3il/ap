-- Move Hyperliquid wallet data onto trading_accounts and drop unused balance columns

ALTER TABLE public.trading_accounts
  ADD COLUMN IF NOT EXISTS hyperliquid_address TEXT,
  ADD COLUMN IF NOT EXISTS hyperliquid_wallet_address TEXT,
  ADD COLUMN IF NOT EXISTS hyperliquid_wallet_private_key TEXT;

-- Backfill trading account address from agents if available
UPDATE public.trading_accounts ta
SET hyperliquid_address = ag.hyperliquid_address
FROM public.agents ag
WHERE ta.agent_id = ag.id
  AND ta.hyperliquid_address IS NULL
  AND ag.hyperliquid_address IS NOT NULL;

ALTER TABLE public.agents
  DROP COLUMN IF EXISTS hyperliquid_address;

ALTER TABLE public.trading_accounts
  DROP COLUMN IF EXISTS base_currency,
  DROP COLUMN IF EXISTS starting_balance,
  DROP COLUMN IF EXISTS buying_power,
  DROP COLUMN IF EXISTS equity,
  DROP COLUMN IF EXISTS margin_used;
