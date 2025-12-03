import { Text, View } from "@/components/ui";
import LabelValue from "@/components/ui/LabelValue";
import { useAccountBalance } from "@/hooks/useAccountBalance";
import { useAccountBalanceNew } from "@/hooks/useAccountBalanceNew";
import { AgentType } from "@/types/agent";
import { formatAmount, formatDecimal, formatPercent } from "@/utils/currency";

export default function BalanceOverview({
  agent,
}: {
  agent: AgentType;
}) {
  console.log({ a: agent?.trading_accounts })
  const tradingAccountType = agent.simulate ? "paper" : "real";
  const tradingAccount = agent?.trading_accounts?.find((ta) => ta.type === tradingAccountType);
  const accountData = useAccountBalanceNew({userId: tradingAccount?.hyperliquid_address || ""});

  return (
    <View sx={{ gap: 4 }}>
      {/* Header: Account Equity */}

      <View sx={{ flexDirection: "row", gap: 2, justifyContent: "space-between" }}>

        <View sx={{ flexDirection: "column", gap: 2, marginRight: 4 }}>
          <View sx={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Text variant="xs" tone="muted" sx={{}}>
              Open P&L
            </Text>
          </View>
          <Text variant="xl" sx={{ fontWeight: "600", fontFamily: "monospace" }}>
            {formatAmount(accountData.realizedPnl + accountData.unrealizedPnl)}
          </Text>
        </View>

      <View sx={{ flex: 1, flexDirection: "row", gap: 2, justifyContent: "space-evenly" }}>

        <LabelValue
          label="1h P&L"
          value={accountData.openPositions.length}
        />
        <LabelValue
          label="24h P&L"
          value={accountData.openPositions.length}
        />
        <LabelValue
          label="7d P&L"
          value={23.3}
          formatter={formatPercent}
          colorize
        />
        <LabelValue
          label="All P&L"
          value={accountData.unrealizedPnl}
        />
      </View>
      </View>

      <View
        sx={{ flexDirection: "row", justifyContent: "space-between", gap: 4 }}
      >
        <View sx={{ flex: 1 }}>
          <LabelValue label="Account Value" value={accountData.equity || 0} />
        </View>
        <View sx={{ flex: 1 }}>
          <LabelValue
            label="Active Positions"
            value={accountData.openPositions.length}
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
