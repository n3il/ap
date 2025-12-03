import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AgentList from "@/components/AgentList";
import ContainerView from "@/components/ContainerView";
import SectionTitle from "@/components/SectionTitle";
import {
  GlassButton,
  ScrollView,
  SwipeableTabs,
  Text,
  View,
} from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/theme";

export default function AgentsScreen() {
  const { theme } = useTheme();
  const colorUtils = useColors();
  const palette = colorUtils.colors;

  const handleCreateAgent = () => {
    router.push("/modal_create_agent");
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
          <AgentList isActive={true} emptyState={<View />} />
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
    </ContainerView>
  );
}
