import React, { useState } from 'react';
import { View, Text, Card, StatusBadge, TouchableOpacity } from '@/components/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/theme';

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

export default function TradeActionDisplay({ actionData }) {
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
      }}
    >
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: expanded ? 2 : 0 }}>
          
          <View sx={{ flex: 1 }}>
            <Text variant="sm" sx={{ fontSize: 12, fontWeight: '400' }}>
              {actionData.asset || 'N/A'}
            </Text>
          </View>

          
          <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
            {actionData.size && (
              <Text variant="sm" sx={{ fontWeight: '500', marginRight: 2 }}>
                {typeof actionData.size === 'number'
                  ? `${(actionData.size * 100).toFixed(0)}x`
                  : actionData.size}
              </Text>
            )}

            <StatusBadge fontWeight="600" sx={{ borderColor: config.color, marginRight: 2 }}>
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

      {expanded && (
        <View>
          {actionData.entry && (
            <TradeActionRow
              label="Entry"
              value={`$${actionData.entry.toLocaleString()}`}
            />
          )}

          {actionData.stop_loss && (
            <TradeActionRow
              label="Stop Loss"
              value={`$${actionData.stop_loss.toLocaleString()}`}
              valueStyle={{ color: palette.short ?? error }}
            />
          )}

          {actionData.take_profit && (
            <TradeActionRow
              label="Take Profit"
              value={`$${actionData.take_profit.toLocaleString()}`}
              valueStyle={{ color: palette.long ?? success }}
            />
          )}

          {actionData.reasoning && (
            <View sx={{ marginTop: 2, paddingTop: 2, borderTopWidth: 1 }}>
              <Text variant="xs" tone="muted" sx={{ marginBottom: 1 }}>
                Reasoning
              </Text>
              <Text variant="sm" sx={{ lineHeight: 20, fontWeight: 300 }}>
                {actionData.reasoning}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
