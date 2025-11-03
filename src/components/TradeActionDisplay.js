import React from 'react';
import { View, Text, Card, StatusBadge } from '@/components/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/theme';

export default function TradeActionDisplay({ actionData }) {
  if (!actionData) return null;

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
    const actionType = action.toUpperCase();

    if (actionType.includes('LONG')) {
      return {
        icon: 'trending-up',
        color: longColor,
        bgColor: withOpacity(longColor, 0.1),
        label: 'Long',
      };
    } else if (actionType.includes('SHORT')) {
      return {
        icon: 'trending-down',
        color: shortColor,
        bgColor: withOpacity(shortColor, 0.1),
        label: 'Short',
      };
    } else if (actionType.includes('CLOSE')) {
      return {
        icon: 'close-circle',
        color: closeColor,
        bgColor: withOpacity(closeColor, 0.1),
        label: 'Close',
      };
    } else {
      return {
        icon: 'minus-circle',
        color: neutralColor,
        bgColor: withOpacity(neutralColor, 0.1),
        label: 'No Action',
      };
    }
  };

  const config = getActionConfig(actionData.action);

  return (
    <View
      sx={{
        marginBottom: 3,
        // backgroundColor: config.bgColor,
        // borderWidth: 1,
        // borderColor: config.color,
        // borderStyle: 'solid',
      }}
    >
      <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 }}>
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

        <View sx={{ flex: 1 }}>
          <Text variant="sm" tone="muted" sx={{ marginBottom: 1, display: 'none' }}>
            Trade Action
          </Text>
          <StatusBadge fontWeight="600" sx={{ borderColor: config.color }}>
            {config.label}
          </StatusBadge>
        </View>

        {actionData.asset && (
          <View sx={{ alignItems: 'flex-end' }}>
            <Text variant="sm" tone="muted" sx={{ marginBottom: 1, display: 'none' }}>
              Asset
            </Text>
            <Text variant="md" sx={{ fontWeight: '600' }}>
              {actionData.asset || ''}
            </Text>
          </View>
        )}
      </View>

      <View sx={{ gap: 2 }}>
        {actionData.size && (
          <View sx={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="sm" tone="muted">
              Position Size
            </Text>
            <Text variant="sm" sx={{ fontWeight: '500' }}>
              {typeof actionData.size === 'number'
                ? `${(actionData.size * 100).toFixed(1)}%`
                : actionData.size}
            </Text>
          </View>
        )}

        {actionData.entry && (
          <View sx={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="sm" tone="muted">
              Entry
            </Text>
            <Text variant="sm" sx={{ fontWeight: '500' }}>
              ${actionData.entry.toLocaleString()}
            </Text>
          </View>
        )}

        {actionData.stop_loss && (
          <View sx={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="sm" tone="muted">
              Stop Loss
            </Text>
            <Text variant="sm" sx={{ fontWeight: '500', color: palette.short ?? error }}>
              ${actionData.stop_loss.toLocaleString()}
            </Text>
          </View>
        )}

        {actionData.take_profit && (
          <View sx={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="sm" tone="muted">
              Take Profit
            </Text>
            <Text variant="sm" sx={{ fontWeight: '500', color: palette.long ?? success }}>
              ${actionData.take_profit.toLocaleString()}
            </Text>
          </View>
        )}

        {actionData.reasoning && (
          <View sx={{ marginTop: 2, paddingTop: 2, borderTopWidth: 1, borderTopColor: withOpacity(palette.foreground, 0.1) }}>
            <Text variant="xs" tone="muted" sx={{ marginBottom: 1 }}>
              Reasoning
            </Text>
            <Text variant="sm" sx={{ lineHeight: 20, fontWeight: 300 }}>
              {actionData.reasoning}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
