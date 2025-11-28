import { StatusBadge, Text, TouchableOpacity, View } from "@/components/ui";
import { useColors } from "@/theme";
import { formatAmount } from "@/utils/currency";

const _asNumber = (value) => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : undefined;
};

type TradeActionType =
  | {
      type: "OPEN";
      asset: string;
      direction: "LONG" | "SHORT";
      trade_amount: number;
      leverage: number;
      limit_price?: number;
      target_price?: number;
      stop_loss?: number;
      reason: string;
      confidenceScore?: number;
    }
  | {
      type: "CLOSE";
      asset: string;
      position_id: string;
      exit_limit_price?: number;
      reason: string;
      confidenceScore?: number;
    };

function getActionMeta(action: TradeActionType, palette) {
  if (action.type === "OPEN") {
    return action.direction === "LONG"
      ? {
          icon: "trending-up",
          label: "Open Long",
          color: palette.long,
          variant: "long",
        }
      : {
          icon: "trending-down",
          label: "Open Short",
          color: palette.short,
          variant: "short",
        };
  }

  return {
    icon: "close-circle",
    label: "Close Position",
    color: palette.long,
    variant: "neutral",
  };
}

export default function TradeActionDisplay({
  actionData,
  showReason = true,
}: {
  actionData: TradeActionType;
  showReason?: boolean;
}) {
  const { colors: palette } = useColors();
  const config = getActionMeta(actionData, palette);
  const { type, asset, confidenceScore, leverage, reason, trade_amount } =
    actionData as any;

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
            {(trade_amount !== undefined || leverage !== undefined) && (
              <View sx={{ flexDirection: "row", gap: 2 }}>
                {trade_amount !== undefined && (
                  <Text variant="xs" tone="muted">
                    {formatAmount(trade_amount)}
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
          {reason || "-"}
        </Text>
      </View>
    </View>
  );
}
