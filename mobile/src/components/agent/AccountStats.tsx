import { View } from "@/components/ui";
import LabelValue, { FormattedValueLabel } from "@/components/ui/LabelValue";
import { useAccountBalance } from "@/hooks/useAccountBalance";
import { AgentType } from "@/types/agent";
import { formatPercent } from "@/utils/currency";
import { ViewStyle } from "react-native";

export function StatsAbbreviated({
  agent,
  style = {},
}: {
  agent: AgentType;
  style?: ViewStyle;

}) {
  const tradingAccountType = agent.simulate ? "paper" : "real";
  const tradingAccount = agent?.trading_accounts?.find((ta) => ta.type === tradingAccountType);
  const accountData = useAccountBalance({userId: tradingAccount?.hyperliquid_address || ""});

  return (
    <View style={[
      {
        flexDirection: 'row',
        gap: 12,
      },
    ]}>
      <LabelValue
        label="Open P&L"
        value={accountData.openPnlPct}
        textVariant="xs"
        valueTextVariant="xs"
        colorize
        formatter={formatPercent}
        alignRight
      >
      </LabelValue>
      <LabelValue
        label="All P&L"
        value={(accountData.openPnlPct)}
        textVariant="xs"
        valueTextVariant="xs"
        colorize
        formatter={formatPercent}
        alignRight
      >
      </LabelValue>
    </View>
  );
}
