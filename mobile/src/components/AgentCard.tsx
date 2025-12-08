import { Pressable, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import AccountStats from "@/components/agent/AccountStats";
import { Avatar, Text, View } from "@/components/ui";
import { useColors, withOpacity } from "@/theme";
import type { AgentType, AssessmentRecordType } from "@/types/agent";
import { formatRelativeDate } from "@/utils/date";
import PositionList from "./PositionList";
import { useAccountBalance } from "@/hooks/useAccountBalance";
import SentimentBadge from "./agent/SentimentBadge";

type AssessmentPreviewProps = {
  assessmentData: AssessmentRecordType;
  style?: Record<string, unknown>;
};

export function AssessmentPreview({
  assessmentData,
  style = {},
  innerStyle = {},
}: {
  assessmentData: AssessmentRecordType;
  style?: ViewStyle;
  innerStyle?: ViewStyle;
}) {
  return (
    <View style={style}>
      <View
        style={[{
          flexDirection: "column",
          // justifyContent: "space-between",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          gap: 2,

        }, innerStyle]}
      >
        <SentimentBadge
          sentimentScore={assessmentData.parsed_llm_response?.headline?.sentiment_score}
          sentimentWord={assessmentData.parsed_llm_response?.headline?.sentiment_word}
        />
        <Text
          variant="xs"
          sx={{
            fontWeight: "300",
            fontStyle: "italic",
            textAlign: "right",
          }}
        >
          {assessmentData.timestamp
            ? `${formatRelativeDate(assessmentData.timestamp)}`
            : "-"}
        </Text>

      </View>

      <Text
        variant="sm"
        sx={{ fontWeight: "300", fontSize: 12, fontFamily: "monospace" }}
      >
        {assessmentData.parsed_llm_response?.headline?.short_summary}
      </Text>
    </View>
  );
}

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
  style: ViewStyle,
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
          borderColor: withOpacity(palette.border, .6),
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
          <AssessmentPreview
            style={{ marginTop: 6 }}
            assessmentData={agent.latest_assessment}
          />
        ) : null}
      </Pressable>

      {showPositions && accountData.openPositions.length > 0 ? (
        <View sx={{
          marginTop: 2,
          borderTopColor: withOpacity(palette.border, .4),
          borderTopWidth: .5,
          paddingTop: 4,
          marginTop: 4,
        }}>
          <PositionList positions={accountData.openPositions} top={3} />
        </View>
      ) : null}
    </Animated.View>
  );
}
