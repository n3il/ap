import React from 'react';
import { View, Text, Card } from '@/components/ui';
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
    <Card
      variant="glass"
      glassEffectStyle="clear"
      sx={{
        marginBottom: 3,
        backgroundColor: config.bgColor,
        borderWidth: 1,
        borderColor: config.color,
        borderStyle: 'solid',
      }}
    >
      <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 }}>
        <View
          sx={{
            width: 40,
            height: 40,
            borderRadius: 'full',
            backgroundColor: config.color,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <MaterialCommunityIcons
            name={config.icon}
            size={24}
            color={palette.foreground}
          />
        </View>

        <View sx={{ flex: 1 }}>
          <Text variant="sm" tone="muted" sx={{ marginBottom: 1 }}>
            Trade Action
          </Text>
          <Text variant="lg" sx={{ fontWeight: '600', color: config.color }}>
            {config.label}
          </Text>
        </View>

        {actionData.asset && (
          <View sx={{ alignItems: 'flex-end' }}>
            <Text variant="sm" tone="muted" sx={{ marginBottom: 1 }}>
              Asset
            </Text>
            <Text variant="md" sx={{ fontWeight: '600' }}>
              {actionData.asset}
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
              {actionData.size}
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
    </Card>
  );
}
