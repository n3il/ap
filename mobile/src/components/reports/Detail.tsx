import { useMemo, useState } from "react";
import Markdown from "react-native-markdown-display";
import TradeActionDisplay from "@/components/TradeActionDisplay";
import { Avatar, StatusBadge, Text, View } from "@/components/ui";
import { useColors } from "@/theme";
import { formatRelativeDate } from "@/utils/date";
import ContainerView from "@/components/ContainerView";
import LockScreen from "@/components/ui/LockScreen";

const hasContent = (value) =>
  typeof value === "string" && value.trim().length > 0;

export default function ReportDetail({ assessment }) {
  const [expanded, _setExpanded] = useState(false);
  const { colors: palette, withOpacity } = useColors();

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
  const sentimentLabel = sentimentWord
    ? sentimentScore !== null
      ? `${sentimentWord} (${sentimentScore.toFixed(2)})`
      : sentimentWord
    : "";

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
    <View>
      <View
        sx={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Avatar
          backgroundColor={palette.providers[assessment.agent?.llm_provider]}
          name={assessment.agent?.name}
          // email={assessment.agent?.model_name}
          size="sm"
        />
        <View sx={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          <Text variant="xs" tone="muted">
            {formatRelativeDate(assessment.timestamp) || ""}
          </Text>
        </View>
      </View>

      {tradeActions.length > 0 && (
        <View
          sx={{
            marginTop: 3,
            borderColor: palette.border,
            borderTopWidth: 1,
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

      {sentimentLabel ? (
        <StatusBadge
          variant={sentimentVariant}
          size="small"
          sx={{
            borderWidth: 0,
            marginTop: 2,
            paddingHorizontal: 0,
          }}
          textSx={{
            fontStyle: "italic",
          }}
        >
          {sentimentLabel}
        </StatusBadge>
      ) : null}

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
    </View>
  );
}
