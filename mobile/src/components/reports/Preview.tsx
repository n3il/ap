import type { ViewStyle } from "react-native";
import type { AssessmentRecordType } from "@/types/agent";
import { formatRelativeDate } from "@/utils/date";
import SentimentBadge from "../agent/SentimentBadge";
import { Text, View } from "../ui";

const TradeActionsSummaryText = ({ assessmentData }) => {
  const openedTrades = assessmentData.parsed_llm_response?.tradeActions.filter(
    (ta) => ta.type === "OPEN",
  );
  const closedTrades = assessmentData.parsed_llm_response?.tradeActions.filter(
    (ta) => ta.type === "CLOSE",
  );

  return (
    (openedTrades.length > 0 || closedTrades.length > 0) && (
      <View style={{ flexDirection: "row", gap: 8 }}>
        {openedTrades.length && (
          <Text variant="xs">
            Opened {openedTrades.length} (
            {openedTrades.map((t) => t.asset).join(", ")})
          </Text>
        )}
        {closedTrades.length && (
          <Text variant="xs">
            Closed {closedTrades.length}{" "}
            {closedTrades.map((t) => t.asset).join(", ")}
          </Text>
        )}
      </View>
    )
  );
};

export default function ReportPreview({
  assessmentData,
  style = {},
}: {
  assessmentData: AssessmentRecordType;
  style?: ViewStyle;
}) {
  return (
    <View style={[{ gap: 6 }, style]}>
      <SentimentBadge
        sentimentScore={
          assessmentData.parsed_llm_response?.headline?.sentiment_score
        }
        sentimentWord={
          assessmentData.parsed_llm_response?.headline?.sentiment_word
        }
      />
      <Text
        variant="xs"

        sx={{
          fontWeight: "300",
          fontStyle: "italic",
          textAlign: "left",
        }}
      >
        {assessmentData.timestamp
          ? `${formatRelativeDate(assessmentData.timestamp)}`
          : "-"}
      </Text>

      <Text
        variant="sm"
        sx={{
          fontWeight: "500",
          fontSize: 13,
          fontFamily: "monospace",
          lineHeight: 30,
        }}
      >
        {assessmentData.parsed_llm_response?.headline?.short_summary}
      </Text>
      {/* <TradeActionsSummaryText assessmentData={assessmentData}  /> */}
    </View>
  );
}
