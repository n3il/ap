import { useQuery } from "@tanstack/react-query";
import { ruleTypes } from "gifted-charts-core";
import { useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { LineChart, LineChartBicolor } from "react-native-gifted-charts";
import { Dimensions, Text, View } from "@/components/ui";
import { useAgentAccountValueHistories } from "@/hooks/useAgentAccountValueHistories";
import { assessmentService } from "@/services/assessmentService";
import { useCandleHistory } from "@/services/marketHistoryService";
import {
  TIMEFRAME_CONFIG,
  TIMEFRAME_OPTIONS,
} from "@/stores/useTimeframeStore";
import { useColors } from "@/theme";
import type { AgentType } from "@/types/agent";
import { createTimeNormalizer, normalizeDataSeries } from "@/utils/chartUtils";
import { GLOBAL_PADDING } from "../ContainerView";

const { width } = Dimensions.get("window");

type TimeframeOption = "1h" | "24h" | "7d" | "1M" | "Alltime";

type ChartDataPoint = {
  value: number;
  label?: string;
};

export default function AgentDetailsChart({ agent }: { agent: AgentType }) {
  const { colors, withOpacity } = useColors();
  const [timeframe, setTimeframe] = useState<TimeframeOption>("24h");

  // Fetch sentiment scores
  const { data: sentimentData = [] } = useQuery({
    queryKey: ["sentimentScores", agent.id, timeframe],
    queryFn: () =>
      assessmentService.getSentimentScores(agent.id, {
        timeframe,
        limit: 200,
      }),
    enabled: !!agent.id,
  });

  // Fetch account value histories
  const { histories, isLoading: accountHistoriesLoading } =
    useAgentAccountValueHistories(timeframe);
  const agentHistory = histories[agent.id];

  // Fetch BTC candle data
  const { data: btcCandleData = {}, isLoading: btcLoading } = useCandleHistory(
    "BTC",
    timeframe,
  );

  // Process account value history for the selected timeframe
  const accountValueData = useMemo(() => {
    if (!agentHistory?.histories?.[timeframe]) return [];
    return agentHistory.histories[timeframe].map((point) => ({
      timestamp: point.timestamp,
      value: point.value,
    }));
  }, [agentHistory, timeframe]);

  // Process BTC candle data
  const btcPriceData = useMemo(() => {
    const btcCandles = btcCandleData["BTC"] || [];
    if (!btcCandles.length) return [];

    return btcCandles.map((candle) => ({
      timestamp: candle.timestamp,
      closePrice: candle.close,
    }));
  }, [btcCandleData]);

  // Normalize BTC prices to percentage change from first value
  const btcPercentageData = useMemo(() => {
    if (!btcPriceData.length) return [];
    const firstPrice = btcPriceData[0].closePrice;
    if (firstPrice === 0) return [];

    return btcPriceData.map((point) => ({
      timestamp: point.timestamp,
      percentChange: ((point.closePrice - firstPrice) / firstPrice) * 100,
    }));
  }, [btcPriceData]);

  // Create time normalizer with all data sources
  const { normalizeTimestamp, hasData } = useMemo(() => {
    const allSeries = [
      sentimentData.map((d) => ({ timestamp: d.created_at })),
      accountValueData,
      btcPercentageData,
    ];
    return createTimeNormalizer(allSeries, "timestamp");
  }, [sentimentData, accountValueData, btcPercentageData]);

  // Normalize sentiment data
  const normalizedSentiment = useMemo(() => {
    if (!sentimentData.length || !hasData) return [];
    return normalizeDataSeries(
      sentimentData,
      normalizeTimestamp,
      "created_at",
      "sentiment_score",
    );
  }, [sentimentData, normalizeTimestamp, hasData]);

  // Normalize account value data (convert to percentage change)
  const normalizedAccountValue = useMemo(() => {
    if (!accountValueData.length || !hasData) return [];

    const firstValue = accountValueData[0]?.value || 0;
    if (firstValue === 0) return [];

    const percentageData = accountValueData.map((point) => ({
      timestamp: point.timestamp,
      percentChange: ((point.value - firstValue) / firstValue) * 100,
    }));

    return normalizeDataSeries(
      percentageData,
      normalizeTimestamp,
      "timestamp",
      "percentChange",
    );
  }, [accountValueData, normalizeTimestamp, hasData]);

  // Normalize BTC percentage data
  const normalizedBTC = useMemo(() => {
    if (!btcPercentageData.length || !hasData) return [];
    return normalizeDataSeries(
      btcPercentageData,
      normalizeTimestamp,
      "timestamp",
      "percentChange",
    );
  }, [btcPercentageData, normalizeTimestamp, hasData]);

  // Convert normalized data to chart format
  const sentimentChartData: ChartDataPoint[] = useMemo(
    () => normalizedSentiment.map((point) => ({ value: point.value })),
    [normalizedSentiment],
  );

  const accountValueChartData: ChartDataPoint[] = useMemo(
    () => normalizedAccountValue.map((point) => ({ value: point.value })),
    [normalizedAccountValue],
  );

  const btcChartData: ChartDataPoint[] = useMemo(
    () => normalizedBTC.map((point) => ({ value: point.value })),
    [normalizedBTC],
  );

  const isLoading = accountHistoriesLoading || btcLoading;

  // Common chart properties
  const chartWidth = width - 80;
  const chartHeight = 120;

  const commonChartProps = {
    height: chartHeight,
    width: chartWidth,
    curved: true,
    hideDataPoints: true,
    thickness: 2,
    adjustToWidth: true,
    showVerticalLines: true,
    verticalLinesColor: withOpacity(colors.foreground, 0.05),
    xAxisThickness: 0.5,
    xAxisColor: withOpacity(colors.foreground, 0.3),
    yAxisThickness: 0.5,
    yAxisColor: withOpacity(colors.foreground, 0.5),
    yAxisTextStyle: {
      color: colors.foreground,
      fontSize: 9,
    },
    xAxisLabelTextStyle: {
      color: colors.foreground,
      fontSize: 9,
    },
    rulesType: ruleTypes.SOLID,
    rulesColor: withOpacity(colors.foreground, 0.1),
    rulesThickness: 0.5,
    initialSpacing: 10,
    endSpacing: 10,
    animateOnDataChange: true,
    animationDuration: 300,
    noOfSections: 4,
  };

  const renderChart = (
    data: ChartDataPoint[],
    color: string,
    label: string,
    suffix: string = "",
  ) => {
    if (data.length === 0) {
      return (
        <View
          style={{
            height: chartHeight,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: withOpacity(colors.surface, 0.3),
            borderRadius: 8,
          }}
        >
          <Text variant="xs" style={{ color: colors.foreground }}>
            No {label} data
          </Text>
        </View>
      );
    }

    return (
      <LineChart
        data={data}
        color={color}
        {...commonChartProps}
        yAxisLabelSuffix={suffix}
        showReferenceLine1
        referenceLine1Position={0}
        referenceLine1Config={{
          color: withOpacity(colors.foreground, 0.3),
          thickness: 1,
          dashWidth: 2,
          dashGap: 2,
        }}
      />
    );
  };

  const renderSentimentChart = (data: ChartDataPoint[]) => {
    if (data.length === 0) {
      return (
        <View
          style={{
            height: chartHeight,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: withOpacity(colors.surface, 0.3),
            borderRadius: 8,
          }}
        >
          <Text variant="xs" style={{ color: colors.foreground }}>
            No sentiment data
          </Text>
        </View>
      );
    }

    return (
      <LineChartBicolor
        data={data}
        color={colors.success}
        colorNegative={colors.error}
        {...commonChartProps}
        maxValue={1}
        mostNegativeValue={-1}
        noOfSections={4}
        noOfSectionsBelowXAxis={4}
        showReferenceLine1
        referenceLine1Position={0}
        referenceLine1Config={{
          color: withOpacity(colors.foreground, 0.3),
          thickness: 1,
          dashWidth: 2,
          dashGap: 2,
        }}
      />
    );
  };

  return (
    <View
      style={{
        flex: 1,
        paddingBottom: "60%",
        backgroundColor: colors.backgroundSecondary,
      }}
      // contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      {/* Timeframe selector */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
          paddingHorizontal: GLOBAL_PADDING,
        }}
      >
        {TIMEFRAME_OPTIONS.filter((opt) =>
          ["1h", "24h", "7d", "1M", "Alltime"].includes(opt.id),
        ).map((option) => (
          <View
            key={option.id}
            onTouchEnd={() => setTimeframe(option.id as TimeframeOption)}
          >
            <Text
              variant="xs"
              style={{
                color:
                  timeframe === option.id ? colors.accent : colors.foreground,
                fontWeight: timeframe === option.id ? "bold" : "normal",
              }}
            >
              {option.label}
            </Text>
          </View>
        ))}
      </View>

      {isLoading ? (
        <View
          style={{
            height: 400,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.foreground }}>Loading...</Text>
        </View>
      ) : (
        <View style={{ gap: 24 }}>
          {/* Sentiment Chart */}
          <View
            style={{
              backgroundColor: withOpacity(colors.surface, 0.3),
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <View
                  style={{
                    width: 10,
                    height: 3,
                    backgroundColor: colors.success,
                    borderRadius: 2,
                  }}
                />
                <Text variant="xs" style={{ color: colors.foreground }}>
                  +
                </Text>
                <View
                  style={{
                    width: 10,
                    height: 3,
                    backgroundColor: colors.error,
                    borderRadius: 2,
                  }}
                />
                <Text variant="xs" style={{ color: colors.foreground }}>
                  -
                </Text>
              </View>
              <Text
                variant="sm"
                style={{
                  color: colors.foreground,
                  fontWeight: "600",
                }}
              >
                Sentiment Score
              </Text>
            </View>
            {renderSentimentChart(sentimentChartData)}
          </View>

          {/* Account Value Chart */}
          <View
            style={{
              backgroundColor: withOpacity(colors.surface, 0.3),
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 3,
                  backgroundColor: colors.success,
                  borderRadius: 2,
                }}
              />
              <Text
                variant="sm"
                style={{
                  color: colors.foreground,
                  fontWeight: "600",
                }}
              >
                Account Value Change
              </Text>
            </View>
            {renderChart(
              accountValueChartData,
              colors.success,
              "account value",
              "%",
            )}
          </View>

          {/* BTC Price Chart */}
          <View
            style={{
              backgroundColor: withOpacity(colors.surface, 0.3),
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 3,
                  backgroundColor: colors.primary,
                  borderRadius: 2,
                }}
              />
              <Text
                variant="sm"
                style={{
                  color: colors.foreground,
                  fontWeight: "600",
                }}
              >
                BTC Price Change
              </Text>
            </View>
            {renderChart(btcChartData, colors.primary, "BTC price", "%")}
          </View>
        </View>
      )}
    </View>
  );
}
