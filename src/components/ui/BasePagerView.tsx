import React, { useState, useRef, ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import View from '@/components/ui/View';
import Text from '@/components/ui/Text';
import ScrollView from '@/components/ui/ScrollView';
import TouchableOpacity from '@/components/ui/TouchableOpacity';
import { GlassContainer, GlassView } from 'expo-glass-effect';

interface Tab {
  key: string;
  label: string;
  content: ReactNode;
}

interface BasePagerViewProps {
  tabs: Tab[];
  initialPage?: number;
  onPageChange?: (page: number) => void;
  tabBarContainerStyle?: any;
  tabBarContentStyle?: any;
  tabStyle?: any;
  activeTabStyle?: any;
  tabTextStyle?: any;
  activeTabTextStyle?: any;
}

export default function BasePagerView({
  tabs,
  initialPage = 0,
  onPageChange,
  tabBarContainerStyle,
  tabBarContentStyle,
  tabStyle,
  activeTabStyle,
  tabTextStyle,
  activeTabTextStyle,
}: BasePagerViewProps) {
  const [page, setPage] = useState(initialPage);
  const pagerRef = useRef<PagerView>(null);

  const handleTitlePress = (index: number) => {
    pagerRef.current?.setPage(index);
    setPage(index);
    onPageChange?.(index);
  };

  const handlePageSelected = (e: any) => {
    const position = e.nativeEvent.position;
    setPage(position);
    onPageChange?.(position);
  };

  return (
    <>
      {/* Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.tabBarContent, tabBarContentStyle]}
      >
        <GlassContainer
          spacing={10}
          style={{ flexDirection: 'row', gap: 8 }}
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
                onPress={() => handleTitlePress(index)}
                style={[
                  styles.tab,
                  tabStyle,
                  page === index && [styles.activeTab, activeTabStyle],
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabText,
                    styles.tabText,
                    tabTextStyle,
                    page === index && [styles.activeTabText, activeTabTextStyle],
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            </GlassView>
          ))}
        </GlassContainer>
      </ScrollView>

      {/* Pager View */}
      <PagerView
        style={styles.pagerView}
        initialPage={initialPage}
        ref={pagerRef}
        onPageSelected={handlePageSelected}
      >
        {tabs.map((tab) => (
          <View style={styles.page} key={tab.key}>
            {tab.content}
          </View>
        ))}
      </PagerView>
    </>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    maxHeight: 24,
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
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
    minHeight: 1000,
    paddingVertical: 24,
    justifyContent: 'flex-start',
  },
});
