import { useMemo, useState } from "react";
import Markdown from "react-native-markdown-display";
import TradeActionDisplay from "@/components/TradeActionDisplay";
import { Avatar, ScrollView, StatusBadge, Text, View } from "@/components/ui";
import LockScreen from "@/components/ui/LockScreen";
import { useAgent } from "@/hooks/useAgent";
import useMarkdownStyles from "@/hooks/useMarkdownStyles";
import { useColors } from "@/theme";
import type { AssessmentRecordType } from "@/types/agent";
import { formatRelativeDate } from "@/utils/date";
import SentimentBadge from "../agent/SentimentBadge";
import SectionTitle from "../SectionTitle";

const hasContent = (value: string | null | undefined) =>
  typeof value === "string" && value.trim().length > 0;

type ReportDetailProps = {
  assessment?: AssessmentRecordType | null;
};

export default function ReportDetail({ assessment }: ReportDetailProps) {
  const [expanded, _setExpanded] = useState(false);
  const { colors: palette, withOpacity } = useColors();
  const markdownStyles = useMarkdownStyles();
  const { data: agent } = useAgent(assessment?.agent_id);

  const [parsedResponse, _] = useState(() => {
    try {
      return assessment?.parsed_llm_response &&
        typeof assessment.parsed_llm_response === "object"
        ? assessment.parsed_llm_response
        : JSON.parse(assessment.llm_response_text);
    } catch (_e) {
      return {
        headline: assessment?.llm_response_text,
        overview: null,
        tradeActions: [],
      };
    }
  });

  const headline = parsedResponse?.headline ?? null;
  const overview = parsedResponse?.overview ?? null;

  const tradeActions = useMemo(
    () =>
      Array.isArray(parsedResponse?.tradeActions)
        ? parsedResponse.tradeActions.filter(Boolean)
        : [],
    [parsedResponse],
  );

  const shortSummary = hasContent(headline?.short_summary)
    ? headline.short_summary.trim()
    : "";
  const extendedSummary = hasContent(headline?.extended_summary)
    ? headline.extended_summary.trim()
    : "";
  const thesis = hasContent(headline?.thesis) ? headline.thesis.trim() : "";
  const fallbackText = hasContent(assessment?.llm_response_text)
    ? assessment.llm_response_text.trim()
    : "";

  const overviewSections = useMemo(
    () =>
      [
        { key: "macro", label: "Macro", content: overview?.macro },
        {
          key: "market_structure",
          label: "Market Structure",
          content: overview?.market_structure,
        },
        {
          key: "technical_analysis",
          label: "Technical Analysis",
          content: overview?.technical_analysis,
        },
      ].filter((section) => hasContent(section.content)),
    [overview],
  );

  const sentimentScore =
    typeof headline?.sentiment_score === "number"
      ? headline.sentiment_score
      : null;
  const sentimentWord = hasContent(headline?.sentiment_word)
    ? headline.sentiment_word.trim()
    : "";
  const sentimentLabel = sentimentWord;

  const sentimentVariant =
    sentimentScore === null
      ? "info"
      : sentimentScore > 0.2
        ? "success"
        : sentimentScore < -0.2
          ? "error"
          : "warning";

  const showStructured = Boolean(parsedResponse);

  if (!assessment) {
    return <LockScreen />;
  }

  return (
    <ScrollView
      contentContainerStyle={{
        paddingBottom: "30%",
        gap: 6,
      }}
    >
      <View
        sx={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottomWidth: 1,
          paddingBottom: 4,
          marginBottom: 4,
          borderBottomColor: withOpacity(palette.border, 0.3),
        }}
      >
        <Avatar
          backgroundColor={palette.providers[agent?.llm_provider]}
          name={agent?.name}
          // email={agent?.model_name}
          size="md"
        />
        <View
          sx={{
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "flex-end",
            gap: 2,
          }}
        >
          <Text variant="xs" tone="muted">
            {new Date(assessment.timestamp).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          <Text variant="xs" tone="muted">
            ({formatRelativeDate(assessment.timestamp) || ""})
          </Text>
        </View>
      </View>

      <SentimentBadge
        sentimentScore={sentimentScore}
        sentimentWord={sentimentLabel}
      />

      <SectionTitle title="Moves" sx={{ fontWeight: "900" }} />

      {tradeActions.length > 0 && (
        <View
          sx={{
            borderColor: palette.border,
          }}
        >
          {tradeActions.map((action, index) => (
            <TradeActionDisplay
              key={`${action.asset ?? "action"}-${index}`}
              actionData={action}
              showReason={expanded}
            />
          ))}
        </View>
      )}

      <SectionTitle title="Extended" sx={{ fontWeight: "900" }} />

      {shortSummary && (
        <Text
          variant="md"
          sx={{ fontWeight: "500", lineHeight: 24, marginTop: 2 }}
        >
          {shortSummary}
        </Text>
      )}

      <View
        sx={{
          borderRadius: "lg",
          fontFamily: "monospace",
          marginTop: 3,
        }}
      >
        {showStructured ? (
          <View sx={{ gap: 2 }}>
            {thesis && (
              <Text variant="sm" tone="muted" sx={{ fontStyle: "italic" }}>
                {thesis}
              </Text>
            )}

            {extendedSummary && (
              <Markdown style={markdownStyles}>{extendedSummary}</Markdown>
            )}

            {overviewSections.map((section) => (
              <View key={section.key} sx={{}}>
                <Text
                  variant="xs"
                  tone="muted"
                  sx={{ textTransform: "uppercase", letterSpacing: 1 }}
                >
                  {section.label}
                </Text>
                <Markdown style={markdownStyles}>{section.content}</Markdown>
              </View>
            ))}
          </View>
        ) : fallbackText ? (
          <Markdown style={{}}>{fallbackText}</Markdown>
        ) : (
          <Text
            variant=""
            tone="primary"
            sx={{ lineHeight: 24, fontWeight: 300 }}
          >
            No analysis available
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
