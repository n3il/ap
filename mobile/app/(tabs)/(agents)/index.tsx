import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
  const { theme, isDark } = useTheme();
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
            gap: 24,
            marginTop: 18,
          }}
        >
          <AgentList
            isActive
            emptyState={<View />}
            agentCardProps={{
              showRecentAssessment: false,
              showPositions: true,
              showDailyPnlCalendar: true,
              showSentimentCalendar: true,
            }}
          />
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
          tintColor={palette.surfaceLight}
          // tintColor={isDark ? "rgba(0,0,0,.3)" : "rgba(0,0,0,.3)"}
          styleVariant="minimalSquare"
        >
          <MaterialCommunityIcons name="plus" size={28} color={palette.surfaceForeground} />
        </GlassButton>
      </View>

      <SwipeableTabs tabs={tabs} initialIndex={0} />
    </ContainerView>
  );
}
