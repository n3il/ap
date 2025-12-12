# Unified Chart Data System

A performant, DRY system for fetching and normalizing chart data from multiple sources.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  useChartData Hook                   │
│  • React Query caching                               │
│  • Parallel data fetching                            │
│  • Memoized transformations                          │
└────────────────┬────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼────────┐  ┌────▼─────────────────────┐
│   Service      │  │    Normalizer            │
│  • Postgres    │  │  • Timestamp conversion  │
│  • Hyperliquid │  │  • Percent change calc   │
│  • Batch fetch │  │  • Data filtering        │
└────────────────┘  └──────────────────────────┘
```

## Features

- **Performant**: Postgres does heavy lifting (bucketing, filtering)
- **DRY**: Single source of truth for data transformation logic
- **Minimal Looping**: Functional patterns, single-pass transformations
- **Type-Safe**: Full TypeScript support
- **Cached**: React Query for automatic caching and revalidation
- **Parallel**: All data sources fetched simultaneously

## Quick Start

```typescript
import { useChartData } from "@/data";

function MyChart() {
  const { datasets, isLoading, error, timeRange } = useChartData({
    sources: [
      {
        type: "agentAccountValue",
        agentId: "uuid-1",
        label: "Agent Alpha",
        color: "#ff0000"
      },
      {
        type: "candleHistory",
        ticker: "BTC",
        key: "close",
        label: "Bitcoin",
        color: "#f7931a"
      },
      {
        type: "sentiment",
        agentId: "uuid-1",
        label: "Sentiment",
        color: "#00ff00"
      },
    ],
    timeRange: {
      startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
      endTime: Date.now(),
    },
  });

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <LineChart
      dataSet={datasets.map(ds => ({
        data: ds.data.map(point => ({ value: point.value })),
        color: ds.color,
      }))}
    />
  );
}
```

## Data Sources

### Agent Account Value
```typescript
{
  type: "agentAccountValue",
  agentId: string,
  label?: string,
  color?: string,
}
```
Returns percentage change from baseline (first point in time range).

### Candle History
```typescript
{
  type: "candleHistory",
  ticker: string,
  key?: "open" | "high" | "low" | "close" | "volume",
  label?: string,
  color?: string,
}
```
Returns percentage change from baseline (first candle in time range).

### Sentiment Scores
```typescript
{
  type: "sentiment",
  agentId: string,
  label?: string,
  color?: string,
}
```
Returns raw sentiment scores (-1 to 1 range).

## Advanced Usage

### Custom Time Ranges
```typescript
const { datasets } = useChartData({
  sources: [...],
  timeRange: {
    startTime: new Date("2025-01-01"),
    endTime: new Date("2025-12-31"),
  },
});
```

### Custom Bucketing
```typescript
const { datasets } = useChartData({
  sources: [...],
  timeRange: {...},
  numBuckets: 100, // More granular data (default: 50)
  candleInterval: "1h", // Hourly candles (default: "5m")
});
```

### Conditional Fetching
```typescript
const { datasets } = useChartData({
  sources: [...],
  timeRange: {...},
  enabled: agentId !== null, // Only fetch when agentId is available
});
```

## Performance Characteristics

### Database Queries
- **Agent Account Values**: 1 RPC call (bucketed aggregation in Postgres)
- **Candle History**: N API calls (1 per ticker, sequential to avoid rate limits)
- **Sentiment Scores**: 1 query (JSON column selection for efficiency)

### JavaScript Processing
- **Timestamp Normalization**: O(n) single pass
- **Percent Change Calculation**: O(n) single pass, inline with normalization
- **Time Range Filtering**: O(n) single pass, inline with normalization
- **Total Complexity**: O(n) where n = total data points across all sources

### Caching
- React Query caches results for 5 minutes
- Data considered fresh for 30 seconds
- Automatic background refetch on window focus

## Directory Structure

```
src/data/
├── README.md                       # This file
├── index.ts                        # Public API exports
├── hooks/
│   └── useChartData.ts            # Main hook
├── services/
│   └── chartDataService.ts        # Data fetching layer
├── types/
│   └── chartData.ts               # TypeScript types
└── utils/
    └── chartDataNormalizer.ts     # Transformation utilities
```

## Migration Guide

### From useMultiAgentChartData

**Before:**
```typescript
const { dataSet, minValue, maxValue, isLoading } = useMultiAgentChartData();
```

**After:**
```typescript
const { datasets, isLoading } = useChartData({
  sources: agents.map(agent => ({
    type: "agentAccountValue",
    agentId: agent.id,
    label: agent.name,
    color: colors.providers[agent.llm_provider],
  })),
  timeRange: {
    startTime: Date.now() - TIMEFRAME_CONFIG[timeframe].durationMs,
    endTime: Date.now(),
  },
});
```

### From AgentDetailsChart data fetching

**Before:**
```typescript
const { data: sentimentData } = useQuery(...);
const { histories } = useAgentAccountValueHistories();
const { data: btcCandleData } = useCandleHistory("BTC", timeframe);
// ...manual normalization and alignment
```

**After:**
```typescript
const { datasets } = useChartData({
  sources: [
    { type: "sentiment", agentId: agent.id, color: colors.accent },
    { type: "agentAccountValue", agentId: agent.id, color: colors.success },
    { type: "candleHistory", ticker: "BTC", color: colors.primary },
  ],
  timeRange: {
    startTime: Date.now() - TIMEFRAME_CONFIG[timeframe].durationMs,
    endTime: Date.now(),
  },
});
```

## Best Practices

1. **Reuse Sources**: Create source arrays outside components to prevent re-renders
2. **Stable Keys**: Use stable IDs in source objects for React Query cache hits
3. **Conditional Queries**: Use `enabled` param to prevent unnecessary fetches
4. **Error Handling**: Always check `error` before rendering `datasets`
5. **Time Zones**: All timestamps are normalized to local time automatically
