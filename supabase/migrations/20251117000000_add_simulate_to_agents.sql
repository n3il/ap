-- Add simulate column to agents table
-- This column determines whether the agent is in paper trading mode (simulate=true) or real trading mode (simulate=false)

ALTER TABLE agents
ADD COLUMN IF NOT EXISTS simulate BOOLEAN DEFAULT true;

-- Add comment to explain the column
COMMENT ON COLUMN agents.simulate IS 'When true, agent trades in simulation/paper mode. When false, agent executes real trades.';
