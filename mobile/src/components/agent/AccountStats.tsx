import { View } from "@/components/ui";
import LabelValue, { FormattedValueLabel } from "@/components/ui/LabelValue";
import { useAccountBalance } from "@/hooks/useAccountBalance";
import { AgentType } from "@/types/agent";
import { formatPercent } from "@/utils/currency";
import { ViewStyle } from "react-native";

export default function AccountStats({
  agent,
  style = {},
}: {
  agent: AgentType;
  style?: ViewStyle;
}) {
  const accountData = useAccountBalance({ agent });
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
        value={accountData.totalPnlPercent}
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
