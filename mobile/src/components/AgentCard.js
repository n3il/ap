import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from '@/components/ui';
import { useAccountBalance } from '@/hooks/useAccountBalance';
import PositionList from './PositionList';
import BalanceOverview from './agent/BalanceOverview';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

export default function AgentCard({
  agent,
  latestAssessment,
  isOwnAgent = false,
  onPress,
  compactView = false,
  hideOpenPositions = false,
  showPositions = true,
  extraContent = null,
  tintColor = 'rgba(0, 0, 0, .1)',
  transparent = false,
  isActive = false,
  ...props
}) {
  const { theme: colors } = useTheme();
  const accountData = useAccountBalance(agent.id, hideOpenPositions)
  // Calculate total PnL (realized + unrealized)
  // const isPublished = Boolean(agent.published_at);

  // Animation values
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.02 : 1, {
      damping: 30,
      stiffness: 150,
    });
    borderOpacity.value = withSpring(isActive ? 1 : 0.2, {
      damping: 30,
      stiffness: 150,
    });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderWidth: transparent ? 0 : 1,
    borderColor: `rgba(255, 255, 255, ${borderOpacity.value})`,
  }));

  return (
    <Animated.View
      style={[{
        paddingVertical: 18,
        paddingHorizontal: 18,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, .2)',
        backgroundColor: colors.surface,
        borderRadius: 12,
      }, animatedStyle]}
      {...props}
    >


    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View sx={{ marginBottom: 3, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <View sx={{ flex: 1 }}>
          <View sx={{ justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }}>
            <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text variant="md" sx={{ fontWeight: '500', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                {agent.name}
              </Text>
            </View>

          </View>
        </View>
      </View>

      <BalanceOverview
        agentId={agent.id}
        hideOpenPositions={hideOpenPositions}
        variant={compactView ? 'compact' : 'full'}
      />
      {!hideOpenPositions && (
        <View sx={{ marginTop: 6, borderTopColor: 'muted', borderTopWidth: 1 }}>
          <PositionList positions={accountData.enrichedPositions} top={3} />
          <Text variant="xxs" tone="muted" sx={{ textAlign: 'left', fontStyle: 'italic' }}>
            {accountData.enrichedPositions.length > 3 ? `+ ${accountData.enrichedPositions.length - 3} more positions` : null}
          </Text>
        </View>
      )}
    </TouchableOpacity>
    {extraContent}
    </Animated.View>
  );
}
