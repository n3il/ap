import { Text, View } from "@/components/ui";
import LabelValue, { FormattedValueLabel } from "@/components/ui/LabelValue";
import { useAccountBalanceNew } from "@/hooks/useAccountBalanceNew";
import { AgentType } from "@/types/agent";
import { formatPercent } from "@/utils/currency";

export function StatsAbbreviated({
  agent,
  style = {},
}: {
  agent: AgentType;
  style?: StyleProp<ViewStyle>;
}) {
  const tradingAccountType = agent.simulate ? "paper" : "real";
  const tradingAccount = agent?.trading_accounts?.find((ta) => ta.type === tradingAccountType);
  const accountData = useAccountBalanceNew({userId: tradingAccount?.hyperliquid_address || ""});

  return (
    <View sx={style}>
      <LabelValue
        label="Open P&L"
        value={accountData.openPnl}
        orientation="horizontal"
        textVariant="xs"
        valueTextVariant="xs"
      />
      <LabelValue
        label="Positions"
        value={accountData.openPositions.length}
        orientation="horizontal"
        textVariant="xs"
        valueTextVariant="xs"
      />
    </View>
  );
}

export function StatsAsTicker({ agentId }: { agentId: string }) {
  const accountData = useAccountBalance(agentId, true);

  return (
    <View
      sx={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <LabelValue
        label="AUM"
        value={
          accountData.equity +
          accountData.realizedPnl +
          accountData.unrealizedPnl
        }
        orientation="horizontal"
        textVariant="xs"
        valueTextVariant="xs"
      />
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
  );
}
