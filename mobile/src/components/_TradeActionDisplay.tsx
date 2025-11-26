import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "@/components/ui";
import { useColors } from "@/theme";

const asNumber = (value) => {
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

const formatCurrency = (value, maximumFractionDigits = 2) => {
  const num = asNumber(value);
  if (num === undefined) return null;
  return `$${num.toLocaleString("en-US", { maximumFractionDigits })}`;
};

function TradeActionRow({ label, value, valueStyle }) {
  return (
    <View
      sx={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 2,
      }}
    >
      <Text variant="sm" tone="muted">
        {label}
      </Text>
      <Text variant="sm" sx={{ fontWeight: "500", ...valueStyle }}>
        {value}
      </Text>
    </View>
  );
}

function getActionMeta(actionType) {
  switch (actionType) {
    case "CLOSE_LONG":
      return {
        icon: "close-circle",
        label: "Close Long",
      };

    case "CLOSE_SHORT":
      return {
        icon: "close-circle",
        label: "Close Short",
      };

    case "OPEN_LONG":
      return {
        icon: "trending-up",
        label: "Open Long",
      };

    case "OPEN_SHORT":
      return {
        icon: "trending-down",
        label: "Open Short",
      };

    default:
      return {
        icon: "minus",
        label: "No Action",
      };
  }
}

export default function TradeActionDisplay({ actionData, showReason = true }) {
  if (!actionData) return null;

  const [expanded, setExpanded] = useState(false);

  const { colors: palette, success, error } = useColors();

  // Helper component to render a single action item
  const _ActionItem = ({
    action,
    showDetails = false,
  }: {
    action: TradeActionType;
    showDetails: boolean;
  }) => {
    const config = getActionMeta(action.action);
    const sizeValue = asNumber(action.size);
    const leverageValue = asNumber(action.leverage);

    return (
      <View
        sx={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: showDetails ? 2 : 1,
        }}
      >
        <Text variant="sm" sx={{ fontSize: 12, fontWeight: "400" }}>
          {action.asset.replace("-PERP", "/USDC") || "N/A"}
        </Text>

        <View
          sx={{
            flexGrow: 0,
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
          }}
        >
          {(sizeValue !== undefined || leverageValue !== undefined) && (
            <View sx={{ flexDirection: "row", gap: 2 }}>
              {sizeValue !== undefined && (
                <Text variant="xs" tone="muted">
                  {formatCurrency(sizeValue, 0)}
                </Text>
              )}
              {leverageValue !== undefined && (
                <Text variant="xs" tone="foreground" sx={{ fontWeight: "500" }}>
                  {`${leverageValue}x`}
                </Text>
              )}
            </View>
          )}

          <View
            sx={{
              flexGrow: 0,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: config.color,
              borderRadius: 30,
              paddingHorizontal: 2,
              paddingVertical: 0.5,
              gap: 1,
            }}
          >
            <Text
              style={{
                borderWidth: 0,
                padding: 0,
                color: config.color,
                fontSize: 12,
                lineHeight: 15,
              }}
            >
              {config.label}
            </Text>
            <View
              sx={{
                width: 16,
                height: 16,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialCommunityIcons
                name={config.icon}
                size={16}
                color={config.color}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Single action view (original behavior)
  const config = getActionMeta(actionData.action);
  const entryPrice = asNumber(actionData.entry ?? actionData.entry_price);
  const stopLoss = asNumber(actionData.stopLoss ?? actionData.stop_loss);
  const takeProfit = asNumber(actionData.takeProfit ?? actionData.take_profit);
  const sizeValue = asNumber(actionData.size);
  const leverageValue = asNumber(actionData.leverage);
  const confidenceScore = asNumber(
    actionData.confidenceScore ?? actionData.confidence_score,
  );
  const confidencePercent =
    confidenceScore !== undefined
      ? Math.round(Math.min(Math.max(confidenceScore, 0), 1) * 100)
      : null;

  return (
    <View
      sx={{
        borderBottomWidth: 1,
        borderColor: palette.border,
        paddingVertical: 2,
      }}
    >
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View
          sx={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: expanded ? 2 : 0,
          }}
        >
          <Text variant="sm" sx={{ fontSize: 12, fontWeight: "400" }}>
            {actionData.asset.replace("-PERP", "") || "N/A"}
          </Text>

          <View
            sx={{
              flexGrow: 0,
              flexDirection: "row",
              alignItems: "center",
              gap: 2,
            }}
          >
            {(sizeValue !== undefined || leverageValue !== undefined) && (
              <View sx={{ flexDirection: "row", gap: 2 }}>
                {sizeValue !== undefined && (
                  <Text variant="xs" tone="muted">
                    {formatCurrency(sizeValue, 0)}
                  </Text>
                )}
                {leverageValue !== undefined && (
                  <Text
                    variant="xs"
                    tone="foreground"
                    sx={{ fontWeight: "500" }}
                  >
                    {`${leverageValue}x`}
                  </Text>
                )}
              </View>
            )}

            <View
              sx={{
                flexGrow: 0,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: config.color,
                borderRadius: 30,
                paddingHorizontal: 2,
                paddingVertical: 0.5,
                gap: 1,
              }}
            >
              <Text
                style={{
                  borderWidth: 0,
                  padding: 0,
                  color: config.color,
                  fontSize: 12,
                  lineHeight: 15,
                }}
              >
                {config.label}
              </Text>
              <View
                sx={{
                  width: 16,
                  height: 16,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MaterialCommunityIcons
                  name={config.icon}
                  size={16}
                  color={config.color}
                />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <View>
        {expanded && (
          <>
            {entryPrice !== undefined && (
              <TradeActionRow
                label="Entry"
                value={formatCurrency(entryPrice, 2)}
              />
            )}

            {stopLoss !== undefined && (
              <TradeActionRow
                label="Stop Loss"
                value={formatCurrency(stopLoss, 2)}
                valueStyle={{ color: palette.short ?? error }}
              />
            )}

            {takeProfit !== undefined && (
              <TradeActionRow
                label="Take Profit"
                value={formatCurrency(takeProfit, 2)}
                valueStyle={{ color: palette.long ?? success }}
              />
            )}

            {sizeValue !== undefined && (
              <TradeActionRow
                label="Order Size"
                value={formatCurrency(sizeValue, 0)}
              />
            )}

            {leverageValue !== undefined && (
              <TradeActionRow label="Leverage" value={`${leverageValue}x`} />
            )}

            {confidencePercent !== null && (
              <TradeActionRow
                label="Confidence"
                value={`${confidencePercent}%`}
              />
            )}
          </>
        )}

        {showReason && actionData.reasoning && (
          <View sx={{ marginTop: 2, borderTopWidth: 1 }}>
            <Text
              variant="sm"
              sx={{ lineHeight: 14, fontSize: 10, fontWeight: 300 }}
            >
              {actionData.reasoning || "-"}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
