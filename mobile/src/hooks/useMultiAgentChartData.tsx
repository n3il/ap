import { type ReactElement, useMemo } from "react";
import { Text, View } from "react-native";
import { useAgentAccountValueHistories } from "@/hooks/useAgentAccountValueHistories";
import { useColors } from "@/theme";
import { marketHistoryService } from "@/services/marketHistoryService";
import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { useTimeframeStore } from "@/stores/useTimeframeStore";

type LineDatum = {
  value: number;
  dataPointText: string;
  timestamp: number;
  label?: string;
  hideDataPoint?: boolean;
  agentId?: string;
  agentName?: string;
  agentColor?: string;
  customDataPoint?: () => ReactElement;
};

export type ChartLine = {
  data: LineDatum[];
  color: string;
  startFillColor?: string;
  endFillColor?: string;
  name?: string;
};

const formatPercentValue = (value: number) => {
  if (!Number.isFinite(value)) return "0.00%";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

const normalizeTimestamp = (value: unknown): number | null => {
  // Handle string timestamps (ISO format)
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return null;
    return parsed.getTime(); // Returns local time in milliseconds
  }

  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num < 1e12 ? num * 1000 : num;
};

// Map UI timeframe keys to backend history keys
const TIMEFRAME_KEY_MAP: Record<string, string> = {
  "1h": "day",
  "24h": "day",
  "7d": "week",
  "1M": "month",
  All: "perpAlltime",
};

const getLabelFormatter = (timeframeKey: string) => {
  if (timeframeKey === "day") {
    return (date: Date) =>
      date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
  } else if (timeframeKey === "week") {
    return (date: Date) =>
      date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getLabelIndices = (dataLength: number, maxLabels = 4): Set<number> => {
  const indices = new Set<number>();
  if (dataLength <= maxLabels) {
    for (let i = 0; i < dataLength; i++) indices.add(i);
  } else {
    const step = (dataLength - 1) / (maxLabels - 1);
    for (let i = 0; i < maxLabels; i++) {
      indices.add(Math.round(i * step));
    }
  }
  return indices;
};

export function useMultiAgentChartData() {
  const { colors, withOpacity } = useColors();
  const { timeframe } = useTimeframeStore();
  const agents = useExploreAgentsStore((state) => state.agents);
  const { histories: accountHistories, isLoading: historiesLoading } =
    useAgentAccountValueHistories();
  const btcHistory = marketHistoryService.useCandleHistory("BTC", timeframe);

  const { dataSet, minValue, maxValue } = useMemo(() => {
    if (!agents.length) return { dataSet: [], minValue: 0, maxValue: 0 };

    const timeframeKey =
      TIMEFRAME_KEY_MAP[timeframe] ?? TIMEFRAME_KEY_MAP["24h"];
    const formatLabel = getLabelFormatter(timeframeKey);
    let globalMin = Infinity;
    let globalMax = Infinity;

    // Calculate the expected time range based on the selected timeframe
    const config = marketHistoryService.getTimeframeConfig(timeframe);
    const endTime = Date.now();
    const startTime = config ? endTime - config.durationMs : endTime - (24 * 60 * 60 * 1000);

    const lines: ChartLine[] = [];

    // Agent lines
    agents.forEach((agent) => {
      const agentHistory = accountHistories[agent.id];
      const timeframeHistory = agentHistory?.histories?.[timeframeKey];

      if (!timeframeHistory || timeframeHistory.length < 2) return;

      // Filter history to only include points within the time range
      const filteredHistory = timeframeHistory.filter((p) => {
        const ts = normalizeTimestamp(p.timestamp);
        return ts !== null && ts >= startTime && ts <= endTime && Number.isFinite(Number(p?.value));
      });

      if (filteredHistory.length < 2) return;

      // Use the first point within the filtered range as baseline
      const baseline = Number(filteredHistory[0]?.value);
      if (!Number.isFinite(baseline)) return;

      const data: LineDatum[] = [];
      let localMin = Infinity;
      let localMax = Infinity;
      const agentColor =
        colors.providers?.[agent.llm_provider] || colors.surfaceForeground;

      for (let i = 0; i < filteredHistory.length; i++) {
        const point = filteredHistory[i];
        const timestamp = normalizeTimestamp(point.timestamp);
        const value = Number(point.value);

        if (!Number.isFinite(value) || timestamp === null) continue;

        const percentChange =
          baseline !== 0 ? ((value - baseline) / baseline) * 100 : 0;

        if (percentChange < localMin) localMin = percentChange;
        if (percentChange > localMax) localMax = percentChange;

        data.push({
          value: percentChange,
          dataPointText: formatPercentValue(percentChange),
          timestamp,
          hideDataPoint: i !== filteredHistory.length - 1,
          id: `${agent.id}-${timestamp}`,
          agentId: agent.id,
          agentName: agent.name,
          agentColor,
        });
      }

      if (data.length < 2) return;

      globalMin = Math.min(globalMin, localMin);
      globalMax = Math.max(globalMax, localMax);

      const labelIndices = getLabelIndices(data.length);
      for (const idx of labelIndices) {
        data[idx].label = formatLabel(new Date(data[idx].timestamp));
      }

      const lastPoint = data[data.length - 1];
      const pointColor =
        colors.providers?.[agent.llm_provider] || colors.surfaceForeground;
      lastPoint.customDataPoint = () => (
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <View
            style={{
              position: "absolute",
              left: 12,
              backgroundColor: pointColor,
              paddingHorizontal: 6,
              paddingVertical: 0,
              borderRadius: 4,
              flex: 1,
              flexDirection: "row",
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 12,
                fontWeight: "600",
                flex: 1,
              }}
            >
              {lastPoint.dataPointText}
            </Text>
          </View>
        </View>
      );

      lines.push({
        data,
        color: agentColor,
        startFillColor: withOpacity(agentColor, 0.01),
        endFillColor: withOpacity(agentColor, 0.01),
        name: agent.name,
      });
    });

    // BTC price line
    const btcCandles = btcHistory.data?.BTC ?? [];
    if (btcCandles.length >= 2) {
      // Filter BTC candles to only include those within the time range
      const filteredCandles = btcCandles.filter((candle) => {
        const ts = normalizeTimestamp(candle.timestamp);
        return ts !== null && ts >= startTime && ts <= endTime;
      });

      if (filteredCandles.length >= 2) {
        const baseline = Number(filteredCandles[0]?.close);
        if (Number.isFinite(baseline)) {
          const btcData: LineDatum[] = filteredCandles
            .map((candle) => {
              const ts = normalizeTimestamp(candle.timestamp);
              const price = Number(candle.close);
              if (!Number.isFinite(price) || ts === null) return null;
              const pct =
                baseline !== 0 ? ((price - baseline) / baseline) * 100 : 0;
              return {
                value: pct,
                dataPointText: formatPercentValue(pct),
                timestamp: ts,
                id: `BTC-${ts}`
              };
            })
            .filter((p): p is LineDatum => Boolean(p));

          if (btcData.length >= 2) {
            const labelIndices = getLabelIndices(btcData.length);
            for (const idx of labelIndices) {
              btcData[idx].label = formatLabel(new Date(btcData[idx].timestamp));
            }

            const btcMin = Math.min(...btcData.map((p) => p.value));
            const btcMax = Math.max(...btcData.map((p) => p.value));
            globalMin = Math.min(globalMin, btcMin);
            globalMax = Math.max(globalMax, btcMax);

            lines.push({
              data: btcData,
              color: "orange",
              startFillColor: withOpacity(colors.foreground, 0.01),
              endFillColor: withOpacity(colors.foreground, 0.01),
              name: "BTC",
            });
          }
        }
      }
    }

    return {
      dataSet: lines,
      minValue: Number.isFinite(globalMin) ? Math.floor(globalMin) : 0,
      maxValue: Number.isFinite(globalMax) ? Math.floor(globalMax) : 0,
    };
  }, [accountHistories, agents, btcHistory.data, colors, timeframe, withOpacity]);

  return {
    dataSet,
    minValue,
    maxValue,
    isLoading: historiesLoading || btcHistory.isLoading || btcHistory.isFetching,
  };
}
