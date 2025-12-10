import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator } from "dripsy";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent, ViewStyle } from "react-native";
import { type SharedValue, useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Text, View } from "@/components/ui";
import { ROUTES } from "@/config/routes";
import { agentService } from "@/services/agentService";
import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import AgentCard from "./AgentCard";

const ANIM_COMPLETE_SCROLL_Y = 200;

interface AgentListProps {
  emptyState?: React.ReactNode;
  userId?: string | null;
  published?: boolean;
  includeLatestAssessment?: boolean;
  isActive?: boolean | null;
  isBookmarked?: boolean;
  hideOpenPositions?: boolean;
  scrollY?: SharedValue<number> | null;
  style?: ViewStyle;
}

interface ItemLayouts {
  [key: string]: {
    y: number;
    height: number;
  };
}

export default function AgentList({
  emptyState,
  userId = undefined,
  published = true,
  includeLatestAssessment = true,
  isActive = null,
  isBookmarked = false,
  hideOpenPositions = false,
  scrollY = null, // Animated scroll position
  style = {},
}: AgentListProps) {
  const router = useRouter();
  const setAgents = useExploreAgentsStore((state) => state.setAgents);
  const itemLayoutsRef = useRef<ItemLayouts>({});
  const [activeAgentId, setActiveAgentId] = useState();

  const {
    data: agents = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "agent-list",
      userId,
      published,
      includeLatestAssessment,
      isActive,
      isBookmarked,
    ],
    queryFn: () =>
      agentService.getAgents({
        published,
        includeLatestAssessment,
        isActive,
        isBookmarked,
        userId,
      }),
  });

  useEffect(() => {
    if (agents?.length) {
      setAgents(agents);
    }
  }, [agents, setAgents]);

  const onAgentPress = useCallback(
    (agent: Agent) => {
      router.push({
        pathname: ROUTES.AGENT_ID.path,
        params: { id: agent.id, name: agent.name },
      } as any);
    },
    [router],
  );

  // Calculate which agent is active based on scroll position
  const calculateActiveAgent = useCallback(
    (scrollPosition: number) => {
      let closestAgent = null;
      let smallestDistance = Infinity;

      Object.entries(itemLayoutsRef.current).forEach(([agentId, layout]) => {
        // Calculate distance from active zone (top 30% of screen)
        const itemMiddle = layout.y + layout.height / 2;
        const distance = Math.abs(
          itemMiddle - scrollPosition - ANIM_COMPLETE_SCROLL_Y,
        );

        if (distance < smallestDistance) {
          smallestDistance = distance;
          closestAgent = agentId;
        }
      });

      if (closestAgent !== activeAgentId) {
        setActiveAgentId(closestAgent);
      }
    },
    [activeAgentId, setActiveAgentId],
  );

  // Track scroll position changes with Reanimated
  useAnimatedReaction(
    () => {
      return scrollY && "value" in scrollY ? scrollY.value : 0;
    },
    (currentScroll, previous) => {
      if (scrollY && currentScroll !== previous) {
        scheduleOnRN(calculateActiveAgent, currentScroll);
      }
    },
  );

  // Handle item layout
  const handleItemLayout = useCallback(
    (agentId: string, event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout;
      itemLayoutsRef.current[agentId] = { y, height };
    },
    [],
  );

  if (isLoading || isFetching) {
    return (
      <View
        sx={{
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 16,
        }}
      >
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (!agents.length) {
    return (
      emptyState || (
        <View
          sx={{
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 16,
          }}
        >
          <Text
            variant="md"
            tone="muted"
            sx={{ marginBottom: 2, fontWeight: "600" }}
          >
            uhh,
          </Text>
          <Text variant="md" tone="muted" sx={{ textAlign: "center" }}>
            the robots went missing.
          </Text>
        </View>
      )
    );
  }

  return agents.map((agent) => (
    <AgentCard
      key={agent.id}
      agent={agent}
      onPress={() => onAgentPress?.(agent)}
      isActive={activeAgentId === agent.id}
      style={style}
      onLayout={(event) => handleItemLayout(agent.id, event)}
    />
  ));
}
