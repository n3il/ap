import React, { useRef } from 'react';
import { View, Text, RefreshControl, Animated } from '@/components/ui';
import TradeCard from '@/components/TradeCard';
import SectionTitle from '../SectionTitle';
import { useColors } from '@/theme';

export default function TradesTab({
  trades = [],
  isOwnAgent,
  headerContent,
  tabBar,
  onRefresh,
  refreshing = false
}) {
  const ownerVisibilityRestriction = false;
  const colors = useColors();
  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transform: [{
            translateY: scrollY.interpolate({
              inputRange: [-100, 0, 100],
              outputRange: [200, 100, 0],
            })
          }],
        }}
      >
        {tabBar}
      </Animated.View>
      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: '40%', gap: 4 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {headerContent}

      {!ownerVisibilityRestriction ? (
        <>
          <SectionTitle>
            {`All Trades (${trades.length})`}
          </SectionTitle>
          {trades.length === 0 ? (
            <Text sx={{ color: 'mutedForeground', textAlign: 'center', paddingVertical: 3, fontSize: 12 }}>
              No trades yet
            </Text>
          ) : (
            trades.map((trade) => <TradeCard key={trade.id} trade={trade} />)
          )}
        </>
      ) : (
        <Text variant="sm" sx={{ color: 'secondary500', fontSize: 12, lineHeight: 18 }}>
          Trading history is restricted to the original desk. Copy the agent to build your own ledger.
        </Text>
      )}
      </Animated.ScrollView>
    </View>
  );
}
