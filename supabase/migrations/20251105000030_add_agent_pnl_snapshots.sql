-- Agent PnL Snapshots Table
-- Records point-in-time balance and performance metrics for agents
-- Populated after each agent assessment run (every ~15 minutes)

CREATE TABLE IF NOT EXISTS agent_pnl_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,

  -- Balance metrics
  equity NUMERIC NOT NULL,
  realized_pnl NUMERIC NOT NULL DEFAULT 0,
  unrealized_pnl NUMERIC NOT NULL DEFAULT 0,

  -- Position metrics
  open_positions_count INTEGER NOT NULL DEFAULT 0,
  margin_used NUMERIC NOT NULL DEFAULT 0,

  -- Performance metadata
  assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_agent_pnl_snapshots_agent_time ON agent_pnl_snapshots(agent_id, timestamp DESC);
CREATE INDEX idx_agent_pnl_snapshots_timestamp ON agent_pnl_snapshots(timestamp DESC);

-- RLS Policies: Users can only see snapshots for their own agents
ALTER TABLE agent_pnl_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view snapshots for their agents" ON agent_pnl_snapshots;
CREATE POLICY "Users can view snapshots for their agents"
  ON agent_pnl_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_pnl_snapshots.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Backend can insert snapshots
DROP POLICY IF EXISTS "Backend can insert snapshots" ON agent_pnl_snapshots;
CREATE POLICY "Backend can insert snapshots"
  ON agent_pnl_snapshots FOR INSERT
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON agent_pnl_snapshots TO authenticated;
GRANT ALL ON agent_pnl_snapshots TO service_role;

-- Add comment
COMMENT ON TABLE agent_pnl_snapshots IS 'Point-in-time performance snapshots recorded after each agent assessment run (every ~15 min)';
