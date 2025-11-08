import React from 'react';
import { View, Text, StatusBadge } from '@/components/ui';

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
  const assetLabel = asset || symbol || coin || '';
  const sizeLabel = size || szi || 'N/A';

  const entryPriceValue = entry_price ? parseFloat(entry_price) : null;
  const currentPriceValue =
    typeof currentPrice === 'number'
      ? currentPrice
      : currentPrice
      ? parseFloat(currentPrice)
      : null;

  const hasEntryPrice = Number.isFinite(entryPriceValue);
  const hasCurrentPrice = Number.isFinite(currentPriceValue);

  const entryPriceLabel = hasEntryPrice
    ? `$${entryPriceValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
    : '';
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

  const positionPnlColor =
    unrealizedPnlValue > 0
      ? 'success'
      : unrealizedPnlValue < 0
      ? 'error'
      : 'foreground';

  const positionPnlSign = unrealizedPnlValue > 0 ? '+' : '';

  const unrealizedPnlLabel =
    unrealizedPnlValue !== 0
      ? `${positionPnlSign}$${Math.abs(unrealizedPnlValue).toLocaleString('en-US', {
          maximumFractionDigits: 2,
        })}`
      : '';

  const pnlPercentLabel =
    typeof pnlPercentValue === 'number'
      ? `${positionPnlSign}${Math.abs(pnlPercentValue).toFixed(2)}%`
      : '';

  return (
    <View
      key={id || symbol}
      sx={{
        flexDirection: 'column',
        paddingVertical: 2,
        paddingHorizontal: 3,
        borderRadius: 8,
        paddingLeft: '10%'
      }}
    >
      <View
        sx={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View sx={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
          {side && (
            <StatusBadge
              size="small"
              variant={side === 'LONG' ? 'success' : 'error'}
            >
              {side}
            </StatusBadge>
          )}
          <Text variant="sm" sx={{ fontWeight: '600' }}>
            {assetLabel.replace('-PERP', '')}
          </Text>

        </View>
        <View sx={{ flex: 1, alignItems: 'flex-end' }}>
          <Text variant="sm" sx={{ fontWeight: '600' }}>
            {sizeLabel}
          </Text>
        </View>
        <View sx={{ alignItems: 'flex-end' }}>
          {unrealizedPnlLabel && (
            <>
              <Text
                variant="xs"
                sx={{ fontWeight: '600', color: positionPnlColor }}
              >
                {unrealizedPnlLabel}
              </Text>
              {pnlPercentLabel && (
                <Text
                  variant="xs"
                  tone="subtle"
                  sx={{ color: positionPnlColor }}
                >
                  {pnlPercentLabel}
                </Text>
              )}
            </>
          )}
        </View>
      </View>

      {(entryPriceLabel || currentPriceLabel) && (
        <View
          sx={{
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 1,
          }}
        >
          {entryPriceLabel && (
            <View>
              <Text variant="xs" tone="muted">
                Entry: {entryPriceLabel}
              </Text>
            </View>
          )}
          {currentPriceLabel && (
            <View>
              <Text variant="xs" tone="muted">
                Current: {currentPriceLabel}
              </Text>
            </View>
          )}
        </View>
      )}
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
        <Text variant="xs" tone="muted">
          No positions available.
        </Text>
      )}
    </View>
  );
}
