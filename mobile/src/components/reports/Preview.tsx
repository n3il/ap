import { AssessmentRecordType } from "@/types/agent";
import { formatRelativeDate } from "@/utils/date";
import SentimentBadge from "../agent/SentimentBadge";
import { View, Text } from "../ui";


export default function ReportPreview({
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
