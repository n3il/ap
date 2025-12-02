import { useRef } from "react";
import { Animated, RefreshControl, View, Text } from "@/components/ui";
import { useColors } from "@/theme";
import WalletAddressCard from "../WalletAddressCard";

export default function WalletTab({
  agent,
  headerContent,
  tabBar,
  onRefresh,
  refreshing = false,
}) {
  const colors = useColors();
  const scrollY = useRef(new Animated.Value(0)).current;
  const tradingAccounts = agent?.trading_accounts ?? [];

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transform: [
            {
              translateY: scrollY.interpolate({
                inputRange: [-100, 0, 100],
                outputRange: [200, 100, 0],
              }),
            },
          ],
        }}
      >
        {tabBar}
      </Animated.View>
      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: "40%" }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        {headerContent}
        {tradingAccounts.length ? (
          tradingAccounts.map((account) => (
            <View key={account.id} style={{ marginBottom: 12 }}>
              <Text
                variant="xs"
                tone="muted"
                sx={{ textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}
              >
                {account.type === "real" ? "Real Trading Account" : "Paper Trading Account"}
              </Text>
              <WalletAddressCard address={account.hyperliquid_address} />
            </View>
          ))
        ) : (
          <WalletAddressCard address={null} />
        )}
      </Animated.ScrollView>
    </View>
  );
}
