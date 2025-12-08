import { useInfiniteQuery } from "@tanstack/react-query";
import React, { useCallback, useRef } from "react";
import { Animated, Text, View } from "react-native";
import AssessmentCard from "@/components/AssessmentCard";
import { assessmentService } from "@/services/assessmentService";

export default function ThoughtsTab({
  agentId,
  onRefresh: parentOnRefresh,
  refreshing: parentRefreshing = false,
  listProps = {},
}) {
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
    queryKey: ["agent-assessments", agentId],
    queryFn: ({ pageParam = 0 }) =>
      assessmentService.getAssessmentsByAgent(agentId, {
        pageParam,
        pageSize: 2,
        statuses: ["completed", "in_progress", "error"],
      }),
    getNextPageParam: (lastPage) => lastPage?.nextPage ?? undefined,
    initialPageParam: 0,
    enabled: !!agentId,
  });

  // Flatten the paginated data and deduplicate by ID
  const assessments = React.useMemo(() => {
    if (!data?.pages) return [];

    const allAssessments = data.pages.flatMap((page) => page?.data ?? []);

    // Deduplicate by ID (in case of overlapping pages)
    const seen = new Set();
    return allAssessments.filter((assessment) => {
      if (seen.has(assessment.id)) {
        return false;
      }
      seen.add(assessment.id);
      return true;
    });
  }, [data]);

  const _totalCount = data?.pages?.[0]?.totalCount ?? 0;

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleRefresh = () => {
    refetch();
    parentOnRefresh?.();
  };

  const renderItem = useCallback(
    ({ item }) => <AssessmentCard assessment={item} />,
    [],
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;

    return (
      <Text
        style={{
          color: "#999",
          textAlign: "center",
          paddingVertical: 12,
          fontSize: 12,
          fontStyle: "italic",
          marginTop: 18,
        }}
      >
        empty
      </Text>
    );
  }, [isLoading]);

  const keyExtractor = useCallback((item) => item.id, []);

  if (error && !data) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "#999", fontSize: 12 }}>
          {error.message || "An error occurred while loading assessments"}
        </Text>
      </View>
    );
  }

  return (
    <Animated.FlatList
      data={assessments}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListEmptyComponent={renderEmpty}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      refreshing={isRefetching || parentRefreshing}
      onRefresh={handleRefresh}
      contentContainerStyle={{ gap: 16, paddingBottom: "40%" }}
      showsVerticalScrollIndicator={false}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true },
      )}
      scrollEventThrottle={16}
      {...listProps}
    />
  );
}
