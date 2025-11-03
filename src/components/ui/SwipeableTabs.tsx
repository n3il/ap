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
import { ScrollView } from '@/components/ui';
import { GlassContainer, GlassView } from 'expo-glass-effect';

const { width } = Dimensions.get('window');
const SCREEN_WIDTH = width - 32;

export interface SwipeableTab {
  key: string;
  title: string;
  content: ReactNode;
}

interface SwipeableTabsProps {
  tabs: SwipeableTab[];
  initialIndex?: number;
  onTabChange?: (index: number) => void;
  tabBarStyle?: ViewStyle;
  tabStyle?: ViewStyle;
  activeTabStyle?: ViewStyle;
  tabTextStyle?: TextStyle;
  activeTabTextStyle?: TextStyle;
  indicatorColor?: string;
  contentStyle?: ViewStyle;
}

export default function SwipeableTabs({
  tabs,
  initialIndex = 0,
  onTabChange,
  tabBarStyle,
  tabStyle,
  activeTabStyle,
  tabTextStyle,
  activeTabTextStyle,
  indicatorColor = '#007AFF',
  contentStyle,
}: SwipeableTabsProps) {
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
      <View style={[styles.pageContent, { width: SCREEN_WIDTH }]}>
        {item.content}
      </View>
    ),
    []
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
    <View style={styles.container}>
      {/* Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <GlassContainer
          spacing={10}
          style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}
        >
          {tabs.map((tab, index) => (
            <GlassView
              key={tab.key}
              glassEffectStyle="regular"
              style={{
                borderRadius: 32,
                paddingHorizontal: 8,
                marginHorizontal: 4,
              }}
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
                <Text
                  style={[
                    styles.tabText,
                    styles.tabText,
                    tabTextStyle,
                    currentIndex === index && [styles.activeTabText, activeTabTextStyle],
                  ]}
                >
                  {tab.title}
                </Text>
              </TouchableOpacity>
            </GlassView>
          ))}
        </GlassContainer>
      </ScrollView>

      {/* Content */}
      <FlatList
        ref={flatListRef}
        data={tabs}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        getItemLayout={getItemLayout}
        initialScrollIndex={initialIndex}
        style={[styles.flatList, contentStyle]}
        bounces={false}
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  flatList: {
    flex: 1,
  },
  pageContent: {
    flex: 1,
    marginHorizontal: 8,

  },
});
