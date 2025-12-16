import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import ContainerView from "@/components/ContainerView";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBadge,
  Text,
  TouchableOpacity,
  View,
} from "@/components/ui";
import { usePrivy } from "@privy-io/expo";
import { agentService } from "@/services/agentService";
import { useColors } from "@/theme";

const AgentManageScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const agentId = Array.isArray(id) ? id[0] : id;
  const queryClient = useQueryClient();
  const { user } = usePrivy();
  const colors = useColors();

  const {
    data: agent,
    isLoading: agentLoading,
    error: agentError,
  } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: () => agentService.getAgent(agentId),
    enabled: !!agentId,
  });

  const isOwnAgent = useMemo(() => {
    if (!agent || !user) return false;
    return agent.user_id === user.id;
  }, [agent, user]);

  const deleteAgentMutation = useMutation({
    mutationFn: () => agentService.deleteAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries(["agents"]);
      router.replace("/(tabs)/agents");
    },
    onError: (error) => {
      Alert.alert("Error", `Failed to delete agent: ${error.message}`);
    },
  });

  const publishAgentMutation = useMutation({
    mutationFn: () => agentService.publishAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries(["agent", agentId]);
      queryClient.invalidateQueries(["agents"]);
      queryClient.invalidateQueries(["published-agents"]);
    },
    onError: (error) => {
      Alert.alert("Error", `Failed to share agent: ${error.message}`);
    },
  });

  const unpublishAgentMutation = useMutation({
    mutationFn: () => agentService.unpublishAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries(["agent", agentId]);
      queryClient.invalidateQueries(["agents"]);
      queryClient.invalidateQueries(["published-agents"]);
    },
    onError: (error) => {
      Alert.alert("Error", `Failed to make agent private: ${error.message}`);
    },
  });

  const handlePublishToggle = () => {
    if (!agent) return;
    if (agent.published_at) {
      Alert.alert(
        "Make Private",
        "This agent will be removed from Explore. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Make Private",
            style: "destructive",
            onPress: () => unpublishAgentMutation.mutate(),
          },
        ],
      );
    } else {
      publishAgentMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (!agent) return;
    Alert.alert(
      "Delete Agent",
      "Are you sure you want to delete this agent? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteAgentMutation.mutate(),
        },
      ],
    );
  };

  const handleGoBack = () => {
    router.back();
  };

  if (agentLoading) {
    return (
      <ContainerView style={{ flex: 1 }}>
        <View sx={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.colors.foreground} />
        </View>
      </ContainerView>
    );
  }

  if (agentError || !agent) {
    return (
      <ContainerView style={{ flex: 1 }}>
        <View
          sx={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 6,
          }}
        >
          <Text
            tone="muted"
            sx={{ textAlign: "center", marginBottom: 4, color: "error" }}
          >
            Error loading agent settings
          </Text>
          <TouchableOpacity
            onPress={handleGoBack}
            sx={{
              backgroundColor: "purple500",
              paddingHorizontal: 6,
              paddingVertical: 3,
              borderRadius: "xl",
            }}
          >
            <Text sx={{ color: "textPrimary", fontWeight: "600" }}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </ContainerView>
    );
  }

  if (!isOwnAgent) {
    return (
      <ContainerView style={{ flex: 1 }}>
        <View
          sx={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 6,
          }}
        >
          <Text tone="muted" sx={{ textAlign: "center", marginBottom: 4 }}>
            Only the agent owner can edit publishing settings.
          </Text>
          <TouchableOpacity
            onPress={handleGoBack}
            sx={{
              backgroundColor: "purple500",
              paddingHorizontal: 6,
              paddingVertical: 3,
              borderRadius: "xl",
            }}
          >
            <Text sx={{ color: "textPrimary", fontWeight: "600" }}>Return</Text>
          </TouchableOpacity>
        </View>
      </ContainerView>
    );
  }

  return (
    <ContainerView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}>
        <View sx={{ paddingTop: 16, paddingBottom: 6, paddingHorizontal: 6 }}>
          <View
            sx={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 4,
            }}
          >
            <View sx={{ flexShrink: 1, paddingRight: 4 }}>
              <Text
                sx={{
                  color: "textPrimary",
                  fontSize: 30,
                  fontWeight: "700",
                  marginBottom: 2,
                  lineHeight: 36,
                }}
              >
                {agent.name}
              </Text>
              <Text
                variant="lg"
                sx={{ color: "mutedForeground", marginBottom: 1 }}
              >
                {agent.model_name}
              </Text>
              <Text variant="sm" sx={{ color: "secondary500" }}>
                {agent.llm_provider}
              </Text>
            </View>
            <View sx={{ alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
              <StatusBadge>{agent.is_active ? "ACTIVE" : "PAUSED"}</StatusBadge>
              <StatusBadge variant="info">
                {agent.published_at ? "SHARED" : "PRIVATE"}
              </StatusBadge>
            </View>
          </View>
        </View>

        <View sx={{ paddingHorizontal: 6, marginBottom: 6, marginTop: 4 }}>
          <View sx={{ gap: 3 }}>
            <TouchableOpacity
              onPress={handlePublishToggle}
              sx={{
                borderRadius: "xl",
                paddingVertical: 4,
                paddingHorizontal: 4,
                backgroundColor: agent.published_at
                  ? colors.withOpacity(
                      colors.colors.secondary800 ?? colors.surface,
                      0.6,
                    )
                  : colors.withOpacity(colors.success, 0.2),
                borderWidth: 1,
                borderColor: agent.published_at
                  ? colors.withOpacity(
                      colors.colors.secondary700 ?? colors.border,
                      0.6,
                    )
                  : colors.withOpacity(colors.success, 0.3),
              }}
              disabled={
                publishAgentMutation.isLoading ||
                unpublishAgentMutation.isLoading
              }
            >
              <Text
                sx={{
                  textAlign: "center",
                  fontWeight: "600",
                  color: agent.published_at ? "textSecondary" : "accent300",
                }}
              >
                {agent.published_at
                  ? "Make Agent Private"
                  : "Share Agent to Explore"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              sx={{
                backgroundColor: colors.withOpacity(colors.error, 0.2),
                borderWidth: 1,
                borderColor: colors.withOpacity(colors.error, 0.4),
                borderRadius: "xl",
                paddingVertical: 4,
                paddingHorizontal: 4,
              }}
              disabled={deleteAgentMutation.isLoading}
            >
              <Text
                sx={{
                  color: "errorLight",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                {deleteAgentMutation.isLoading ? "Deleting..." : "Delete Agent"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ContainerView>
  );
};

export default AgentManageScreen;
