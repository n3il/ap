import { GlassContainer } from "expo-glass-effect";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  type LayoutChangeEvent,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { GLOBAL_PADDING } from "@/components/ContainerView";
import ScrollView from "@/components/ui/ScrollView";
import Text from "@/components/ui/Text";
import View from "@/components/ui/View";
import { useTheme } from "@/contexts/ThemeContext";

const { width } = Dimensions.get("window");
const SCREEN_WIDTH = width;

type TabContentRenderer = () => ReactNode;
type TabContent = ReactNode | TabContentRenderer;

export interface SwipeableTab {
  key: string;
  title: string;
  content: TabContent;
  isCompleted?: boolean;
}

interface SwipeableTabsProps {
  tabs: SwipeableTab[];
  initialIndex?: number;
  activeIndex?: number;
  onTabChange?: (index: number) => void;
  tabStyle?: ViewStyle;
  activeTabStyle?: ViewStyle;
  tabTextStyle?: TextStyle;
  activeTabTextStyle?: TextStyle;
  indicatorColor?: string;
  contentStyle?: ViewStyle;
  renderTab?: (
    tab: SwipeableTab,
    index: number,
    isActive: boolean,
  ) => ReactNode;
  tabContainerStyle?: ViewStyle;
  onRefresh?: () => void;
  refreshing?: boolean;
  hideTabBar?: boolean;
  stickyTabBar?: boolean;
  contentContainerStyle?: ViewStyle;
}

export default function SwipeableTabs({
  tabs,
  initialIndex = 0,
  activeIndex,
  onTabChange,
  indicatorColor = "#007AFF",
  contentStyle,
  renderTab,
  tabContainerStyle,
  onRefresh,
  refreshing = false,
  hideTabBar = false,
  stickyTabBar = false,
  contentContainerStyle,
}: SwipeableTabsProps) {
  const { theme } = useTheme();
  const isControlled = typeof activeIndex === "number";
  const startIndex = isControlled ? (activeIndex as number) : initialIndex;
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [tabLayouts, setTabLayouts] = useState<
    Record<string, { x: number; width: number }>
  >({});
  const [loadedTabs, setLoadedTabs] = useState<Set<number>>(
    () => new Set([startIndex]),
  );
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(
    new Animated.Value(startIndex * SCREEN_WIDTH),
  ).current;

  useEffect(() => {
    if (isControlled) return;
    setLoadedTabs((prev) => {
      if (prev.has(initialIndex)) return prev;
      const next = new Set(prev);
      next.add(initialIndex);
      return next;
    });
  }, [initialIndex, isControlled]);

  useEffect(() => {
    if (!isControlled) return;
    if (typeof activeIndex !== "number") return;

    setLoadedTabs((prev) => {
      if (prev.has(activeIndex)) return prev;
      const next = new Set(prev);
      next.add(activeIndex);
      return next;
    });

    if (activeIndex !== currentIndex) {
      setCurrentIndex(activeIndex);
      flatListRef.current?.scrollToIndex({ index: activeIndex, animated: true });
    }
  }, [activeIndex, currentIndex, isControlled]);

  const markTabLoaded = useCallback((index: number) => {
    setLoadedTabs((prev) => {
      if (prev.has(index)) return prev;
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  const handleTabPress = useCallback(
    (index: number) => {
      markTabLoaded(index);
      flatListRef.current?.scrollToIndex({ index, animated: true });
      if (!isControlled) {
        setCurrentIndex(index);
      }
      onTabChange?.(index);
    },
    [isControlled, markTabLoaded, onTabChange],
  );

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false },
  );

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const newIndex = Math.round(
        event.nativeEvent.contentOffset.x / SCREEN_WIDTH,
      );
      if (newIndex !== currentIndex && !isControlled) {
        setCurrentIndex(newIndex);
      }
      if (newIndex !== currentIndex) {
        onTabChange?.(newIndex);
      }
      markTabLoaded(newIndex);
    },
    [currentIndex, isControlled, onTabChange, markTabLoaded],
  );

  const tabWidth = SCREEN_WIDTH / tabs.length;
  const defaultIndicatorWidth = Math.max(24, tabWidth * 0.6);

  const handleTabLayout = useCallback(
    (key: string, event: LayoutChangeEvent) => {
      const { x, width: measuredWidth } = event.nativeEvent.layout;
      setTabLayouts((prev) => {
        const existing = prev[key];
        if (
          existing &&
          Math.abs(existing.x - x) < 0.5 &&
          Math.abs(existing.width - measuredWidth) < 0.5
        ) {
          return prev;
        }
        return { ...prev, [key]: { x, width: measuredWidth } };
      });
    },
    [],
  );

  const indicatorMetrics = tabs.map((tab, index) => {
    const layout = tabLayouts[tab.key];
    if (layout) {
      return layout;
    }

    const fallbackX =
      GLOBAL_PADDING +
      index * tabWidth +
      (tabWidth - defaultIndicatorWidth) / 2;

    return { x: fallbackX, width: defaultIndicatorWidth };
  });

  const inputRange = tabs.map((_, i) => i * SCREEN_WIDTH);

  const indicatorTranslateX = scrollX.interpolate({
    inputRange,
    outputRange: indicatorMetrics.map((metric) => metric.x),
    extrapolate: "clamp",
  });

  const indicatorAnimatedWidth = scrollX.interpolate({
    inputRange,
    outputRange: indicatorMetrics.map((metric) => metric.width),
    extrapolate: "clamp",
  });

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<SwipeableTab>) => {
      const isLoaded = loadedTabs.has(index);
      let content: ReactNode = null;

      if (isLoaded) {
        const maybeRenderer = item.content;
        content =
          typeof maybeRenderer === "function"
            ? (maybeRenderer as TabContentRenderer)()
            : maybeRenderer;
      }

      return (
        <View
          style={[
            {
              flex: 1,
              paddingTop: 8,
              paddingHorizontal: 0,
              width: SCREEN_WIDTH,
            },
            contentStyle,
          ]}
        >
          {content}
        </View>
      );
    },
    [contentStyle, loadedTabs],
  );

  const getItemLayout = useCallback(
    (_: SwipeableTab[] | null | undefined, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    [],
  );

  const tabBarContent = !hideTabBar && (
    <View
      style={
        stickyTabBar ? { backgroundColor: theme.colors.background } : undefined
      }
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
      >
        <View style={{ position: "relative" }}>
          <GlassContainer
            spacing={10}
            style={[
              {
                flexDirection: "row",
                gap: 2,
                paddingVertical: 4,
                marginTop: 8,
                paddingHorizontal: GLOBAL_PADDING,
              },
              tabContainerStyle,
            ]}
          >
            {tabs.map((tab, index) =>
              renderTab ? (
                renderTab(tab, index, currentIndex === index)
              ) : (
                <Pressable
                  key={tab.key}
                  style={{
                    alignSelf: "flex-start",
                    borderRadius: 16,
                    paddingHorizontal: 8,
                  }}
                  onPress={() => handleTabPress(index)}
                  onLayout={(event) => handleTabLayout(tab.key, event)}
                >
                  <Text
                    style={[
                      {
                        fontSize: 12,
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: 1.1,
                        color: theme.colors.foreground,
                        opacity: 0.3,
                      },
                      currentIndex === index && [
                        {
                          color: theme.colors.foreground,
                          fontWeight: "600",
                          opacity: 1,
                        },
                      ],
                    ]}
                  >
                    {tab.title}
                  </Text>
                </Pressable>
              ),
            )}
          </GlassContainer>
          <Animated.View
            style={{
              position: "absolute",
              bottom: 0,
              height: 2,
              width: indicatorAnimatedWidth,
              backgroundColor: indicatorColor,
              transform: [{ translateX: indicatorTranslateX }],
            }}
          />
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {tabBarContent}
      <FlatList
        ref={flatListRef}
        data={tabs}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        horizontal
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="start"
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        getItemLayout={getItemLayout}
        initialScrollIndex={startIndex}
        bounces={false}
        decelerationRate="fast"
        refreshing={refreshing}
        onRefresh={onRefresh}
        extraData={loadedTabs}
      />
    </View>
  );
}
