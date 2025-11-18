import React, { useState } from 'react';
import { View, Text, StatusBadge, TouchableOpacity } from '@/components/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/theme';

function PositionDetailRow({ label, value, valueStyle }) {
  return (
    <View sx={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
      <Text variant="sm" tone="muted">
        {label}
      </Text>
      <Text variant="sm" sx={{ fontWeight: '500', ...valueStyle }}>
        {value}
      </Text>
    </View>
  );
}

export function PositionRow({
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
}) {
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
    ? `$${positionValue.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`
    : '-';

  const entryPriceLabel = hasEntryPrice
    ? `$${entryPriceValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
    : '-';
  const currentPriceLabel = hasCurrentPrice
    ? `$${currentPriceValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
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
      ? `${positionPnlSign}$${Math.abs(unrealizedPnlValue).toLocaleString('en-US', {
          maximumFractionDigits: 2,
        })}`
      : '$0.00';

  const pnlPercentLabel =
    typeof pnlPercentValue === 'number'
      ? `${positionPnlSign}${Math.abs(pnlPercentValue).toFixed(2)}%`
      : '';

  return (
    <View
      sx={{
        marginBottom: 3,
      }}
    >
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: expanded ? 2 : 0 }}>

          <View sx={{ flex: 1 }}>
            <Text variant="sm" sx={{ fontSize: 12, fontWeight: '400' }}>
              {assetLabel.replace('-PERP', '/USDC')}
            </Text>
          </View>

          <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="sm" sx={{ fontWeight: '500', marginRight: 2 }}>
              {positionValueLabel}
            </Text>

            {side && (
              <StatusBadge
                fontWeight="600"
                sx={{ borderWidth: 0, borderColor: sideColor }}
                textSx={{ color: sideColor, fontWeight: '400' }}
              >
                {side}
              </StatusBadge>
            )}

            <View
              sx={{
                width: 24,
                height: 24,
                borderRadius: 'full',
                borderColor: sideColor,
                borderWidth: 0,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <MaterialCommunityIcons
                name={sideIcon}
                size={16}
                color={sideColor}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <View>
        {expanded && (
          <>
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
          </>
        )}
      </View>
    </View>
  );
}

export default function PositionList({ positions = [] }) {
  const safeEnrichedPositions = Array.isArray(positions) ? positions : [];
  return (
    <View sx={{ marginTop: 3 }}>
      {safeEnrichedPositions.length > 0 ? (
        safeEnrichedPositions.map((position, i) => (
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
