import { Pressable, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import AccountStats from "@/components/agent/AccountStats";
import { Avatar, View } from "@/components/ui";
import { useAccountBalance } from "@/hooks/useAccountBalance";
import { useColors, withOpacity } from "@/theme";
import type { AgentType } from "@/types/agent";
import PositionList from "./agents/PositionList";
import ReportPreview from "./reports/Preview";

export default function AgentCard({
  agent,
  isOwnAgent = false,
  onPress,
  showPositions = true,
  transparent = false,
  isActive = false,
  style = {},
  ...props
}: {
  agent: AgentType;
  isOwnAgent?: boolean;
  onPress?: () => void;
  showPositions?: boolean;
  transparent?: boolean;
  isActive?: boolean;
  style: ViewStyle;
}) {
  const { colors: palette } = useColors();
  const accountData = useAccountBalance({ agent });
  return (
    <Animated.View
      style={[
        {
          paddingVertical: 18,
          paddingHorizontal: 18,
          borderRadius: 12,
          marginHorizontal: 10,
          borderColor: withOpacity(palette.border, 0.6),
          borderWidth: 1,
          // backgroundColor: palette.surfaceLight
        },
        style,
      ]}
      {...props}
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

        {agent.latest_assessment?.parsed_llm_response ? (
          <ReportPreview
            style={{ marginTop: 6 }}
            assessmentData={agent.latest_assessment}
          />
        ) : null}
      </Pressable>

      {showPositions && accountData.openPositions.length > 0 ? (
        <View
          sx={{
            borderTopColor: withOpacity(palette.border, 0.8),
            borderTopWidth: 0.5,
            paddingTop: 4,
            marginTop: 4,
          }}
        >
          <PositionList
            positions={accountData.openPositions}
            top={3}
            sx={{
              paddingHorizontal: 2,
            }}
          />
        </View>
      ) : null}
    </Animated.View>
  );
}
