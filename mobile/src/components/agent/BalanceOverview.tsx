import { Text, View } from "@/components/ui";
import LabelValue, { FormattedValueLabel } from "@/components/ui/LabelValue";
import { useAccountBalanceNew } from "@/hooks/useAccountBalanceNew";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { useColors } from "@/theme";
import { AgentType } from "@/types/agent";
import { formatPercent } from "@/utils/currency";
import { Pressable } from "react-native";

const accountBalanceTimeframes = {
  day: { id: "1D", label: "1D" },
  week: { id: "1W", label: "1W" },
  month: { id: "1M", label: "1M" },
  alltime: { id: "All", label: "All" },
}

export default function BalanceOverview({
  agent,
}: {
  agent: AgentType;
}) {
  const { colors: palette } = useColors();
  const tradingAccountType = agent?.simulate ? "paper" : "real";
  const tradingAccount = agent?.trading_accounts?.find((ta) => ta.type === tradingAccountType);
  const accountData = useAccountBalanceNew({userId: tradingAccount?.hyperliquid_address || ""});
  const { setTimeframe } = useTimeframeStore();

  return (
    <View sx={{
      gap: 4,
      backgroundColor: palette.surface,
      padding: 3,
      borderWidth: 1.5,
      borderRadius: 4
      }}>
      <View sx={{ flexDirection: "row", gap: 2, justifyContent: "space-between" }}>
        <View sx={{ flexDirection: "column", gap: 2, marginRight: 4 }}>
          <View sx={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Text variant="xs" tone="muted" sx={{}}>
              Open P&L
            </Text>
          </View>
          <FormattedValueLabel
            value={accountData.openPnl}
            valueTextVariant="xl"
            sx={{ fontWeight: "600", fontFamily: "monospace" }}
            showSign
          />
        </View>

        <View sx={{ flex: 1, flexDirection: "row", gap: 2, justifyContent: "space-evenly" }}>
          {Object.keys(accountData.accountValueHistory).filter(tf => tf.includes('perp')).map((timeframe) => {
            const { pnlPct } = accountData.accountValueHistory[timeframe];
            const timeframeOpt = accountBalanceTimeframes[
              timeframe.replace('perp', '').toLowerCase()
            ]
            if (!timeframeOpt) return null;

            return (
              <Pressable key={timeframeOpt.id} onPress={() => setTimeframe(timeframeOpt.id)}>
                <LabelValue
                  label={`${timeframeOpt.label || timeframe} P&L`}
                  value={pnlPct}
                  formatter={formatPercent}
                  alignRight
                />
              </Pressable>
            )
          })}
        </View>
      </View>

      <View
        sx={{ flexDirection: "row", justifyContent: "space-between", gap: 4 }}
      >
        <View sx={{ flex: 1 }}>
          <LabelValue label="Account Value" value={accountData.equity || 0} />
        </View>

        {/* <View sx={{ flex: 1 }}>
          <LabelValue
            label="Win Trades"
            value={null}
            alignRight
          />
        </View> */}
        <View sx={{ flex: 1 }}>
          <LabelValue
            label="Open P&L"
            value={accountData.unrealizedPnl || 0}
            colorize
            alignRight
          >
            <Text
              variant="sm"
              sx={{
                color:
                  accountData.unrealizedPnl > 0
                    ? "success"
                    : accountData.unrealizedPnl < 0
                      ? "error"
                      : "foreground",
              }}
            >
              {`(${accountData.unrealizedPnlPercent ? formatPercent(accountData.unrealizedPnlPercent) : "-"})`}
            </Text>
          </LabelValue>
        </View>
      </View>

      <View
        sx={{ flexDirection: "row", justifyContent: "space-between", gap: 4 }}
      >
        <View sx={{ flex: 1 }}>
          <LabelValue
            label="Mkt. Value"
            value={accountData.equity - accountData.availableMargin || 0}
          />
        </View>
        <View sx={{ flex: 1 }}>
          <LabelValue
            label="Active Positions"
            value={accountData.openPositions.length}
            alignRight
            formatter={o => o}
          />
        </View>
      </View>
    </View>
  );
}
