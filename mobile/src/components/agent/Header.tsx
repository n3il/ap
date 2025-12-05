import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { Alert, type StyleProp, type ViewStyle } from "react-native";
import { ActivityIndicator, Text, View } from "@/components/ui";
import GlassButton from "@/components/ui/GlassButton";
import { supabase } from "@/config/supabase";
import { agentWatchlistService } from "@/services/agentWatchlistService";
import { useColors } from "@/theme";
import { RadarSpinner } from "@/components/ui/SpinningIcon";
import { useRouter } from "expo-router";

type Props = {
  agentId?: string;
  onBookmarkPress?: () => void;
  style?: StyleProp<ViewStyle>;
  timeframe?: string;
};

async function runAgentAssessment(agentId: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("You need to be signed in to run an assessment.");
  }

  const { data, error } = await supabase.functions.invoke(
    "run_agent_assessment",
    {
      body: { agent_id: agentId },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  );

  if (error) {
    throw new Error(error.message || "Failed to start assessment.");
  }

  return data;
}

export default function AgentHeader({
  agentId,
  agentName,
  onBookmarkPress,
  style,
  timeframe = "24h",
}: Props) {
  const router = useRouter()
  const { colors: palette } = useColors();
  const queryClient = useQueryClient();

  const { data: isWatchlisted = false, isLoading: isWatchlistLoading } =
    useQuery({
      queryKey: ["agent-watchlist", agentId],
      queryFn: () => agentWatchlistService.isWatchlisted(agentId as string),
      enabled: !!agentId,
    });

  const { mutateAsync: toggleWatchlist, isPending: isUpdatingWatchlist } =
    useMutation({
      mutationFn: async () => {
        if (!agentId) throw new Error("Agent is still loading.");
        if (isWatchlisted) {
          await agentWatchlistService.remove(agentId);
          return "removed";
        }
        await agentWatchlistService.add(agentId);
        return "added";
      },
      onSuccess: (action) => {
        queryClient.invalidateQueries({
          queryKey: ["agent-watchlist", agentId],
        });
        Alert.alert(
          "Watchlist updated",
          action === "added"
            ? "Agent added to your watchlist."
            : "Agent removed from your watchlist.",
        );
      },
      onError: (error: Error) => {
        Alert.alert("Unable to update watchlist", error.message);
      },
    });

  const { mutateAsync: runAssessment, isPending: isTriggeringAssessment } =
    useMutation({
      mutationFn: async () => {
        if (!agentId) throw new Error("Agent is still loading.");
        return runAgentAssessment(agentId);
      },

      // ⭐️ Optimistically add pending assessment
      onMutate: async () => {
        // Cancel queries so we don’t overwrite optimistic update
        await queryClient.cancelQueries({
          queryKey: ["agent-assessments", agentId],
        });

        const queryKeyWithTimeframe = [
          "agent-assessments",
          agentId,
          timeframe,
        ];
        const queryKeyBase = ["agent-assessments", agentId];

        const prevWithTimeframe = queryClient.getQueryData(
          queryKeyWithTimeframe,
        );
        const prevBase = queryClient.getQueryData(queryKeyBase);

        const optimisticAssessment = {
          id: `pending-${Date.now()}`,
          timestamp: new Date().toISOString(),
          status: "pending",
          agent_id: agentId,
        };

        const prependOptimistic = (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any, index: number) => {
              if (index !== 0 || !page?.data) return page;
              return {
                ...page,
                data: [optimisticAssessment, ...page.data],
              };
            }),
          };
        };

        queryClient.setQueryData(queryKeyWithTimeframe, prependOptimistic);
        queryClient.setQueryData(queryKeyBase, prependOptimistic);

        return { prevWithTimeframe, prevBase };
      },

      // Restore on error
      onError: (err, _, context) => {
        if (context?.prevWithTimeframe) {
          queryClient.setQueryData(
            ["agent-assessments", agentId, timeframe],
            context.prevWithTimeframe,
          );
        }
        if (context?.prevBase) {
          queryClient.setQueryData(
            ["agent-assessments", agentId],
            context.prevBase,
          );
        }
        Alert.alert("Unable to run assessment", err.message);
      },

      // Refetch real data
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["agent-assessments", agentId],
        });
      },
    });

  const handleToggleWatchlist = useCallback(async () => {
    try {
      await toggleWatchlist();
    } catch {
      // errors handled in onError
    }
  }, [toggleWatchlist]);

  const handleRunAssessment = useCallback(async () => {
    try {
      await runAssessment();
    } catch {
      // Error is surfaced via onError handler
    }
  }, [runAssessment]);

  const watchlistButtonDisabled = !agentId || isUpdatingWatchlist;
  const showWatchlistSpinner = isWatchlistLoading || isUpdatingWatchlist;
  const _watchlistIcon = isWatchlisted ? "binoculars" : "binoculars-outline";

  return (
    <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 1}}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <GlassButton
          onPress={() => router.back()}
          style={{
            flex: 0,
            flexGrow: 0,
            alignSelf: 'flex-start',
          }}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="white" />
        </GlassButton>
        <Text sx={{
          fontFamily: "monospace",
          fontWeight: "500",
          color: palette?.foreground,
          letterSpacing: 3,
          fontSize: 18,
        }}>
          {agentName}
        </Text>
      </View>
      <View style={[{ flexDirection: "row", alignSelf: 'flex-end' }, style]}>
        <GlassButton
          onPress={onBookmarkPress ?? handleToggleWatchlist}
          disabled={watchlistButtonDisabled}
          style={{
            width: 40,
            height: 40,
          }}
        >
          {showWatchlistSpinner ? (
            <ActivityIndicator size="small" color={palette.foreground} />
          ) : (
            <MaterialCommunityIcons
              name={"binoculars"}
              size={24}
              color={isWatchlisted ? palette?.accent : palette?.foreground}
            />
          )}
        </GlassButton>
        <GlassButton
          onPress={handleRunAssessment}
          disabled={!agentId || isTriggeringAssessment}
          style={{
            width: 40,
            height: 40,
          }}
        >
          <RadarSpinner isTriggeringAssessment={isTriggeringAssessment} palette={palette} />
        </GlassButton>
      </View>
    </View>
  );
}
