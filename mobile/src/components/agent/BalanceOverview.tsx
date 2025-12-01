import { Text, View } from "@/components/ui";
import LabelValue from "@/components/ui/LabelValue";
import { useAccountBalance } from "@/hooks/useAccountBalance";
import { formatAmount, formatDecimal, formatPercent } from "@/utils/currency";

export default function BalanceOverview({
  agentId,
  hideOpenPositions = false,
}) {
  const accountData = useAccountBalance(agentId, hideOpenPositions);

  return (
    <View sx={{ gap: 4 }}>
      {/* Header: Account Equity */}
      <View sx={{ gap: 2 }}>
        <View sx={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          <Text variant="xs" tone="muted" sx={{}}>
            AUM
          </Text>
        </View>
        <Text variant="xl" sx={{ fontWeight: "600", fontFamily: "monospace" }}>
          {formatAmount(accountData.equity)}
        </Text>


      </View>

      <View
        sx={{ flexDirection: "row", justifyContent: "space-between", gap: 4 }}
      >
        <View sx={{ flex: 1 }}>
          <LabelValue label="Initial" value={accountData.wallet || 0} />
        </View>
        <View sx={{ flex: 1 }}>
          <LabelValue
            label="# Trades"
            value={accountData.enrichedPositions.length}
            alignRight
          />
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
              {`(${accountData.unrealizedPnlPercent ? formatPercent(accountData.unrealizedPnlPercent) : '-'})`}
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
            label="7 day ROI"
            value={accountData.leverageRatio}
            alignRight
            formatter={formatDecimal}
          />
        </View>
      </View>
    </View>
  );
}
