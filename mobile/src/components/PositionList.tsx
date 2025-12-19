import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { SxProp } from "dripsy";
import { useState } from "react";
import type { ViewStyle } from "react-native";
import { Text, TouchableOpacity, View } from "@/components/ui";
import { useColors } from "@/theme";
import { formatAmount, formatPercent, numberToColor } from "@/utils/currency";

type PositionDetailRowProps = {
  label: string;
  value: string | number;
  valueStyle?: Record<string, unknown>;
};

export type PositionListItem = {
  symbol: string;
  coin?: string;
  type: string;
  size: number;
  entryPrice: number;
  positionValue: number;
  unrealizedPnl: number;
  leverage: number | null;
  livePnlPct: number | null;
  marginUsed: number;
  liquidationPx: number;
};

function PositionDetailRow({
  label,
  value,
  valueStyle,
}: PositionDetailRowProps) {
  return (
    <View
      sx={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 2,
      }}
    >
      <Text variant="xs" tone="muted">
        {label}
      </Text>
      <Text variant="xs" sx={{ fontWeight: "500", ...valueStyle }}>
        {value}
      </Text>
    </View>
  );
}

// type Position = {
//   agent_id: string;
//   asset: string;
//   currentPrice: number;
//   entry_price: number;
//   entry_timestamp: string;        // ISO datetime
//   exit_price: number | null;
//   exit_timestamp: string | null;  // ISO datetime or null
//   id: string;
//   leverage: number;
//   pnlPercent: number;
//   realized_pnl: number | null;
//   side: "LONG" | "SHORT";
//   size: number;
//   status: "OPEN" | "CLOSED";
//   unrealizedPnl: number;
// };

export function PositionRow({
  position,
  defaultExpanded = false,
  style = {},
}: {
  position: PositionListItem;
  defaultExpanded?: boolean;
  style?: ViewStyle;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { colors: palette } = useColors();

  const {
    symbol,
    coin,
    size,
    entryPrice,
    positionValue,
    unrealizedPnl,
    leverage,
    livePnlPct,
    liquidationPx,
  } = position;

  const formattedSymbol = (symbol || coin)?.replace("-PERP", "/USDC") ?? "";
  const side = size >= 0 ? "long" : "short";
  const absSize = Math.abs(size);
  const entryPriceValue = Number(entryPrice) || 0;
  const currentPriceValue = absSize > 0 ? positionValue / absSize : 0;
  const unrealizedPnlValue = Number(unrealizedPnl) || 0;
  const pnlPercentValue = livePnlPct != null ? Number(livePnlPct) : null;
  const totalPositionValue = positionValue + unrealizedPnlValue;

  const entryPriceLabel = entryPriceValue
    ? formatAmount(entryPriceValue, { precision: 2 })
    : "-";
  const currentPriceLabel = currentPriceValue
    ? formatAmount(currentPriceValue, { precision: 2 })
    : "-";
  const sizeLabel = absSize || "N/A";
  const unrealizedPnlLabel = formatAmount(unrealizedPnlValue, {
    showSign: true,
  });
  const pnlPercentLabel =
    pnlPercentValue != null ? formatPercent(pnlPercentValue) : "";

  // ---- Colors ----
  const longColor = palette.long;
  const shortColor = palette.short;
  const sideColor = side === "long" ? longColor : shortColor;
  const sideIcon = side === "long" ? "trending-up" : "trending-down";

  const positionPnlColor =
    unrealizedPnlValue > 0
      ? longColor
      : unrealizedPnlValue < 0
        ? shortColor
        : (palette.secondary ?? palette.textTertiary);

  return (
    <View sx={{ paddingBottom: 3 }} style={style}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View
          sx={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* ---- Left Column ---- */}
          <View sx={{ flex: 1 }}>
            <View sx={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Text variant="sm" sx={{ fontSize: 12 }}>
                {formattedSymbol}
              </Text>

              <MaterialCommunityIcons
                name={sideIcon}
                size={16}
                color={sideColor}
              />
            </View>

            <View sx={{ flexDirection: "row", alignItems: "center" }}>
              <Text variant="xs" sx={{ marginRight: 2 }}>
                {leverage}X {side}
              </Text>

            </View>
          </View>

          {/* ---- Right Column ---- */}
          <View sx={{ alignItems: "center" }}>
            <View sx={{ flexDirection: "column", alignItems: "flex-end" }}>
              <Text variant="xs">{formatAmount(totalPositionValue)}</Text>
              <Text
                variant="xs"
                sx={{ fontWeight: "500", color: numberToColor(unrealizedPnlValue) }}
              >
                {formatAmount(unrealizedPnlValue, { showSign: true })} (
                {pnlPercentValue != null
                  ? formatPercent(pnlPercentValue)
                  : "--"}
                )
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* ---- Expanded Details ---- */}
      {expanded && (
        <View
          sx={{
            borderLeftWidth: 0.5,
            borderLeftColor: "border",
            paddingLeft: 4,
            marginLeft: 2,
            marginTop: 2,
          }}
        >
          <PositionDetailRow label="Size" value={sizeLabel} />

          <PositionDetailRow label="Entry" value={entryPriceLabel} />
          <PositionDetailRow label="Current" value={currentPriceLabel} />
          <PositionDetailRow
            label="Liq. Price"
            value={
              liquidationPx
                ? formatAmount(liquidationPx, { precision: 4 })
                : "-"
            }
          />

          <PositionDetailRow
            label="Unrealized PnL"
            value={unrealizedPnlLabel}
            valueStyle={{ color: positionPnlColor }}
          />

          {pnlPercentLabel && (
            <PositionDetailRow
              label="PnL %"
              value={pnlPercentLabel}
              valueStyle={{ color: positionPnlColor }}
            />
          )}
        </View>
      )}
    </View>
  );
}

type PositionListProps = {
  positions?: PositionListItem[];
  top?: number;
  sx?: SxProp;
};

export default function PositionList({
  positions = [],
  top = 3,
  sx = {},
}: PositionListProps) {
  const topPositions = [...positions]
    .sort((a, b) => Math.abs(b.size) - Math.abs(a.size))
    .slice(0, top);
  return (
    <View sx={sx}>
      {topPositions.length > 0
        ? topPositions.map((position, i) => (
            <PositionRow
              key={position?.symbol ?? position?.coin ?? i}
              position={position}
            />
          ))
        : null}

      {positions.length > top ? (
        <Text
          variant="xs"
          tone="muted"
          sx={{ textAlign: "right", fontStyle: "italic" }}
        >
          +{positions.length - top} more positions
        </Text>
      ) : null}
    </View>
  );
}
