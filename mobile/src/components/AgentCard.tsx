import { Pressable, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import AccountStats from "@/components/agent/AccountStats";
import { Avatar, GlassButton, View } from "@/components/ui";
import { useAccountBalance } from "@/hooks/useAccountBalance";
import { useColors, withOpacity } from "@/theme";
import type { AgentType } from "@/types/agent";
import PositionList from "./agents/PositionList";
import ReportPreview from "./reports/Preview";
import PnlCalendar from "./agent/PnlCalendar";
import { GlassView } from "expo-glass-effect";
import { GLOBAL_PADDING } from "./ContainerView";
import { useTheme } from "@/contexts/ThemeContext";

export default function AgentCard({
  agent,
  isOwnAgent = false,
  onPress,

  showRecentAssessment = true,
  showPositions = true,
  showDailyPnlCalendar = false,

  transparent = false,
  isActive = false,
  ...props
}: {
  agent: AgentType;
  isOwnAgent?: boolean;
  onPress?: () => void;
  showRecentAssessment?: boolean;
  showPositions?: boolean;
  showDailyPnlCalendar?: boolean;
  transparent?: boolean;
  isActive?: boolean;
}) {
  const { colors: palette, withOpacity } = useColors();
  const { isDark } = useTheme()
  const accountData = useAccountBalance({ agent });
  return (
    <GlassButton
      enabled={false}
      glassEffectStyle="clear"
      tintColor={isDark
        ? withOpacity(palette.surfaceLight, .5) // "rgba(0, 0, 0, 0.3)"
        : "rgba(255,255,255, 1)"
      }
      style={{
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginHorizontal: 10,
        backgroundColor: "transparent",
        flexDirection: "row",
        borderColor: "#000",
      }}
    >
      <Pressable onPress={onPress}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 2,
            justifyContent: "space-between",
          }}
        >
          <Avatar
            size="xs"
            src={agent.avatar_url}
            name={agent.name.slice(0, 70)}
            backgroundColor={palette.providers[agent.llm_provider]}
          />
          <AccountStats
            agent={agent}
            style={{
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          />
        </View>

        {showRecentAssessment && agent.latest_assessment?.parsed_llm_response ? (
          <ReportPreview
            style={{ marginTop: 6 }}
            assessmentData={agent.latest_assessment}
          />
        ) : null}
      </Pressable>

      {showPositions && accountData.positions.length > 0 ? (
        <View
          sx={{
            borderTopColor: withOpacity(palette.border, 0.8),
            borderTopWidth: 0.5,
            paddingTop: 4,
            marginTop: 4,
          }}
        >
          <PositionList
            positions={accountData.positions}
            top={3}
            sx={{
              paddingHorizontal: 2,
            }}
          />
        </View>
      ) : null}

      {showDailyPnlCalendar &&
        <PnlCalendar accountData={accountData}  />
      }
    </GlassButton>
  );
}
