-- Alpha Arena - Database Migration
-- Implementation of PRD requirements

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: agents (LLM Trading Agents)
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    llm_provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    hyperliquid_address TEXT NOT NULL,
    initial_capital NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: trades (Trading History)
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    asset TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('LONG', 'SHORT')),
    status TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED')),
    size NUMERIC NOT NULL,
    entry_price NUMERIC NOT NULL,
    entry_timestamp TIMESTAMPTZ NOT NULL,
    exit_price NUMERIC,
    exit_timestamp TIMESTAMPTZ,
    realized_pnl NUMERIC
);

-- Table 3: assessments (LLM Thought Process/Timeline)
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('MARKET_SCAN', 'POSITION_REVIEW')),
    market_data_snapshot JSONB NOT NULL,
    llm_prompt_used TEXT NOT NULL,
    llm_response_text TEXT NOT NULL,
    trade_action_taken TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_is_active ON agents(is_active);

CREATE INDEX IF NOT EXISTS idx_trades_agent_id ON trades(agent_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_entry_timestamp ON trades(entry_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_assessments_agent_id ON assessments(agent_id);
CREATE INDEX IF NOT EXISTS idx_assessments_timestamp ON assessments(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(type);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own agents" ON agents;
DROP POLICY IF EXISTS "Users can insert their own agents" ON agents;
DROP POLICY IF EXISTS "Users can update their own agents" ON agents;
DROP POLICY IF EXISTS "Users can delete their own agents" ON agents;
DROP POLICY IF EXISTS "Users can view trades for their agents" ON trades;
DROP POLICY IF EXISTS "Backend can insert trades" ON trades;
DROP POLICY IF EXISTS "Backend can update trades" ON trades;
DROP POLICY IF EXISTS "Users can view assessments for their agents" ON assessments;
DROP POLICY IF EXISTS "Backend can insert assessments" ON assessments;

-- Agents policies: Users can only see/modify their own agents
CREATE POLICY "Users can view their own agents"
    ON agents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agents"
    ON agents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents"
    ON agents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents"
    ON agents FOR DELETE
    USING (auth.uid() = user_id);

-- Trades policies: Users can only see trades for their agents
CREATE POLICY "Users can view trades for their agents"
    ON trades FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM agents
            WHERE agents.id = trades.agent_id
            AND agents.user_id = auth.uid()
        )
    );

CREATE POLICY "Backend can insert trades"
    ON trades FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Backend can update trades"
    ON trades FOR UPDATE
    USING (true);

-- Assessments policies: Users can only see assessments for their agents
CREATE POLICY "Users can view assessments for their agents"
    ON assessments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM agents
            WHERE agents.id = assessments.agent_id
            AND agents.user_id = auth.uid()
        )
    );

CREATE POLICY "Backend can insert assessments"
    ON assessments FOR INSERT
    WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON agents TO authenticated;
GRANT SELECT ON trades TO authenticated;
GRANT SELECT ON assessments TO authenticated;
GRANT ALL ON trades TO service_role;
GRANT ALL ON assessments TO service_role;
