import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator } from "dripsy";
import { useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { Pressable, ScrollView } from "react-native";
import { Avatar, Text, View } from "@/components/ui";
import { ROUTES } from "@/config/routes";
import { useAccountBalance } from "@/hooks/useAccountBalance";
import { agentService } from "@/services/agentService";
import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { useColors } from "@/theme";
import type { AgentType } from "@/types/agent";
import { formatAmount, formatPercent, sentimentToColor } from "@/utils/currency";

interface AgentTableProps {
  userId?: string | null;
  published?: boolean;
  includeLatestAssessment?: boolean;
  isActive?: boolean | null;
  isBookmarked?: boolean;
  emptyState?: React.ReactNode;
}

function TableRow({ agent, idx }: { agent: AgentType; idx: number }) {
  const router = useRouter();
  const { colors: palette } = useColors();
  const accountData = useAccountBalance({ agent });

  const handlePress = useCallback(() => {
    router.push({
      pathname: ROUTES.AGENT_ID.path,
      params: { id: agent.id, name: agent.name },
    } as any);
  }, [router, agent]);

  const latestAssessment = agent.latest_assessment?.parsed_llm_response;
  const sentiment = latestAssessment?.headline?.sentiment_word;
  const sentimentScore = latestAssessment?.headline?.sentiment_score;

  return (
    <Pressable onPress={handlePress}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderTopWidth: 1,
          borderTopColor: palette.border,
        }}
      >
        {/* Agent Name & Avatar */}
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Avatar
            size="xs"
            src={agent.avatar_url}
            // name={agent.name.slice(0, 70)}
            backgroundColor={palette.providers[agent.llm_provider]}
          />
        </View>

        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Text variant="sm" style={{ fontWeight: "600" }}>
            {formatAmount(accountData.equity, { showUnits: [] })}
          </Text>
        </View>

        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Text
            variant="sm"
            style={{
              fontWeight: "600",
              color: Number(accountData?.totalPnlPercent) >= 0 ? "#10b981" : "#ef4444",
            }}
          >
            {formatPercent(accountData?.totalPnlPercent)}
          </Text>
        </View>

        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Text
            variant="sm"
            style={{
              fontWeight: "600",
              color: Number(accountData?.openPnlPct) >= 0 ? "#10b981" : "#ef4444",
            }}
          >
            {formatPercent(accountData?.openPnlPct)}
          </Text>
        </View>

        {/* Sentiment */}
        <View style={{ flex: 1, alignItems: "center" }}>
          {sentiment ? (
            <Text
              variant="xs"
              style={{
                color: sentimentToColor(sentimentScore),
                fontWeight: "500",
                textTransform: "capitalize",
              }}
            >
              {sentimentScore}
            </Text>
          ) : (
            <Text variant="xs" style={{ color: palette.surfaceForeground }}>
              -
            </Text>
          )}
        </View>

        {/* Positions */}
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Text variant="sm" style={{ fontWeight: "500" }}>
            {accountData.openPositions.length}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function AgentTable({
  userId = undefined,
  published = true,
  includeLatestAssessment = true,
  isActive = null,
  isBookmarked = false,
  emptyState,
}: AgentTableProps) {
  const { colors: palette } = useColors();
  const setAgents = useExploreAgentsStore((state) => state.setAgents);

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

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 12,
        marginHorizontal: 10,
        overflow: "hidden",
      }}
    >
      {/* Table Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          paddingHorizontal: 16,
          // backgroundColor: palette.surface,
          // borderBottomWidth: 1,
          borderBottomColor: palette.border,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text variant="xs" style={{ fontWeight: "700", textTransform: "uppercase" }}>
            Agent
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Text variant="xs" style={{ fontWeight: "700", textTransform: "uppercase" }}>
            ($)
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Text variant="xs" style={{ fontWeight: "700", textTransform: "uppercase" }}>
            Open
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text variant="xs" style={{ fontWeight: "700", textTransform: "uppercase" }}>
            All
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text variant="xs" style={{ fontWeight: "700", textTransform: "uppercase" }}>
            S
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Text variant="xs" style={{ fontWeight: "700", textTransform: "uppercase" }}>
            #
          </Text>
        </View>
      </View>

      {/* Table Body */}
      <ScrollView style={{ maxHeight: 600 }}>
        {agents.map((agent, idx) => (
          <TableRow key={agent.id} agent={agent} />
        ))}
      </ScrollView>
    </View>
  );
}
