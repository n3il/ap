import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AgentList from "@/components/AgentList";
import AgentTable from "@/components/AgentTable";
import MultiAgentChart from "@/components/agents/MultiAgentChart";
import { PaddedView } from "@/components/ContainerView";
import TimeFrameSelector from "@/components/chart/TimeFrameSelector";
import ExploreHeader from "@/components/explore/Header";
import MarketPricesWidget from "@/components/MarketPricesWidget";
import { RefreshControl, View } from "@/components/ui";
import GlassSelector from "@/components/ui/GlassSelector";
import { useTimeframeStore } from "@/stores/useTimeframeStore";
import { useColors } from "@/theme";
import { Ionicons } from "@expo/vector-icons";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function ExploreScreen() {
  const [isFetching, setIsFetching] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "table">("list");
  const queryClient = useQueryClient();
  const colors = useColors();
  const palette = colors.colors;
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

  const [widgetExpanded, setWidgetExpanded] = useState(false)
  const handleAssetPressCallback = useCallback(() => {
    setWidgetExpanded(!widgetExpanded)
  }, [widgetExpanded])

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
              scrollY={widgetExpanded ? scrollY : { value: 9000 }}
              style={{
                marginVertical: 3,
              }}
              onPress={handleAssetPressCallback}
            />
            <MultiAgentChart
              scrollY={scrollY}
            />

            <PaddedView
              sx={{
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 2,
                // paddingTop: 2,
                paddingBottom: 2,
                borderBottomWidth: 0.5,
                borderBottomColor: palette.border,
              }}
            >
              <GlassSelector />
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <TimeFrameSelector />
                <Pressable
                  onPress={() =>
                    setViewMode((prev) => (prev === "list" ? "table" : "list"))
                  }
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    borderColor: palette.border,
                  }}
                >
                  <Ionicons
                    name={viewMode === "list" ? "grid-outline" : "list-outline"}
                    size={18}
                    color={palette.foreground}
                  />
                </Pressable>
              </View>
            </PaddedView>
          </View>
        </View>
        <View
          style={{
            marginTop: 18,
            gap: 18,
            flexDirection: "column"
          }}
        >
          {viewMode === "list" ? (
            <AgentList
              queryKey={["explore-agents"]}
              isActive
              scrollY={scrollY}
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
