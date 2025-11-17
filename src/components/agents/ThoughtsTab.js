import React, { useRef } from 'react';
import { View, Text, ActivityIndicator, FlatList, Animated } from 'react-native';
import AssessmentCard from '@/components/AssessmentCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassContainer, GlassView } from 'expo-glass-effect';
import SectionTitle from '../SectionTitle';
import { useColors } from '@/theme';
import { useInfiniteQuery } from '@tanstack/react-query';
import { assessmentService } from '@/services/assessmentService';

export default function ThoughtsTab({
  agentId,
  isOwnAgent,
  pendingAssessment = false,
  headerContent,
  tabBar,
  onRefresh: parentOnRefresh,
  refreshing: parentRefreshing = false
}) {
  const { info, error: errorColor } = useColors();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Fetch assessments for this agent with infinite scroll
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['agent-assessments', agentId],
    queryFn: ({ pageParam = 0 }) =>
      assessmentService.getAssessmentsByAgent(agentId, { pageParam, pageSize: 10 }),
    getNextPageParam: (lastPage) => lastPage?.nextPage ?? undefined,
    initialPageParam: 0,
    enabled: !!agentId && isOwnAgent,
  });

  // Flatten the paginated data and deduplicate by ID
  const assessments = React.useMemo(() => {
    if (!data?.pages) return [];

    const allAssessments = data.pages.flatMap(page => page?.data ?? []);

    // Deduplicate by ID (in case of overlapping pages)
    const seen = new Set();
    return allAssessments.filter(assessment => {
      if (seen.has(assessment.id)) {
        return false;
      }
      seen.add(assessment.id);
      return true;
    });
  }, [data]);

  const totalCount = data?.pages?.[0]?.totalCount ?? 0;

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleRefresh = () => {
    refetch();
    parentOnRefresh?.();
  };

  const renderSectionHeader = () => (
    <SectionTitle>
      All Assessments ({totalCount + (pendingAssessment ? 1 : 0)})
    </SectionTitle>
  );

  const renderHeader = () => (
    <>
      {headerContent}
      {renderSectionHeader()}

      {isLoading && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingVertical: 16 }}>
          <ActivityIndicator size="small" color={info} />
          <Text style={{ color: '#999', fontSize: 12 }}>
            Loading assessments...
          </Text>
        </View>
      )}

      {error && (
        <GlassView
          variant="glass"
          style={{
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={24}
              color={errorColor}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: '#ff6b6b',
                  fontWeight: '600',
                  fontSize: 14,
                  marginBottom: 4,
                }}
              >
                Failed to Load Assessments
              </Text>
              <Text
                style={{
                  color: '#999',
                  fontSize: 12,
                }}
              >
                {error.message || 'An error occurred while loading assessments'}
              </Text>
            </View>
          </View>
        </GlassView>
      )}

      {!isLoading && !error && pendingAssessment && (
        <GlassView
          variant="glass"
          style={{
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            paddingVertical: 4,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <ActivityIndicator size="small" color={info} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: '#4dabf7',
                  fontWeight: '600',
                  fontSize: 14,
                  marginBottom: 4,
                }}
              >
                Assessment Running...
              </Text>
              <Text
                style={{
                  color: '#999',
                  fontSize: 12,
                }}
              >
                Your agent is analyzing the market and generating insights
              </Text>
            </View>
            <MaterialCommunityIcons
              name="timer-sand"
              size={24}
              color={info}
            />
          </View>
        </GlassView>
      )}
    </>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;

    return (
      <View style={{ paddingVertical: 16, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={info} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <Text style={{ color: '#999', textAlign: 'center', paddingVertical: 12, fontSize: 12 }}>
        No assessments yet
      </Text>
    );
  };

  if (error && !data) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#999', fontSize: 12 }}>
          {error.message || 'An error occurred while loading assessments'}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        style={{
          position: 'absolute',
          top: 90,
          left: 0,
          right: 0,
          zIndex: 100,
          transform: [{
            translateY: scrollY.interpolate({
              inputRange: [-100, 0, 100],
              outputRange: [200, 100, 0],
            })
          }],
        }}
      >
        {tabBar}
      </Animated.View>
      <Animated.FlatList
        data={assessments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AssessmentCard assessment={item} />}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshing={isRefetching || parentRefreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={{ gap: 16, paddingBottom: '40%', paddingTop: 30 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />
    </View>
  );
}
