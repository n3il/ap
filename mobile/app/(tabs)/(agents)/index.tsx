import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import AgentList from "@/components/AgentList";
import ContainerView from "@/components/ContainerView";
import CreateAgentModal from "@/components/CreateAgentModal";
import SectionTitle from "@/components/SectionTitle";
import {
  GlassButton,
  ScrollView,
  SwipeableTabs,
  Text,
  TouchableOpacity,
  View,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { agentService, promptService } from "@/services";
import { useColors } from "@/theme";

export default function AgentsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const { theme } = useTheme();
  const colorUtils = useColors();
  const palette = colorUtils.colors;

  // Fetch prompts for the modal
  const { data: prompts = [] } = useQuery({
    queryKey: ["prompts"],
    queryFn: () => promptService.listPrompts(),
  });

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: (agentData) => agentService.createAgent(agentData),
    onSuccess: (newAgent) => {
      // Invalidate and refetch agent lists
      queryClient.invalidateQueries(["active-agents"]);
      queryClient.invalidateQueries(["all-agents"]);
      queryClient.invalidateQueries(["agents"]);

      // Close modal
      setModalVisible(false);

      // Navigate to the new agent's detail page
      router.push(`/(tabs)/(agents)/${newAgent.id}`);
    },
    onError: (error) => {
      alert("Failed to create agent. Please try again.");
    },
  });

  const handleCreateAgent = () => {
    setModalVisible(true);
  };

  const handleSubmitAgent = (agentData) => {
    createAgentMutation.mutate(agentData);
  };

  // Define tabs with their content
  const tabs = [
    {
      key: "Active",
      title: "Active",
      content: (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: "70%" }}
        >
          <AgentList compactView active />
        </ScrollView>
      ),
    },
    {
      key: "overview",
      title: "Overview",
      content: <Text>Overview</Text>,
    },
    {
      key: "bookmarked",
      title: "Bookmarked",
      content: <Text>Bookmarked</Text>,
    },
    {
      key: "all",
      title: "All",
      content: <Text>All</Text>,
    },
  ];

  return (
    <ContainerView>
      <View
        sx={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 4,
        }}
      >
        <SectionTitle title="Agent Dashboards" sx={{ fontSize: 16 }} />
        <GlassButton
          onPress={handleCreateAgent}
          style={{
            alignItems: "center",
            justifyContent: "center",
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color={palette.foreground} />
        </GlassButton>
      </View>

      <SwipeableTabs
        tabs={tabs}
        initialIndex={0}
        tabTextStyle={{ color: theme.colors.text.secondary }}
        activeTabTextStyle={{ color: theme.colors.accent }}
        indicatorColor={theme.colors.accent}
      />

      <CreateAgentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitAgent}
        promptOptions={prompts}
        onManagePrompts={() => {
          setModalVisible(false);
          // TODO: Implement prompt manager navigation
          router.push("/(tabs)/(profile)/prompts");
        }}
      />
    </ContainerView>
  );
}
