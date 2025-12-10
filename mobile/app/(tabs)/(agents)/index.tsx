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
      key: "All",
      title: "All",
      content: (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: "70%",
            gap: 12,
          }}
        >
          <AgentList isActive emptyState={<View />} />
        </ScrollView>
      ),
    },
    {
      key: "Watchlist",
      title: "Watchlist",
      content: <AgentList isBookmarked emptyState={<View />} />,
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
        <SectionTitle title="" sx={{ fontSize: 16 }} />
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

      <SwipeableTabs tabs={tabs} initialIndex={0} />
    </ContainerView>
  );
}
