import React, { useState } from 'react';
import { View, Text, StatusBadge, TouchableOpacity } from '@/components/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/theme';
import { formatCompact } from '@/utils/currency';

function PositionDetailRow({ label, value, valueStyle }) {
  return (
    <View sx={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
      <Text variant="xs" tone="muted">
        {label}
      </Text>
      <Text variant="xs" sx={{ fontWeight: '500', ...valueStyle }}>
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

export function PositionRow(position) {
  const {
    id = '',
    asset = '',
    symbol = '',
    coin = '',
    side = '',
    size = '',
    szi = '',
    entry_price = '',
    currentPrice = '',
    unrealizedPnl = '',
    pnlPercent = '',
  } = position;
  const [expanded, setExpanded] = useState(false);
  const {
    colors: palette,
    success,
    error,
    withOpacity,
  } = useColors();

  const assetLabel = asset || symbol || coin || '';
  const sizeLabel = size || szi || 'N/A';
  const sizeValue = parseFloat(size || szi || 0);

  const entryPriceValue = entry_price ? parseFloat(entry_price) : null;
  const currentPriceValue =
    typeof currentPrice === 'number'
      ? currentPrice
      : currentPrice
      ? parseFloat(currentPrice)
      : null;

  const hasEntryPrice = Number.isFinite(entryPriceValue);
  const hasCurrentPrice = Number.isFinite(currentPriceValue);

  const positionValue = hasCurrentPrice && Number.isFinite(sizeValue)
    ? Math.abs(sizeValue * currentPriceValue)
    : null;

  const positionValueLabel = positionValue !== null
    ? `$${formatCompact(positionValue)}`
    : '-';

  const entryPriceLabel = hasEntryPrice
    ? `$${formatCompact(entryPriceValue)}`
    : '-';
  const currentPriceLabel = hasCurrentPrice
    ? `$${formatCompact(currentPriceValue)}`
    : '';

  const unrealizedPnlValue =
    typeof unrealizedPnl === 'number' ? unrealizedPnl : parseFloat(unrealizedPnl) || 0;

  const pnlPercentValue =
    typeof pnlPercent === 'number'
      ? pnlPercent
      : pnlPercent
      ? parseFloat(pnlPercent)
      : null;

  const longColor = palette.long ?? success;
  const shortColor = palette.short ?? error;

  const sideColor = side === 'LONG' ? longColor : shortColor;
  const sideIcon = side === 'LONG' ? 'trending-up' : 'trending-down';

  const positionPnlColor =
    unrealizedPnlValue > 0
      ? longColor
      : unrealizedPnlValue < 0
      ? shortColor
      : palette.secondary ?? palette.textTertiary;

  const positionPnlSign = unrealizedPnlValue > 0 ? '+' : '';

  const unrealizedPnlLabel =
    unrealizedPnlValue !== 0
      ? `${positionPnlSign}${formatCompact(unrealizedPnlValue)}`
      : '$0.00';

  const pnlPercentLabel =
    typeof pnlPercentValue === 'number'
      ? `${positionPnlSign}${Math.abs(formatCompact(pnlPercentValue))}%`
      : '';

  return (
    <View
      sx={{
        paddingBottom: 3
      }}
    >
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View sx={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>

          <View sx={{ flex: 1, justifyContent: 'between' }}>
            <Text variant="sm" sx={{ fontSize: 12, fontWeight: '400' }}>
              {assetLabel.replace('-PERP', '/USDC')}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                variant="xs"
                sx={{ color: sideColor, fontWeight: '400' }}
              >
                {side}
              </Text>
              <MaterialCommunityIcons
                name={sideIcon}
                size={16}
                color={sideColor}
              />
            </View>

          </View>

          <View sx={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
            <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text variant="sm" sx={{  }}>
                {positionValueLabel}
              </Text>

              <Text variant="sm" sx={{ fontWeight: '500', color: positionPnlColor }}>
                {pnlPercentLabel}
              </Text>
            </View>
            <View sx={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
              <Text variant="xs" sx={{  }} tone="muted">
                {formatCompact(entryPriceValue * sizeValue, 'en-US', 1)}
              </Text>

              <Text variant="xs" sx={{ }} tone="muted">
                ({unrealizedPnlLabel})
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

        {expanded && (
          <View sx={{
            borderLeftWidth: 2,
            borderLeftColor: 'border',
            paddingLeft: 4,
            marginLeft: 2,
          }}>
            <PositionDetailRow
              label="Size"
              value={sizeLabel}
            />

            {entryPriceLabel && (
              <PositionDetailRow
                label="Entry"
                value={entryPriceLabel}
              />
            )}

            {currentPriceLabel && (
              <PositionDetailRow
                label="Current"
                value={currentPriceLabel}
              />
            )}

            {unrealizedPnlLabel && (
              <PositionDetailRow
                label="Unrealized PnL"
                value={unrealizedPnlLabel}
                valueStyle={{ color: positionPnlColor }}
              />
            )}

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

export default function PositionList({ positions = [], top = 3 }) {
  const safeEnrichedPositions = Array.isArray(positions) ? positions : [];
  const topPositions = safeEnrichedPositions.sort((a, b) => b.size - a.size).slice(0, top);
  return (
    <View sx={{ marginTop: 3 }}>
      {topPositions.length > 0 ? (
        topPositions.map((position, i) => (
          <PositionRow key={position?.id || position?.symbol || i} {...position} />
        ))
      ) : (
        <Text variant="xs" tone="muted" sx={{ textAlign: 'right', width: '100%', fontStyle: 'italic' }}>
          no active positions
        </Text>
      )}
    </View>
  );
}
