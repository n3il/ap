import { Redirect, useLocalSearchParams } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BalanceOverview from "@/components/agent/BalanceOverview";
import AgentHeader from "@/components/agent/Header";
import PositionsTab from "@/components/agents/PositionsTab";
import ThoughtsTab from "@/components/agents/ThoughtsTab";
import TradesTab from "@/components/agents/TradesTab";
import ContainerView, {
  GLOBAL_PADDING,
  PaddedView,
} from "@/components/ContainerView";
import { Animated, SwipeableTabs, View } from "@/components/ui";
import { ROUTES } from "@/config/routes";
import { useAgent } from "@/hooks/useAgent";
import { useColors } from "@/theme";

export default function AgentIndex() {
  const insets = useSafeAreaInsets();
  const { colors: palette } = useColors();
  const { id: agentId } = useLocalSearchParams();
  const { data: agent, refetch, isRefetching } = useAgent(agentId);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerHeight, setHeaderHeight] = useState(100); // Default fallback
  const [overviewHeight, setOverviewHeight] = useState(220); // Default fallback

  const imageScale = scrollY.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: [1.1, 1, 0.8],
    extrapolate: "clamp",
  });

  const imageTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 0],
    extrapolate: "clamp",
  });

  if (!agentId) {
    <Redirect href={ROUTES.TABS_AGENTS.path} />;
  }

  const startContentAtHeight = headerHeight + overviewHeight;

  const tabs = useMemo(
    () => [
      {
        key: "Timeline",
        title: "Timeline",
        content: () => (
          <ThoughtsTab
            agentId={agentId}
            onRefresh={() => refetch()}
            refreshing={isRefetching}
            listProps={{
              contentContainerStyle: {
                paddingTop: startContentAtHeight,
                paddingHorizontal: GLOBAL_PADDING,
                gap: 12,
              },
              scrollEventThrottle: 16,
              onScroll: Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true },
              ),
            }}
          />
        ),
      },
      {
        key: "Trades",
        title: "Trades",
        content: () => (
          <View style={{ flex: 1, paddingTop: startContentAtHeight }}>
            <TradesTab agent={agent} />
          </View>
        ),
      },
      {
        key: "Positions",
        title: "Positions",
        content: () => (
          <View style={{ flex: 1, paddingTop: startContentAtHeight }}>
            <PositionsTab agent={agent} />
          </View>
        ),
      },
    ],
    [agentId, agent, isRefetching, refetch, scrollY, headerHeight],
  );

  return (
    <ContainerView noSafeArea style={{ paddingTop: insets.top, flex: 1 }}>
      <AgentHeader
        agentId={agent?.id}
        agentName={agent?.name}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setHeaderHeight(height);
        }}
      />

      <Animated.View
        style={[
          {
            position: "absolute",
            width: "100%",
            top: insets.top + 100,
            left: 0,
            zIndex: 0,
          },
          {
            transform: [{ scale: imageScale }, { translateY: imageTranslateY }],
          },
        ]}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setOverviewHeight(height);
        }}
      >
        <PaddedView style={{ gap: 12, paddingHorizontal: 8 }}>
          <BalanceOverview agent={agent} />
        </PaddedView>
        {/* <HeaderChart
          agentId={agent?.id}
          style={{
            zIndex: 9999
          }}
        /> */}
      </Animated.View>

      <SwipeableTabs
        tabs={tabs}
        initialIndex={0}
        tabTextStyle={{ color: palette.text.secondary }}
        activeTabTextStyle={{ color: palette.accent }}
        indicatorColor={palette.foreground}
      />
    </ContainerView>
  );
}
