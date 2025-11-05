-- Add leverage column to trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS leverage NUMERIC DEFAULT 1;

-- Add comment to describe the column
COMMENT ON COLUMN trades.leverage IS 'Leverage multiplier used for the trade (e.g., 1, 5, 10, 20, 50, 100)';

-- Create index for querying trades by leverage
CREATE INDEX IF NOT EXISTS idx_trades_leverage ON trades(leverage);
