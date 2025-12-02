import { StatusBadge, Text, TouchableOpacity, View } from "@/components/ui";
import { useColors } from "@/theme";
import { formatAmount } from "@/utils/currency";

const _asNumber = (value) => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : undefined;
};

type OpenTradeAction = {
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
  action: string;
};

type CloseTradeAction = {
  type: "CLOSE";
  asset: string;
  position_id: string;
  exit_limit_price?: number;
  reason: string;
  confidenceScore?: number;
  action: string;
};

type TradeActionType = OpenTradeAction | CloseTradeAction;

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
    label: "Close",
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
  const asset = actionData.asset?.replace("-PERP", "") || "N/A";
  const reason = actionData.reason;
  const tradeAmount =
    actionData.type === "OPEN" ? actionData.trade_amount : undefined;
  const leverage = actionData.type === "OPEN" ? actionData.leverage : undefined;

  if (actionData.action === "NO_ACTION") {
    return null;
  }
  return (
    <View
      sx={{
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
          <Text
            variant="xs"
            sx={{
              textTransform: 'capitalize'
            }}
          >
              {actionData.action?.replace('_', ' ') || '-'}
          </Text>

          <Text variant="xs" sx={{ fontSize: 12, fontWeight: "400" }}>
            {asset}
          </Text>

          <Text variant="xs" sx={{ fontWeight: "500" }}>
            {leverage ? `${leverage}x` : '-'}
          </Text>
          <Text variant="xs" tone="muted">
            {tradeAmount ? formatAmount(tradeAmount) : '-'}
          </Text>

        </View>
      </TouchableOpacity>

      {reason ? (
        <View sx={{ marginVertical: 4, borderTopWidth: 1 }}>
          <Text
            variant="xs"

            sx={{ fontFamily: "monospace", fontStyle: "italic", color: palette.mutedForeground }}
          >
            {reason || "-"}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

type TradeSummaryProps = {
  tradeActions?: TradeActionType[];
};

export function TradeSummary({ tradeActions = [] }: TradeSummaryProps) {
  const { colors: palette } = useColors();

  if (!tradeActions.length) {
    return null;
  }

  const openActions = tradeActions.filter(
    (action): action is OpenTradeAction => action.type === "OPEN",
  );
  const closeActions = tradeActions.filter(
    (action): action is CloseTradeAction => action.type === "CLOSE",
  );

  const netPositionChange = tradeActions.reduce((acc, action) => {
    const amount = _asNumber(action.trade_amount);
    return acc + (amount ?? 0);
  }, 0);

  const parts: string[] = [];
  if (openActions.length) {
    parts.push(`Opened ${openActions.length} positions`);
  }
  if (closeActions.length) {
    parts.push(
      `Closed ${closeActions.length} position${closeActions.length > 1 ? "s" : ""}`,
    );
  }
  if (openActions.length || closeActions.length) {
    parts.push(`(net ${formatAmount(netPositionChange), { showSign: true }})`);
  }
  if (!parts.length) {
    return null;
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
