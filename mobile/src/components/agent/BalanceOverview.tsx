import { Text, View } from "@/components/ui";
import LabelValue from "@/components/ui/LabelValue";
import { useAccountBalance } from "@/hooks/useAccountBalance";
import { formatAmount, formatPercent } from "@/utils/currency";

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

        {/* Total P&L */}
        <View sx={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          <Text variant="xs" tone="muted">
            All-Time P&L
          </Text>
          <Text
            variant="sm"
            sx={{
              color:
                accountData.totalPnl > 0
                  ? "success"
                  : accountData.totalPnl < 0
                    ? "error"
                    : "foreground",
            }}
          >
            {`${formatAmount(accountData.totalPnl)} (${formatAmount(accountData.totalPnlPercent, { showSign: true })}%)`}
          </Text>
        </View>
      </View>

      <View
        sx={{ flexDirection: "row", justifyContent: "space-between", gap: 4 }}
      >
        <View sx={{ flex: 1 }}>
          <LabelValue label="Init. Capital" value={accountData.wallet || 0} />
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
            label="Res. Capital"
            value={accountData.availableMargin || 0}
          />
        </View>
        <View sx={{ flex: 1 }}>
          <LabelValue
            label="Lev."
            value={accountData.leverageRatio?.toFixed(2) || "-"}
            alignRight
            formatter={(l) => l}
          />
        </View>
      </View>
    </View>
  );
}
