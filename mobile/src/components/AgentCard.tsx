import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { StatsAbbreviated } from "@/components/agent/AccountStats";
import { Avatar, Text, View } from "@/components/ui";
import { useColors } from "@/theme";
import type { AgentType, AssessmentRecordType } from "@/types/agent";
import { sentimentToColor } from "@/utils/currency";
import { formatRelativeDate } from "@/utils/date";
import PositionList from "./PositionList";
import { useAccountBalance } from "@/hooks/useAccountBalance";

type AssessmentPreviewProps = {
  assessmentData: AssessmentRecordType;
  style?: Record<string, unknown>;
};

export function AssessmentPreview({
  assessmentData,
  style = {},
}: AssessmentPreviewProps) {
  return (
    <View style={style}>
      <View
        sx={{
          flexDirection: "row",
          // justifyContent: "space-between",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        <Text
          variant="xs"
          sx={{
            color: sentimentToColor(
              assessmentData.parsed_llm_response?.headline?.sentiment_score,
            ),
            fontStyle: "italic",
            fontWeight: "300",
            marginBottom: 2,
          }}
        >
          feeling {assessmentData.parsed_llm_response?.headline?.sentiment_word?.toLowerCase()}{" "}
          {`(${assessmentData.parsed_llm_response?.headline?.sentiment_score})`}
        </Text>

        <Text
          variant="xs"
          sx={{
            fontWeight: "100",
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
        {assessmentData.parsed_llm_response?.headline?.thesis}
      </Text>
    </View>
  );
}

export default function AgentCard({
  agent,
  isOwnAgent = false,
  onPress,
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
  hideOpenPositions?: boolean;
  showPositions?: boolean;
  transparent?: boolean;
  isActive?: boolean;
  asListItem?: boolean;
}) {
  const { colors: palette } = useColors();
  const tradingAccountType = agent.simulate ? "paper" : "real";
  const tradingAccount = agent?.trading_accounts?.find((ta) => ta.type === tradingAccountType);
  const accountData = useAccountBalance({userId: tradingAccount?.hyperliquid_address || ""});

  // Animation values
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    // borderWidth: transparent ? 0 : .1,
    borderColor: `rgba(124, 255, 170, ${borderOpacity.value})`,
  }));

  return (
    <Animated.View
      style={[
        {
          paddingVertical: 18,
          paddingHorizontal: 18,
          backgroundColor: palette.surface,
          borderRadius: 12,
          marginHorizontal: 10,
        },
        animatedStyle,
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
          <StatsAbbreviated
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

        {/* {agent.latest_assessment?.parsed_llm_response?.tradeActions?.length >
          0 && (
          <TradeSummary
            tradeActions={
              agent.latest_assessment?.parsed_llm_response?.tradeActions
            }
          />
        )} */}
      </Pressable>

      {!hideOpenPositions && accountData.openPositions.length > 0 ? (
        <View sx={{
          marginTop: 2,
        }}>
          <PositionList positions={accountData.openPositions} top={3} />
        </View>
      ) : null}

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
