import { Pressable } from "react-native";
import { Text, View } from "@/components/ui";
import LabelValue, { FormattedValueLabel } from "@/components/ui/LabelValue";
import { useAccountBalance } from "@/hooks/useAccountBalance";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { useColors } from "@/theme";
import type { AgentType } from "@/types/agent";
import { formatPercent } from "@/utils/currency";

// Standardizing the keys to match the processHyperliquidData output
const accountBalanceTimeframes: Record<string, { id: string; label: string }> = {
  perpDay: { id: "1D", label: "1D" },
  perpWeek: { id: "1W", label: "1W" },
  perpMonth: { id: "1M", label: "1M" },
  allTime: { id: "All", label: "All" },
};

export default function BalanceOverview({ agent }: { agent: AgentType }) {
  const { colors: palette } = useColors();
  const accountData = useAccountBalance({ agent });
  const { setTimeframe } = useTimeframeStore();

  // Helper to access PnL safely
  const getAllTimePnl = () => accountData.pnlHistory.allTime?.pnl ?? 0;
  const getAllTimePct = () => accountData.pnlHistory.allTime?.pnlPct ?? 0;

  return (
    <View
      sx={{
        gap: 4,
        backgroundColor: palette.surfaceLight,
        padding: 3,
        borderWidth: 1.5,
        borderRadius: 12,
      }}
    >
      {/* Top Section: Open P&L and Timeframe Badges */}
      <View sx={{ flexDirection: "row", gap: 2, justifyContent: "space-between" }}>
        <View sx={{ flexDirection: "column", gap: 2, marginRight: 4 }}>
          <Text variant="xs" tone="muted" sx={{ color: "surfaceForeground", opacity: 0.7 }}>
            Open P&L
          </Text>
          <FormattedValueLabel
            value={accountData.totalOpenPnl} // Updated from openPnl
            valueTextVariant="xl"
            sx={{ fontWeight: "600", fontFamily: "monospace" }}
            showSign
          />
        </View>

        <View sx={{ flexShrink: 1, flexDirection: "row", gap: 8, justifyContent: "space-evenly", marginLeft: "auto" }}>
          {Object.entries(accountData.pnlHistory)
            .filter(([key]) => key.includes("perp"))
            .map(([key, timeframeData]) => {
              const timeframeOpt = accountBalanceTimeframes[key];
              if (!timeframeOpt || !timeframeData) return null;

              return (
                <Pressable key={timeframeOpt.id} onPress={() => setTimeframe(timeframeOpt.id)}>
                  <LabelValue
                    label={`${timeframeOpt.label} P&L`}
                    value={timeframeData.pnlPct}
                    formatter={formatPercent}
                    alignRight
                  />
                </Pressable>
              );
            })}

          <Pressable onPress={() => setTimeframe("All")}>
            <LabelValue
              label={`All P&L`}
              value={getAllTimePct()}
              formatter={formatPercent}
              alignRight
            />
          </Pressable>
        </View>
      </View>

      {/* Row 1: Equity (Balance) and Open P&L with Percent */}
      <View sx={{ flexDirection: "row", justifyContent: "space-between", gap: 4 }}>
        <View sx={{ flex: 1 }}>
          <LabelValue label="Balance" value={accountData.equity} />
        </View>

        <View sx={{ flex: 1 }}>
          <LabelValue
            label="Open P&L"
            value={accountData.totalOpenPnl}
            colorize
            alignRight
          >
            <Text
              variant="sm"
              sx={{
                color: accountData.totalOpenPnl > 0 ? "success" : accountData.totalOpenPnl < 0 ? "error" : "surfaceForeground",
              }}
            >
              {/* Calculating Open P&L % vs Equity */}
              {`(${accountData.equity > 0 ? formatPercent((accountData.totalOpenPnl / accountData.equity) * 100) : "-"})`}
            </Text>
          </LabelValue>
        </View>
      </View>

      {/* Row 2: Positions Value and All-Time P&L Breakdown */}
      <View sx={{ flexDirection: "row", justifyContent: "space-between", gap: 4 }}>
        <View sx={{ flex: 1 }}>
          <LabelValue
            label="Positions Value"
            // Summing notional value from margin summary
            value={accountData.marginSummary?.totalNtlPos ?? 0}
          />
        </View>
        <View sx={{ flex: 1 }}>
          <LabelValue
            label="All P&L"
            value={getAllTimePnl()}
            colorize
            alignRight
          >
            <Text
              variant="sm"
              sx={{
                color: getAllTimePnl() > 0 ? "success" : getAllTimePnl() < 0 ? "error" : "surfaceForeground",
              }}
            >
              {`(${formatPercent(getAllTimePct())})`}
            </Text>
          </LabelValue>
        </View>
      </View>
    </View>
  );
}