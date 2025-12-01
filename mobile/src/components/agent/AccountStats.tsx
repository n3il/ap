import { Text, View } from "@/components/ui";
import LabelValue from "@/components/ui/LabelValue";
import { useAccountBalance } from "@/hooks/useAccountBalance";
import { formatAmount, formatPercent } from "@/utils/currency";


export function StatsAbbreviated({
  agentId,
}: {
  agentId: string;
}) {
  const accountData = useAccountBalance(agentId, true);

  return (
    <View sx={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between", gap: 2
    }}>


    </View>
  );
}




export function StatsAsTicker({
  agentId,
}: {
  agentId: string;
}) {
  const accountData = useAccountBalance(agentId, true);

  return (
    <View sx={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between", gap: 2
    }}>
      <LabelValue
        label="AUM"
        value={accountData.equity + accountData.realizedPnl + accountData.unrealizedPnl}
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
            {`(${accountData.unrealizedPnlPercent ? formatPercent(accountData.unrealizedPnlPercent) : '-'})`}
          </Text>
        </LabelValue>
      </View>
    </View>
  );
}
