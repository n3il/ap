import React, { useState, useRef, ReactNode, useCallback } from 'react';
import {
  StyleSheet,
  Dimensions,
  Animated,
  ViewStyle,
  TextStyle,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ListRenderItemInfo,
} from 'react-native';
import View from '@/components/ui/View';
import Text from '@/components/ui/Text';
import TouchableOpacity from '@/components/ui/TouchableOpacity';
import ScrollView from '@/components/ui/ScrollView';
import { GlassContainer, GlassView } from 'expo-glass-effect';
import { GLOBAL_PADDING } from '@/components/ContainerView';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');
const SCREEN_WIDTH = width;

export interface SwipeableTab {
  key: string;
  title: string;
  content: ReactNode;
}

interface SwipeableTabsProps {
  tabs: SwipeableTab[];
  initialIndex?: number;
  onTabChange?: (index: number) => void;
  tabStyle?: ViewStyle;
  activeTabStyle?: ViewStyle;
  tabTextStyle?: TextStyle;
  activeTabTextStyle?: TextStyle;
  indicatorColor?: string;
  contentStyle?: ViewStyle;
  renderTab?: (tab: SwipeableTab, index: number, isActive: boolean) => ReactNode;
  tabWrapperStyle?: ViewStyle;
  tabContainerStyle?: ViewStyle;
  headerContent?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  hideTabBar?: boolean;
}

export default function SwipeableTabs({
  tabs,
  initialIndex = 0,
  onTabChange,
  tabStyle,
  activeTabStyle,
  tabTextStyle,
  activeTabTextStyle,
  indicatorColor = '#007AFF',
  contentStyle,
  renderTab,
  tabWrapperStyle,
  tabContainerStyle,
  headerContent,
  onRefresh,
  refreshing = false,
  hideTabBar = false,
}: SwipeableTabsProps) {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(initialIndex * SCREEN_WIDTH)).current;

  const handleTabPress = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const newIndex = Math.round(
        event.nativeEvent.contentOffset.x / SCREEN_WIDTH
      );
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
        onTabChange?.(newIndex);
      }
    },
    [currentIndex, onTabChange]
  );

  const tabWidth = SCREEN_WIDTH / tabs.length;

  const indicatorTranslateX = scrollX.interpolate({
    inputRange: tabs.map((_, i) => i * SCREEN_WIDTH),
    outputRange: tabs.map((_, i) => i * tabWidth),
    extrapolate: 'clamp',
  });

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<SwipeableTab>) => (
      <View style={[styles.pageContent, contentStyle]}>
        {item.content}
      </View>
    ),
    [contentStyle]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    []
  );

  return (
    <>
      {!hideTabBar && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
        >
          <GlassContainer
            spacing={10}
            style={[
              { flexDirection: 'row', gap: 8, marginBottom: 12, paddingHorizontal: GLOBAL_PADDING },
              tabContainerStyle,
            ]}
          >
            {tabs.map((tab, index) => (
              <GlassView
                key={tab.key}
                glassEffectStyle="clear"
                style={[
                  {
                    borderRadius: 32,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    marginHorizontal: 4,

                  },
                  tabWrapperStyle,
                ]}
                tintColor={theme.colors.surface}
              >
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => handleTabPress(index)}
                  style={[
                    styles.tab,
                    tabStyle,
                    currentIndex === index && [styles.activeTab, activeTabStyle],
                  ]}
                  activeOpacity={0.8}
                >
                  {renderTab ? (
                    renderTab(tab, index, currentIndex === index)
                  ) : (
                    <Text
                      style={[
                        styles.tabText,
                        tabTextStyle,
                        currentIndex === index && [styles.activeTabText, activeTabTextStyle],
                      ]}
                    >
                      {tab.title}
                    </Text>
                  )}
                </TouchableOpacity>
              </GlassView>
            ))}
          </GlassContainer>
        </ScrollView>
      )}

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
        initialScrollIndex={initialIndex}
        bounces={false}
        decelerationRate="fast"
        style={{ flex: 1, paddingVertical: 2 }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  tabBarContent: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 8,
  },
  tab: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    paddingHorizontal: 8
  },
  activeTab: {},
  tabText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  activeTabText: {
    color: 'rgba(255, 255, 255, 1)',
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
  },
  pageContent: {
    flex: 1,
    paddingHorizontal: GLOBAL_PADDING,
    width: SCREEN_WIDTH,
  },
});
