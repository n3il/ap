# SvgChart Component

A reusable, interactive SVG chart component for displaying time-series data with multiple data sources.

## Features

- ✅ **Multi-source support** - Agents performance or account balance
- ✅ **Interactive touch** - Tap and drag for crosshair tooltips
- ✅ **Responsive scaling** - Auto-adjusts Y-axis based on data range
- ✅ **Time-based X-axis** - Support for 1h, 24h, 7d timeframes
- ✅ **Animated endpoints** - Pulsing circles on latest values
- ✅ **Expandable details** - Show/hide detailed breakdown
- ✅ **Mock data fallback** - Graceful handling when no data available

## Data Sources

### `CHART_DATA_SOURCE.AGENTS`
Display multiple agent performance lines on a single chart.

**Required props:**
- `dataSource`: `CHART_DATA_SOURCE.AGENTS`
- `agents`: Array of agent configs with `{ id, name, llm_provider, initial_capital }`
- `timeframe`: `'1h' | '24h' | '7d'`

**Example:**
```javascript
import SvgChart, { CHART_DATA_SOURCE } from '@/components/SvgChart';

<SvgChart
  dataSource={CHART_DATA_SOURCE.AGENTS}
  agents={[
    { id: '1', name: 'GPT-4 Agent', llm_provider: 'openai', initial_capital: 10000 },
    { id: '2', name: 'Claude Agent', llm_provider: 'anthropic', initial_capital: 10000 },
  ]}
  timeframe="24h"
/>
```

### `CHART_DATA_SOURCE.ACCOUNT_BALANCE`
Display user's account balance performance over time.

**Required props:**
- `dataSource`: `CHART_DATA_SOURCE.ACCOUNT_BALANCE`
- `accountData`: Array of `{ timestamp: string, balance: number }` (or `null` for mock data)
- `timeframe`: `'1h' | '24h' | '7d'`

**Optional props:**
- `yAxisLabel`: Custom Y-axis label (default: automatic based on source)
- `formatValue`: Custom value formatter function

**Example:**
```javascript
<SvgChart
  dataSource={CHART_DATA_SOURCE.ACCOUNT_BALANCE}
  accountData={[
    { timestamp: '2024-01-01T00:00:00Z', balance: 10000 },
    { timestamp: '2024-01-01T01:00:00Z', balance: 10250 },
    { timestamp: '2024-01-01T02:00:00Z', balance: 10180 },
  ]}
  timeframe="7d"
/>
```

## Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `dataSource` | `string` | `CHART_DATA_SOURCE.AGENTS` | Data source type enum |
| `timeframe` | `string` | `'1h'` | Time range: `'1h'`, `'24h'`, or `'7d'` |
| `agents` | `Array<Agent>` | `[]` | Agent configs (for AGENTS source) |
| `accountData` | `Array<BalancePoint>` | `null` | Balance history (for ACCOUNT_BALANCE source) |
| `yAxisLabel` | `string` | Auto | Y-axis label suffix |
| `formatValue` | `Function` | Auto | Custom value formatter `(value) => string` |

### Type Definitions

```typescript
type Agent = {
  id: string;
  name: string;
  llm_provider: string;
  initial_capital: number;
};

type BalancePoint = {
  timestamp: string;  // ISO 8601 format
  balance: number;
};

type DataSource =
  | 'agents'
  | 'account-balance';
```

## Custom Formatting

You can provide a custom value formatter:

```javascript
<SvgChart
  dataSource={CHART_DATA_SOURCE.ACCOUNT_BALANCE}
  accountData={balanceData}
  formatValue={(value) => `$${value.toFixed(2)}`}
/>
```

## Data Format

### Agent Performance Data
The component automatically fetches agent snapshots using `useMultiAgentSnapshots` hook and transforms them to:
```javascript
{
  lines: [{
    id: 'agent-id',
    name: 'Agent Name',
    color: '#34d399',
    data: [
      { time: 0, value: 0 },      // time: 0-1 normalized
      { time: 0.5, value: 2.5 },  // value: percent change
      { time: 1, value: 5.8 },
    ]
  }]
}
```

### Account Balance Data
Expects input format:
```javascript
[
  { timestamp: '2024-01-01T00:00:00Z', balance: 10000 },
  { timestamp: '2024-01-01T01:00:00Z', balance: 10250 },
]
```

Transforms to:
```javascript
{
  lines: [{
    id: 'account-balance',
    name: 'Account Balance',
    color: '#34d399',
    data: [
      { time: 0, value: 0 },      // time: 0-1 normalized
      { time: 0.5, value: 2.5 },  // value: percent change from initial
      { time: 1, value: 5.8 },
    ]
  }]
}
```

## Usage Examples

### Basic Agent Chart
```javascript
import SvgChart, { CHART_DATA_SOURCE } from '@/components/SvgChart';

function AgentPerformance({ agents }) {
  return (
    <SvgChart
      dataSource={CHART_DATA_SOURCE.AGENTS}
      agents={agents}
      timeframe="24h"
    />
  );
}
```

### Account Balance with Timeframe Selector
```javascript
function AccountPerformance() {
  const [timeframe, setTimeframe] = useState('7d');

  // Fetch or mock balance data
  const accountData = [
    { timestamp: '2024-01-01T00:00:00Z', balance: 10000 },
    { timestamp: '2024-01-02T00:00:00Z', balance: 10580 },
  ];

  return (
    <View>
      {/* Timeframe selector */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {['1h', '24h', '7d'].map((tf) => (
          <TouchableOpacity
            key={tf}
            onPress={() => setTimeframe(tf)}
          >
            <Text>{tf}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      <SvgChart
        dataSource={CHART_DATA_SOURCE.ACCOUNT_BALANCE}
        accountData={accountData}
        timeframe={timeframe}
      />
    </View>
  );
}
```

### With Protected Route (Performance Screen)
```javascript
import { ProtectedRoute, ROUTES } from '@/navigation';

export default function PerformanceScreen() {
  const [timeframe, setTimeframe] = useState('7d');

  return (
    <ProtectedRoute route={ROUTES.TABS_PERFORMANCE}>
      <ContainerView>
        <SvgChart
          dataSource={CHART_DATA_SOURCE.ACCOUNT_BALANCE}
          accountData={null}  // Uses mock data
          timeframe={timeframe}
        />
      </ContainerView>
    </ProtectedRoute>
  );
}
```

## Mock Data

When no data is provided or data fetch fails, the component automatically falls back to mock data:

**For AGENTS:**
- Returns multiple colored lines simulating agent performance
- Uses `getMockAgentsForSvgChart()` from mock factory

**For ACCOUNT_BALANCE:**
- Returns single green line with sample growth pattern
- Shows ~5.8% growth over selected timeframe

## Interactive Features

### Touch Interaction
- **Tap/Drag**: Shows crosshair and value tooltips
- **Release**: Hides crosshair
- **Tooltip**: Displays time and all line values at touch position

### Expand/Collapse
- Click the fullscreen icon to toggle expanded view
- Expanded view shows detailed breakdown table
- Each line shows:
  - Final value with color coding (green/red)
  - Total change over timeframe
  - Visual indicator bar

## Styling

Chart uses consistent theme colors:
- **Grid lines**: `rgba(148, 163, 184, 0.15)`
- **Zero line**: `rgba(158, 149, 149, 0.8)` with dash pattern
- **Positive values**: `#34d399` (green)
- **Negative values**: `#f87171` (red)
- **Agent colors**: Based on `getProviderColor(llm_provider)`

## Performance

- Uses `useMemo` for expensive calculations
- Normalized coordinates (0-1) for efficient rendering
- Animated components use `useNativeDriver: false` for SVG compatibility
- Touch handler optimized with `PanResponder`

## Notes

- All timestamps should be ISO 8601 format
- Account balance calculates percent change from initial balance
- Time axis auto-formats based on timeframe (minutes, hours, or dates)
- Y-axis auto-scales with 10% padding on min/max values
- Chart dimensions: 350x180px (configurable via constants)

## TODOs

- [ ] Add real account balance data fetching
- [ ] Support for additional data sources (e.g., portfolio value, individual positions)
- [ ] Custom color schemes
- [ ] Download/export chart as image
- [ ] Zoom/pan gestures
- [ ] Multiple timeframe comparison
