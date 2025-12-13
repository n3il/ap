/**
 * Example Chart Component
 * Demonstrates how to use the unified chart data system
 */

import React, { useState } from "react";
import { LineChart } from "react-native-gifted-charts";
import { View, Text } from "@/components/ui";
import { useChartData } from "@/data";
import { useColors } from "@/theme";
import type { AgentType } from "@/types/agent";

type TimeframeOption = "1h" | "24h" | "7d" | "30d";

const TIMEFRAME_DURATIONS = {
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export function ExampleUnifiedChart({ agents }: { agents: AgentType[] }) {
  const { colors } = useColors();
  const [timeframe, setTimeframe] = useState<TimeframeOption>("7d");

  // Define data sources
  const sources = agents.map((agent, index) => ({
    type: "agentAccountValue" as const,
    agentId: agent.id,
    label: agent.name,
    color: colors.providers?.[agent.llm_provider] || colors.primary,
  }));

  // Add BTC for comparison
  sources.push({
    type: "candleHistory" as const,
    ticker: "BTC",
    label: "Bitcoin",
    color: "#f7931a",
  } as any);

  // Fetch data
  const { datasets, isLoading, error } = useChartData({
    sources,
    timeRange: {
      startTime: Date.now() - TIMEFRAME_DURATIONS[timeframe],
      endTime: Date.now(),
    },
  });

  if (isLoading) {
    return (
      <View style={{ padding: 20, alignItems: "center" }}>
        <Text>Loading chart data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ padding: 20, alignItems: "center" }}>
        <Text style={{ color: colors.error }}>
          Error: {error.message}
        </Text>
      </View>
    );
  }

  // Transform datasets for LineChart
  const chartDataSets = datasets.map((dataset) => ({
    data: dataset.data.map((point) => ({
      value: point.value,
      timestamp: point.timestamp,
    })),
    color: dataset.color || colors.primary,
    label: dataset.label,
  }));

  return (
    <View style={{ padding: 16 }}>
      {/* Timeframe selector */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        {(["1h", "24h", "7d", "30d"] as TimeframeOption[]).map((tf) => (
          <View
            key={tf}
            onTouchEnd={() => setTimeframe(tf)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor:
                timeframe === tf ? colors.primary : colors.surface,
            }}
          >
            <Text
              style={{
                color: timeframe === tf ? colors.background : colors.foreground,
              }}
            >
              {tf}
            </Text>
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        {datasets.map((dataset) => (
          <View
            key={dataset.id}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <View
              style={{
                width: 16,
                height: 3,
                backgroundColor: dataset.color || colors.primary,
                borderRadius: 2,
              }}
            />
            <Text variant="xs" style={{ color: colors.foreground }}>
              {dataset.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Chart */}
      {chartDataSets.length > 0 ? (
        <LineChart
          dataSet={chartDataSets}
          height={200}
          curved
          hideDataPoints
          thickness={2}
          yAxisLabelSuffix="%"
          adjustToWidth
          animateOnDataChange
        />
      ) : (
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text>No data available</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Example: Agent-specific chart with sentiment
 */
export function ExampleAgentChart({ agent }: { agent: AgentType }) {
  const { colors } = useColors();
  const [timeframe, setTimeframe] = useState<TimeframeOption>("24h");

  const { datasets, isLoading, error } = useChartData({
    sources: [
      {
        type: "agentAccountValue",
        agentId: agent.id,
        label: "Account Value",
        color: colors.success,
      },
      {
        type: "sentiment",
        agentId: agent.id,
        label: "Sentiment",
        color: colors.accent,
      },
      {
        type: "candleHistory",
        ticker: "BTC",
        key: "close",
        label: "BTC",
        color: "#f7931a",
      },
    ],
    timeRange: {
      startTime: Date.now() - TIMEFRAME_DURATIONS[timeframe],
      endTime: Date.now(),
    },
  });

  // Separate datasets by type for different axes
  const accountDataset = datasets.find((d) => d.sourceType === "agentAccountValue");
  const sentimentDataset = datasets.find((d) => d.sourceType === "sentiment");
  const btcDataset = datasets.find((d) => d.sourceType === "candleHistory");

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View style={{ padding: 16 }}>
      {/* Render each dataset in its own chart for separate axes */}
      {sentimentDataset && (
        <View style={{ marginBottom: 24 }}>
          <Text variant="sm" style={{ marginBottom: 8, fontWeight: "600" }}>
            {sentimentDataset.label}
          </Text>
          <LineChart
            data={sentimentDataset.data.map((p) => ({ value: p.value }))}
            color={sentimentDataset.color}
            height={120}
            curved
            maxValue={1}
            mostNegativeValue={-1}
          />
        </View>
      )}

      {accountDataset && (
        <View style={{ marginBottom: 24 }}>
          <Text variant="sm" style={{ marginBottom: 8, fontWeight: "600" }}>
            {accountDataset.label}
          </Text>
          <LineChart
            data={accountDataset.data.map((p) => ({ value: p.value }))}
            color={accountDataset.color}
            height={120}
            curved
            yAxisLabelSuffix="%"
          />
        </View>
      )}

      {btcDataset && (
        <View style={{ marginBottom: 24 }}>
          <Text variant="sm" style={{ marginBottom: 8, fontWeight: "600" }}>
            {btcDataset.label}
          </Text>
          <LineChart
            data={btcDataset.data.map((p) => ({ value: p.value }))}
            color={btcDataset.color}
            height={120}
            curved
            yAxisLabelSuffix="%"
          />
        </View>
      )}
    </View>
  );
}
