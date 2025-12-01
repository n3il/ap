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


type TradeSummaryProps = {
  tradeActions?: TradeActionType[];
};

export function TradeSummary({ tradeActions = [] }: TradeSummaryProps) {
  const { colors: palette } = useColors();

  if (!tradeActions.length) {
    return (
      <View sx={{ paddingVertical: 2 }}>
        <Text variant="xs" tone="muted">
          No trade actions generated
        </Text>
      </View>
    );
  }

  const openActions = tradeActions.filter((action) => action.type === "OPEN");
  const closeActions = tradeActions.filter((action) => action.type === "CLOSE");

  const openedLongs = openActions.filter(
    (action) => action.type === "OPEN" && action.direction === "LONG",
  ).length;
  const openedShorts = openActions.filter(
    (action) => action.type === "OPEN" && action.direction === "SHORT",
  ).length;
  const closedPositions = closeActions.length;

  const totalOpenNotional = openActions.reduce((acc, action) => {
    const amount = _asNumber((action as any).trade_amount);
    return acc + (amount ?? 0);
  }, 0);

  const parts: string[] = [];
  if (openedLongs) {
    parts.push(`Opened ${openedLongs} long${openedLongs > 1 ? "s" : ""}`);
  }
  if (openedShorts) {
    parts.push(`Opened ${openedShorts} short${openedShorts > 1 ? "s" : ""}`);
  }
  if (closedPositions) {
    parts.push(`Closed ${closedPositions} position${closedPositions > 1 ? "s" : ""}`);
  }
  if (totalOpenNotional > 0) {
    parts.push(`~${formatAmount(totalOpenNotional)} notional`);
  }
  if (!parts.length) {
    parts.push("Trade plan generated");
  }

  return (
    <View sx={{ paddingVertical: 2 }}>
      <Text
        variant="xs"
        sx={{
          color: palette.muted?.foreground ?? palette.mutedForeground,
          fontWeight: "500",
        }}
      >
        {parts.join(" · ")}
      </Text>
    </View>
  );
}
