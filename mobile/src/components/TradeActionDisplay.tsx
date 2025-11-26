import { StatusBadge, Text, TouchableOpacity, View } from "@/components/ui";
import { useColors } from "@/theme";
import { formatAmount } from "@/utils/currency";

const _asNumber = (value) => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : undefined;
};

type TradeActionType = {
  action: string;
  asset: string;
  confidenceScore: number;
  entry: number;
  leverage: number;
  reasoning: string;
  size: number;
  stopLoss: number;
  takeProfit: number;
  tradeId: string;
};

function getActionMeta(actionType, palette) {
  switch (actionType) {
    case "CLOSE_LONG":
      return {
        icon: "close-circle",
        label: "Close Long",
        color: palette.long,
        variant: "long",
      };

    case "CLOSE_SHORT":
      return {
        icon: "close-circle",
        label: "Close Short",
        color: palette.short,
        variant: "short",
      };

    case "OPEN_LONG":
      return {
        icon: "trending-up",
        label: "Open Long",
        color: palette.long,
        variant: "long",
      };

    case "OPEN_SHORT":
      return {
        icon: "trending-down",
        label: "Open Short",
        color: palette.short,
        variant: "short",
      };

    default:
      return {
        icon: "minus",
        label: "No Action",
        color: palette.long,
        variant: "neutral",
      };
  }
}

export default function TradeActionDisplay({
  actionData: {
    action,
    asset,
    confidenceScore,
    entry,
    leverage,
    reasoning,
    size,
    stopLoss,
    takeProfit,
    tradeId,
  },
  showReason = true,
}: {
  actionData: TradeActionType;
  showReason?: boolean;
}) {
  const { colors: palette } = useColors();
  const config = getActionMeta(action, palette);

  return (
    <View
      sx={{
        borderBottomWidth: 1,
        borderColor: palette.border,
        paddingVertical: 2,
      }}
    >
      <TouchableOpacity activeOpacity={0.7}>
        <View
          sx={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text variant="sm" sx={{ fontSize: 12, fontWeight: "400" }}>
            {asset.replace("-PERP", "") || "N/A"}
          </Text>

          <View
            sx={{
              flexGrow: 0,
              flexDirection: "row",
              alignItems: "center",
              gap: 2,
            }}
          >
            {(size !== undefined || leverage !== undefined) && (
              <View sx={{ flexDirection: "row", gap: 2 }}>
                {size !== undefined && (
                  <Text variant="xs" tone="muted">
                    {formatAmount(size)}
                  </Text>
                )}
                {leverage !== undefined && (
                  <Text variant="xs" sx={{ fontWeight: "500" }}>
                    {`${leverage}x`}
                  </Text>
                )}
              </View>
            )}

            <StatusBadge variant={config.variant}>{config.label}</StatusBadge>
          </View>
        </View>
      </TouchableOpacity>

      <View sx={{ marginTop: 2, borderTopWidth: 1 }}>
        <Text
          variant="sm"
          sx={{ lineHeight: 14, fontSize: 10, fontWeight: 300 }}
        >
          {reasoning || "-"}
        </Text>
      </View>
    </View>
  );
}
