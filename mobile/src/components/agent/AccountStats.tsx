import { View } from "@/components/ui";
import LabelValue from "@/components/ui/LabelValue";
import { useAccountBalance } from "@/hooks/useAccountBalance";
import { AgentType } from "@/types/agent";
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
    <View style={style}>
      <LabelValue
        label="Open P&L"
        value={accountData.openPnl}
        orientation="horizontal"
        textVariant="xs"
        colorize
        valueTextVariant="xs"
      />
    </View>
  );
}
