import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "@/components/ui";
import { useColors } from "@/theme";
import { formatAmount, formatCompact, formatPercent } from "@/utils/currency";
import { formatRelativeDate } from "@/utils/date";

type PositionDetailRowProps = {
  label: string;
  value: string | number;
  valueStyle?: Record<string, unknown>;
};

export type EnrichedPosition = {
  id?: string;
  agent_id?: string;
  asset?: string;
  symbol?: string;
  coin?: string;
  side?: "LONG" | "SHORT" | string;
  size: number;
  szi?: number;
  entry_price?: number | string;
  currentPrice?: number | string;
  unrealizedPnl?: number;
  pnlPercent?: number;
  leverage?: number;
  positionValue?: number;
  entry_timestamp?: string;
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

export function PositionRow(position: EnrichedPosition) {
  const [expanded, setExpanded] = useState(false);
  const { colors: palette } = useColors();

  const {
    asset = "",
    symbol = "",
    coin = "",
    side = "",
    size,
    szi,
    entry_price,
    currentPrice,
    unrealizedPnl,
    pnlPercent,
    leverage,
    positionValue,
    entry_timestamp,
  } = position;

  // ---- Labels ----
  const assetLabel = (asset || symbol || coin || "").replace("-PERP", "/USDC");
  const sizeLabel = size || szi || "N/A";

  const entryPriceValue = entry_price ? Number(entry_price) : null;
  const currentPriceValue =
    typeof currentPrice === "number"
      ? currentPrice
      : currentPrice
        ? Number(currentPrice)
        : null;

  const unrealizedPnlValue = Number(unrealizedPnl) || 0;
  const pnlPercentValue = pnlPercent != null ? Number(pnlPercent) : null;

  // ---- Labels formatted ----
  const positionValueLabel =
    positionValue != null
      ? `$${formatCompact(positionValue)}`
      : size + unrealizedPnlValue;

  const entryPriceLabel = entryPriceValue
    ? `$${formatCompact(entryPriceValue)}`
    : "-";

  const currentPriceLabel = currentPriceValue
    ? `$${formatCompact(currentPriceValue)}`
    : "";

  const unrealizedPnlLabel =
    unrealizedPnlValue !== 0 ? `${formatCompact(unrealizedPnlValue)}` : "$0.00";

  const pnlPercentLabel =
    pnlPercentValue != null ? `${Math.abs(pnlPercentValue)}%` : "";

  // ---- Colors ----
  const longColor = palette.long;
  const shortColor = palette.short;
  const sideColor = side === "LONG" ? longColor : shortColor;
  const sideIcon = side === "LONG" ? "trending-up" : "trending-down";

  const positionPnlColor =
    unrealizedPnlValue > 0
      ? longColor
      : unrealizedPnlValue < 0
        ? shortColor
        : (palette.secondary ?? palette.textTertiary);

  return (
    <View sx={{ paddingBottom: 3 }}>
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
                {assetLabel}
              </Text>
              <Text sx={{ fontSize: 9 }}>
                {formatRelativeDate(entry_timestamp)}
              </Text>
            </View>

            <View sx={{ flexDirection: "row", alignItems: "center" }}>
              <Text variant="xs" sx={{ color: sideColor, marginRight: 2 }}>
                {leverage}X {side}
              </Text>
              <MaterialCommunityIcons
                name={sideIcon}
                size={16}
                color={sideColor}
              />
            </View>
          </View>

          {/* ---- Right Column ---- */}
          <View sx={{ alignItems: "center" }}>
            <View sx={{ flexDirection: "column", alignItems: "flex-end" }}>
              <Text variant="xs">
                {formatAmount(positionValueLabel, { minDecimals: 0 })}
              </Text>
              <Text
                variant="xs"
                sx={{ fontWeight: "500", color: positionPnlColor }}
              >
                {formatAmount(unrealizedPnlLabel)} (
                {formatPercent(pnlPercentValue)})
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
          {currentPriceLabel && (
            <PositionDetailRow label="Current" value={currentPriceLabel} />
          )}

          <PositionDetailRow
            label="Unrealized PnL"
            value={unrealizedPnlLabel}
            valueStyle={{ color: positionPnlColor }}
          />

          {pnlPercentLabel && (
            <PositionDetailRow
              label="PnL %"
              value={formatPercent(pnlPercentValue)}
              valueStyle={{ color: positionPnlColor }}
            />
          )}
        </View>
      )}
    </View>
  );
}

type PositionListProps = {
  positions?: EnrichedPosition[];
  top?: number;
};

export default function PositionList({
  positions = [],
  top = 3,
}: PositionListProps) {
  const safeEnrichedPositions = Array.isArray(positions) ? positions : [];
  const topPositions = safeEnrichedPositions
    .sort((a, b) => b.size - a.size)
    .slice(0, top);
  return (
    <View sx={{ marginTop: 3 }}>
      {topPositions.length > 0 ? (
        topPositions.map((position, i) => (
          <PositionRow
            key={position?.id || position?.symbol || i}
            {...position}
          />
        ))
      ) : (
        <Text
          variant="xs"
          tone="muted"
          sx={{ textAlign: "right", width: "100%", fontStyle: "italic" }}
        >
          Open positions: none
        </Text>
      )}

      {positions.length > top ? (
        <Text
          variant="xs"
          tone="muted"
          sx={{ textAlign: "right", fontStyle: "italic" }}
        >
          + {positions.length - top} more positions
        </Text>
      ) : null}
    </View>
  );
}
