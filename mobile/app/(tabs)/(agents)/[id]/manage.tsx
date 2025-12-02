import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import ContainerView from "@/components/ContainerView";
import {
  PromptAssignmentsCard,
  PromptModals,
} from "@/components/ManagePrompts";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBadge,
  Text,
  TouchableOpacity,
  View,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { agentService } from "@/services/agentService";
import { promptService } from "@/services/promptService";
import { useColors } from "@/theme";

const AgentManageScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const agentId = Array.isArray(id) ? id[0] : id;
  const queryClient = useQueryClient();
  const { user } = useAuth();
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

  const {
    data: prompts = [],
    isFetching: promptsFetching,
    refetch: refetchPrompts,
  } = useQuery({
    queryKey: ["prompts"],
    queryFn: () => promptService.listPrompts(),
    enabled: !!agentId && isOwnAgent,
  });

  const defaultPrompt = useMemo(() => {
    return prompts.find((prompt) => prompt.is_default) || prompts[0] || null;
  }, [prompts]);

  const selectedPrompt = useMemo(() => {
    if (!agent) return defaultPrompt;
    if (!agent.prompt_id) {
      return defaultPrompt;
    }
    return (
      prompts.find((prompt) => prompt.id === agent.prompt_id) || defaultPrompt
    );
  }, [agent, prompts, defaultPrompt]);

  const [promptPickerVisible, setPromptPickerVisible] = useState(false);
  const [promptManagerVisible, setPromptManagerVisible] = useState(false);
  const [resumePromptPicker, setResumePromptPicker] = useState(false);

  const assignPromptMutation = useMutation({
    mutationFn: (promptId) =>
      promptService.assignPromptToAgent(agentId, promptId),
    onSuccess: () => {
      queryClient.invalidateQueries(["agent", agentId]);
      refetchPrompts();
      Alert.alert(
        "Prompt Updated",
        "This agent will use the new prompt on the next run.",
      );
    },
    onError: (error) => {
      Alert.alert("Error", `Failed to update prompt: ${error.message}`);
    },
  });

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

  const handlePromptSelect = () => {
    setResumePromptPicker(false);
    setPromptPickerVisible(true);
  };

  const handlePromptPicked = (prompt) => {
    const currentId = selectedPrompt?.id ?? null;
    const nextId = prompt?.id ?? null;
    if (currentId === nextId) {
      setPromptPickerVisible(false);
      setResumePromptPicker(false);
      return;
    }
    assignPromptMutation.mutate(prompt?.id ?? null);
    setPromptPickerVisible(false);
    setResumePromptPicker(false);
  };

  const handleOpenPromptManager = (shouldResumePicker = false) => {
    setResumePromptPicker(shouldResumePicker);
    if (shouldResumePicker) {
      setPromptPickerVisible(false);
    }
    setPromptManagerVisible(true);
  };

  const handleClosePromptManager = () => {
    setPromptManagerVisible(false);
    if (resumePromptPicker) {
      setPromptPickerVisible(true);
    }
    setResumePromptPicker(false);
  };

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
            Only the agent owner can edit publishing and prompt settings.
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

        <View sx={{ marginBottom: 6, paddingHorizontal: 0 }}>
          <PromptAssignmentsCard
            selectedPrompt={selectedPrompt}
            onSelectPrompt={handlePromptSelect}
            onOpenLibrary={() => handleOpenPromptManager(false)}
            isFetching={promptsFetching}
            isMutating={assignPromptMutation.isLoading}
          />
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

      <PromptModals
        pickerVisible={promptPickerVisible}
        prompts={prompts}
        selectedPrompt={selectedPrompt}
        onSelectPrompt={handlePromptPicked}
        onClosePicker={() => {
          setPromptPickerVisible(false);
          setResumePromptPicker(false);
        }}
        onOpenManagerFromPicker={() => handleOpenPromptManager(true)}
        managerVisible={promptManagerVisible}
        onCloseManager={handleClosePromptManager}
        onPromptCreated={() => {
          refetchPrompts();
          queryClient.invalidateQueries(["prompts"]);
        }}
      />
    </ContainerView>
  );
};

export default AgentManageScreen;
