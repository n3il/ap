import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { ScrollView } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AgentList from "@/components/AgentList";
import AgentTable from "@/components/AgentTable";
import MultiAgentChart from "@/components/agents/MultiAgentChart";
import { GLOBAL_PADDING, PaddedView } from "@/components/ContainerView";
import TimeFrameSelector from "@/components/chart/TimeFrameSelector";
import ExploreHeader from "@/components/explore/Header";
import MarketPricesWidget from "@/components/explore/MarketPricesWidget";
import { View, RefreshControl } from "@/components/ui";
import Toggle from "@/components/ui/Toggle";
import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { useColors } from "@/theme";
import { useFocusEffect } from "expo-router";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function ExploreScreen() {
  const [isFocused, setIsFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      // Invoked whenever the route is focused.
      setIsFocused(true);

      // Return function is invoked whenever the route gets out of focus.
      return () => {
        setIsFocused(false);
      };
    }, []),
  );

  const [isFetching, setIsFetching] = useState(false);
  const queryClient = useQueryClient();
  const { viewMode } = useExploreAgentsStore();
  const colors = useColors();
  const palette = colors.colors;
  const safeAreaInsets = useSafeAreaInsets();

  const handleRefresh = useCallback(async () => {
    // setIsFetching(true);
    // await queryClient.invalidateQueries({ queryKey: ["explore-agents"] });
    // setIsFetching(false);
  }, [queryClient.invalidateQueries]);

  const scrollY = useSharedValue(0);
  const largeScrollValue = useSharedValue(9000);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const [widgetExpanded, setWidgetExpanded] = useState(false);
  const handleAssetPressCallback = useCallback(() => {
    setWidgetExpanded(!widgetExpanded);
  }, [widgetExpanded]);

  const [chartExpanded, setChartExpanded] = useState(true);
  const handleChartToggle = useCallback(() => {
    setChartExpanded(!chartExpanded);
  }, [chartExpanded]);

  return (
    <View
      style={{
        flex: 1,
        paddingTop: safeAreaInsets.top,
        backgroundColor: palette?.backgroundSecondary,
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
              paddingBottom: 4,
              backgroundColor: palette.backgroundSecondary,
            }}
          >
            <MarketPricesWidget
              scrollY={widgetExpanded ? scrollY : largeScrollValue}
              style={{
                marginVertical: 3,
              }}
              onPress={handleAssetPressCallback}
              pageInFocus={isFocused}
            />
            <MultiAgentChart
              scrollY={scrollY}
              expanded={chartExpanded}
              useScrollAnimation={true}
              onPress={handleChartToggle}
              pageInFocus={isFocused}
            />

            <PaddedView
              sx={{
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 2,
                paddingTop: 2,
                paddingBottom: 2,
                // borderBottomWidth: 0.5,
                // borderBottomColor: palette.border,
              }}
            >
              {/* <GlassSelector /> */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-evenly",
                  flex: 1,
                }}
              >
                <TimeFrameSelector />
                <Toggle />
              </View>
            </PaddedView>
          </View>
        </View>
        <View
          style={{
            marginTop: GLOBAL_PADDING,
            gap: GLOBAL_PADDING,
            flexDirection: "column",
            zIndex: 99999
          }}
        >
          {viewMode === "list" ? (
            <AgentList
              isActive
              published
              scrollY={scrollY}
              pageInFocus={isFocused}
            />
          ) : (
            <AgentTable
              published={true}
              includeLatestAssessment={true}
              isActive={true}
            />
          )}
        </View>
      </AnimatedScrollView>
    </View>
  );
}
