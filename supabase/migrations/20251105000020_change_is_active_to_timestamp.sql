-- Change is_active from BOOLEAN to TIMESTAMPTZ
-- This allows tracking when an agent became active, not just if it's active

-- Step 1: Add a new temporary column
ALTER TABLE agents ADD COLUMN is_active_new TIMESTAMPTZ;

-- Step 2: Migrate existing data
-- TRUE -> current timestamp
-- FALSE or NULL -> NULL
UPDATE agents
SET is_active_new = CASE
  WHEN is_active = true THEN NOW()
  ELSE NULL
END;

-- Step 3: Drop the old column
ALTER TABLE agents DROP COLUMN is_active;

-- Step 4: Rename the new column
ALTER TABLE agents RENAME COLUMN is_active_new TO is_active;

-- Step 5: Update the index
DROP INDEX IF EXISTS idx_agents_is_active;
CREATE INDEX idx_agents_is_active ON agents(is_active) WHERE is_active IS NOT NULL;

-- Add comment to document the change
COMMENT ON COLUMN agents.is_active IS 'Timestamp when the agent was activated. NULL means the agent is paused.';
