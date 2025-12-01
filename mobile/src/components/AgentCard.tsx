import { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Avatar, LabelValue, Text, TouchableOpacity, View } from "@/components/ui";
import { useAccountBalance } from "@/hooks/useAccountBalance";
import { useColors } from "@/theme";
import type { AgentType } from "@/types/agent";
import { formatPercent, sentimentToColor } from "@/utils/currency";
import { formatRelativeDate } from "@/utils/date";
import BalanceOverview from "./agent/BalanceOverview";
import PositionList from "./PositionList";
import { StatsAbbreviated } from "@/components/agent/AccountStats";

export default function AgentCard({
  agent,
  isOwnAgent = false,
  onPress,
  compactView = false,
  hideOpenPositions = false,
  showPositions = true,
  transparent = false,
  isActive = false,
  asListItem = false,
  ...props
}: {
  agent: AgentType;
  isOwnAgent?: boolean;
  onPress?: () => void;
  compactView?: boolean;
  hideOpenPositions?: boolean;
  showPositions?: boolean;
  transparent?: boolean;
  isActive?: boolean;
  asListItem?: boolean;
}) {
  const { colors: palette, withOpacity } = useColors();
  const accountData = useAccountBalance(agent.id, hideOpenPositions);

  // Animation values
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    // borderWidth: transparent ? 0 : .1,
    borderColor: `rgba(124, 255, 170, ${borderOpacity.value})`,
  }));

  const parsedAssessment = agent.latest_assessment?.parsed_llm_response;

  return (
    <Animated.View
      style={[
        {
          paddingVertical: 18,
          paddingHorizontal: 18,
          backgroundColor: transparent ? "transparent" : "#0f1522ff",
          borderRadius: 12,
          marginHorizontal: 10
        },
        animatedStyle,
      ]}
      {...props}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View
          sx={{
            marginBottom: 3,
            flexDirection: "row",
            alignItems: "center",
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
          <StatsAbbreviated agentId={agent.id} />
        </View>
      </TouchableOpacity>

      {parsedAssessment ? (
        <View
          sx={{
            marginTop: 2,
            borderTopColor: "muted",
            borderTopWidth: 1,
            paddingTop: 2,
          }}
        >
          <View
            sx={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 2,
            }}
          >
            <Text
              variant="xs"
              sx={{
                color: sentimentToColor(
                  agent.latest_assessment?.parsed_llm_response?.headline
                    ?.sentiment_score,
                ),
                fontStyle: "italic",
                fontWeight: "300",
                marginBottom: 2,
              }}
            >
              {
                agent.latest_assessment?.parsed_llm_response?.headline
                  ?.sentiment_word
              }{" "}
              {`(${agent.latest_assessment?.parsed_llm_response?.headline?.sentiment_score})`}
            </Text>

            <Text
              variant="xs"
              sx={{
                fontWeight: "200",
                fontStyle: "italic",
                textAlign: "right",
              }}
            >
              {agent.latest_assessment?.timestamp
                ? formatRelativeDate(agent.latest_assessment?.timestamp)
                : "-"}
            </Text>
          </View>

          <Text
            variant="sm"
            sx={{ fontWeight: "300", fontSize: 12, fontFamily: "monospace" }}
          >
            {parsedAssessment?.headline?.thesis}
          </Text>
        </View>
      ) : null}

      {!hideOpenPositions && (
        <View sx={{ marginTop: 6, borderTopColor: "muted", borderTopWidth: 1 }}>
          <PositionList positions={accountData.enrichedPositions} top={3} />
        </View>
      )}

      {/* {parsedAssessment.tradeActions?.map((action, index) => (
      <TradeActionDisplay
        key={`${action.asset ?? 'action'}-${index}`}
        actionData={action}
        showReason={true}
      />
    ))} */}
    </Animated.View>
  );
}
