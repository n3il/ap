import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { Alert, StyleProp, ViewStyle } from "react-native";
import { ActivityIndicator, View } from "@/components/ui";
import GlassButton from "@/components/ui/GlassButton";
import { supabase } from "@/config/supabase";
import { agentWatchlistService } from "@/services/agentWatchlistService";
import { useColors } from "@/theme";

type Props = {
  agentId?: string;
  onBookmarkPress?: () => void;
  style?: StyleProp<ViewStyle>;
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

export default function AgentHeader({ agentId, onBookmarkPress, style }: Props) {
  const { colors: palette } = useColors();
  const queryClient = useQueryClient();

  const { data: isWatchlisted = false, isLoading: isWatchlistLoading } = useQuery({
    queryKey: ["agent-watchlist", agentId],
    queryFn: () => agentWatchlistService.isWatchlisted(agentId as string),
    enabled: !!agentId,
  });

  const {
    mutateAsync: toggleWatchlist,
    isPending: isUpdatingWatchlist,
  } = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["agent-watchlist", agentId] });
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

  const {
    mutateAsync: runAssessment,
    isPending: isTriggeringAssessment,
  } = useMutation({
    mutationFn: async () => {
      if (!agentId) {
        throw new Error("Agent is still loading.");
      }
      return runAgentAssessment(agentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
      queryClient.invalidateQueries({ queryKey: ["agent-assessments", agentId] });
      queryClient.invalidateQueries({ queryKey: ["sentimentScores", agentId] });
      Alert.alert("Assessment triggered", "We'll notify you when it's ready.");
    },
    onError: (error: Error) => {
      Alert.alert("Unable to run assessment", error.message);
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
  const watchlistIcon = isWatchlisted ? "binoculars" : "binoculars-outline";

  return (
    <View style={[{ flexDirection: "row" }, style]}>
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
        {isTriggeringAssessment ? (
          <ActivityIndicator size="small" color={palette.foreground} />
        ) : (
          <MaterialCommunityIcons
            name="radar"
            size={24}
            color={palette.foreground}
          />
        )}
      </GlassButton>
    </View>
  );
}
