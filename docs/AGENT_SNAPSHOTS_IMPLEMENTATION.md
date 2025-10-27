# Agent PnL Snapshots Implementation

## Overview
Implemented real-time agent balance tracking and performance visualization as specified in PRD.md section 10 (Future Enhancements).

## Database Changes

### New Table: `agent_pnl_snapshots`
**Location**: `/supabase/migrations/20251105000030_add_agent_pnl_snapshots.sql`

Records point-in-time performance metrics for each agent:
- `equity`: Total agent value (initial_capital + realized_pnl + unrealized_pnl)
- `realized_pnl`: Cumulative PnL from closed trades
- `unrealized_pnl`: Current PnL from open positions
- `open_positions_count`: Number of active positions
- `margin_used`: Capital allocated to positions
- `assessment_id`: Links to the assessment that triggered this snapshot

**Frequency**: Every ~15 minutes (when agent assessments run via cron)

**RLS Policies**: Users can only view snapshots for their own agents

## Backend Changes

### Updated: `run_agent_assessment` Function
**Location**: `/supabase/functions/run_agent_assessment/index.ts`

Added snapshot recording logic after each assessment (lines 119-175):
1. Fetches all closed trades → calculates `realized_pnl`
2. Calculates `unrealized_pnl` from open positions using current market prices
3. Computes `equity` = initial_capital + realized_pnl + unrealized_pnl
4. Inserts snapshot into `agent_pnl_snapshots` table
5. Links snapshot to assessment via `assessment_id`

**Error Handling**: Snapshot failures are logged but don't interrupt the assessment flow

## Frontend Implementation

### 1. Service Layer
**File**: `/src/services/agentSnapshotService.js`

Methods:
- `getAgentSnapshots(agentId, timeframe)` - Fetch snapshots for one agent
- `getMultiAgentSnapshots(agentIds, timeframe)` - Fetch snapshots for comparison
- `getLatestSnapshot(agentId)` - Get most recent snapshot
- `calculatePercentChange(snapshots, initialCapital)` - Convert equity to % gains

Timeframes supported: `'1h'`, `'24h'`, `'7d'`, `'30d'`

### 2. React Query Hooks
**File**: `/src/hooks/useAgentSnapshots.js`

- `useAgentSnapshots` - Single agent performance data
- `useMultiAgentSnapshots` - Multi-agent comparison data
- `useLatestAgentSnapshot` - Latest snapshot for an agent

**Polling**: Auto-refetch every 60 seconds, stale time 30 seconds

### 3. UI Component
**File**: `/src/components/AgentComparisonLineChart.js`

**Features**:
- Multi-agent performance line chart
- X-axis: Time-based labels (adapts to timeframe)
- Y-axis: Percent gain/loss (auto-scaled)
- Color-coded agent lines with legend
- Grid lines + emphasized zero line
- End-point circles on each line
- Performance stats showing current % gain/loss
- Loading states
- Fallback to mock data when no agents provided

**Props**:
```javascript
<AgentComparisonLineChart
  agents={[
    { id: 'uuid', name: 'Agent Name', initial_capital: 10000 },
    ...
  ]}
  timeframe="24h"
/>
```

**Integration**: Currently placed in `MarketPricesWidget` (line 289)

## Data Flow

```
Cron (every 15 min)
  → agent_scheduler
    → run_agent_assessment
      → Calculate PnL metrics
      → Insert agent_pnl_snapshots row
      → Link to assessment

Frontend
  → useMultiAgentSnapshots hook
    → Query snapshots from DB (filtered by timeframe)
    → Calculate percent changes
    → AgentComparisonLineChart renders
```

## Usage Example

```javascript
import { AgentComparisonLineChart } from '@/components/AgentComparisonLineChart';

function Dashboard() {
  const agents = [
    { id: 'agent-1', name: 'Quantum Trader', initial_capital: 10000 },
    { id: 'agent-2', name: 'Neural Alpha', initial_capital: 10000 },
  ];

  return (
    <AgentComparisonLineChart
      agents={agents}
      timeframe="24h"
    />
  );
}
```

## Database Schema

```sql
CREATE TABLE agent_pnl_snapshots (
  id UUID PRIMARY KEY,
  agent_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  equity NUMERIC NOT NULL,
  realized_pnl NUMERIC NOT NULL,
  unrealized_pnl NUMERIC NOT NULL,
  open_positions_count INTEGER NOT NULL,
  margin_used NUMERIC NOT NULL,
  assessment_id UUID,
  created_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_agent_pnl_snapshots_agent_time
  ON agent_pnl_snapshots(agent_id, timestamp DESC);
```

## Testing

1. **Migration**: Run Supabase migrations to create table
2. **Backend**: Trigger agent assessment to generate first snapshot
3. **Frontend**: Pass agent IDs to chart component and select timeframe
4. **Fallback**: Without agents, chart shows demo data

## Performance Considerations

- Snapshots recorded every ~15 min = ~96 rows/agent/day
- Indexed on `(agent_id, timestamp)` for fast range queries
- Client-side polling every 60 seconds (configurable)
- RLS ensures users only fetch their own agent data

## Future Enhancements

- Add margin_used calculation (currently TODO in backend)
- Add data retention policy (e.g., aggregate old snapshots)
- Add comparison to market benchmarks (BTC, ETH)
- Add agent rankings/leaderboard using snapshot data
- Export performance data to CSV
