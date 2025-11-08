import React, { useState } from 'react';
import { View, Text, StatusBadge, TouchableOpacity } from '@/components/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/theme';

const asNumber = (value) => {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const formatCurrency = (value, maximumFractionDigits = 2) => {
  const num = asNumber(value);
  if (num === undefined) return null;
  return `$${num.toLocaleString('en-US', { maximumFractionDigits })}`;
};

function TradeActionRow({ label, value, valueStyle }) {
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

export default function TradeActionDisplay({ actionData, showReason = true }) {
  if (!actionData) return null;

  const [expanded, setExpanded] = useState(false);

  const {
    colors: palette,
    success,
    error,
    warning,
    withOpacity,
  } = useColors();

  const longColor = palette.long ?? success;
  const shortColor = palette.short ?? error;
  const closeColor = warning;
  const neutralColor = palette.secondary ?? palette.secondary500 ?? palette.textTertiary;

  const getActionConfig = (action) => {
    const actionType = (action || 'NO_ACTION').toUpperCase();

    if (actionType.includes('CLOSE')) {
      return {
        icon: 'close-circle',
        color: closeColor,
        bgColor: withOpacity(closeColor, 0.1),
        label: 'Close',
      };
    }

    if (actionType.includes('LONG')) {
      return {
        icon: 'trending-up',
        color: longColor,
        bgColor: withOpacity(longColor, 0.1),
        label: 'Long',
      };
    }

    if (actionType.includes('SHORT')) {
      return {
        icon: 'trending-down',
        color: shortColor,
        bgColor: withOpacity(shortColor, 0.1),
        label: 'Short',
      };
    }

    return {
      icon: 'minus-circle',
      color: neutralColor,
      bgColor: withOpacity(neutralColor, 0.1),
      label: 'No Action',
    };
  };

  const config = getActionConfig(actionData.action);
  const entryPrice = asNumber(actionData.entry ?? actionData.entry_price);
  const stopLoss = asNumber(actionData.stopLoss ?? actionData.stop_loss);
  const takeProfit = asNumber(actionData.takeProfit ?? actionData.take_profit);
  const sizeValue = asNumber(actionData.size);
  const leverageValue = asNumber(actionData.leverage);
  const confidenceScore = asNumber(actionData.confidenceScore ?? actionData.confidence_score);
  const confidencePercent = confidenceScore !== undefined
    ? Math.round(Math.min(Math.max(confidenceScore, 0), 1) * 100)
    : null;

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
              {actionData.asset || 'N/A'}
            </Text>

            {(sizeValue !== undefined || leverageValue !== undefined) && (
              <View sx={{ flexDirection: 'row', gap: 1, marginTop: 1 }}>
                {sizeValue !== undefined && (
                  <Text variant="xs" tone="muted">
                    {formatCurrency(sizeValue, 0)}
                  </Text>
                )}
                {leverageValue !== undefined && (
                  <Text variant="xs" tone="muted">
                    {`${leverageValue}x`}
                  </Text>
                )}
              </View>
            )}
          </View>

          <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
            <StatusBadge fontWeight="600" sx={{ borderColor: config.color, marginRight: 2 }} textSx={{ color: config.color }}>
              {config.label}
            </StatusBadge>

            <View
              sx={{
                width: 24,
                height: 24,
                borderRadius: 'full',
                borderColor: config.color,
                borderWidth: 1,
                justifyContent: 'center',
                alignItems: 'center',
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
                <TradeActionRow
                  label="Leverage"
                  value={`${leverageValue}x`}
                />
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
              <Text variant="sm" sx={{ lineHeight: 14, fontSize: 10, fontWeight: 300 }}>
                {actionData.reasoning || '-'}
              </Text>
            </View>
          )}
        </View>
    </View>
  );
}
