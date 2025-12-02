import { Text, View } from "@/components/ui";
import LabelValue, { FormattedValueLabel } from "@/components/ui/LabelValue";
import { useAccountBalance } from "@/hooks/useAccountBalance";
import { formatPercent } from "@/utils/currency";

export function StatsAbbreviated({
  agentId,
  style = {},
}: {
  agentId: string;
  style?: StyleProp<ViewStyle>;
}) {
  const accountData = useAccountBalance(agentId, true);

  return (
    <View sx={style}>
      <View
        sx={{
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        <View
          sx={{
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "flex-end",
            gap: 2,
            marginLeft: "auto",
          }}
        >
          <FormattedValueLabel
            value={accountData.unrealizedPnl || 0}
            colorize
            showSign
            valueTextVariant="xs"
            formatter={formatPercent}
          />
          <FormattedValueLabel
            value={accountData.unrealizedPnl || 0}
            colorize
            showSign
            valueTextVariant="xs"
            formatter={formatPercent}
          />
        </View>

        <Text
          variant={"xs"}
          tone="muted"
          sx={{
            fontFamily: "monospace",
          }}
        >
          Open P&L
        </Text>
      </View>
      <LabelValue
        label=""
        value={
          accountData.equity +
          accountData.realizedPnl +
          accountData.unrealizedPnl
        }
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
