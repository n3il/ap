import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import BalanceOverview from "@/components/agent/BalanceOverview";
import AgentHeader from "@/components/agent/Header";
import HeaderChart from "@/components/agent/HeaderChart";
import ThoughtsTab from "@/components/agents/ThoughtsTab";
import ContainerView, {
  GLOBAL_PADDING,
  PaddedView,
} from "@/components/ContainerView";
import { Animated, Stack, SwipeableTabs } from "@/components/ui";
import { useAgent } from "@/hooks/useAgent";
import { useColors } from "@/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ROUTES } from "@/config/routes";
import TradesTab from "@/components/agents/TradesTab";

export default function AgentIndex() {
  const insets = useSafeAreaInsets();
  const { colors: palette } = useColors();
  const { id: agentId } = useLocalSearchParams();
  const { data: agent, refetch, isRefetching } = useAgent(agentId);
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerHeight, setHeaderHeight] = useState(220); // Default fallback

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
    <Redirect href={ROUTES.TABS_AGENTS.path} />
  }

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
                paddingTop: headerHeight,
                paddingHorizontal: GLOBAL_PADDING,
                paddingBottom: "60%",
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
        content: () => <TradesTab />,
      },
      {
        key: "Funding",
        title: "Funding",
        content: null,
      },
    ],
    [agentId, isRefetching, refetch, scrollY, headerHeight],
  );

  return (
    <ContainerView noSafeArea style={{ paddingTop: insets.top, flex: 1 }}>
      <AgentHeader agentId={agent?.id} agentName={agent?.name} />
      <Animated.View
        style={[
          {
            position: "absolute",
            width: "100%",
            top: 160,
            left: 0,
          },
          {
            transform: [{ scale: imageScale }, { translateY: imageTranslateY }],
          },
        ]}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setHeaderHeight(height);
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
        indicatorColor={palette.accent}
      />
    </ContainerView>
  );
}
