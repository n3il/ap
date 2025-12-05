import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { ScrollView } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AgentList from "@/components/AgentList";
import MultiAgentChart from "@/components/agents/MultiAgentChart";
import { PaddedView } from "@/components/ContainerView";
import TimeFrameSelector from "@/components/chart/TimeFrameSelector";
import ExploreHeader from "@/components/explore/Header";
import MarketPricesWidget from "@/components/MarketPricesWidget";
import { RefreshControl, View } from "@/components/ui";
import GlassSelector from "@/components/ui/GlassSelector";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { useColors } from "@/theme";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function ExploreScreen() {
  const [isFetching, setIsFetching] = useState(false);
  const queryClient = useQueryClient();
  const colors = useColors();
  const palette = colors.colors;
  const { timeframe } = useTimeframeStore();
  const safeAreaInsets = useSafeAreaInsets();

  const handleRefresh = useCallback(async () => {
    setIsFetching(true);
    await queryClient.invalidateQueries({ queryKey: ["explore-agents"] });
    setIsFetching(false);
  }, [queryClient.invalidateQueries]);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <View
      style={{
        flex: 1,
        paddingTop: safeAreaInsets.top,
      }}
    >
      <PaddedView>
        <ExploreHeader />
      </PaddedView>
      <AnimatedScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: "70%" }}
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={handleRefresh}
            tintColor={palette.foreground}
            size="small"
          />
        }
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        snapToAlignment="center"
      >
        <View style={{ zIndex: 1000 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: palette.backgroundSecondary,
              paddingBottom: 4,
            }}
          >
            <MarketPricesWidget
              timeframe={timeframe}
              scrollY={scrollY}
              sx={{
                borderBottomWidth: 1,
                borderBottomColor: palette.border,
              }}
            />
            <MultiAgentChart
              timeframe={timeframe}
              scrollY={scrollY}
              style={{
                elevation: 10,
                shadowColor: palette.shadow,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.9,
                shadowRadius: 3.84,
              }}
            />

            <PaddedView
              sx={{
                alignItems: "center",
                flexDirection: "row",
                gap: 2,
                paddingTop: 2,
                paddingBottom: 1,
                borderBottomWidth: 0.5,
                borderBottomColor: palette.border,
              }}
            >
              <GlassSelector />
              <TimeFrameSelector />
            </PaddedView>
          </View>
        </View>
        <AgentList
          queryKey={["explore-agents"]}
          scrollY={scrollY}
        />
      </AnimatedScrollView>
    </View>
  );
}
