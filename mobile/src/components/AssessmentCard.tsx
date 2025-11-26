import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable } from "react-native";
import Markdown from "react-native-markdown-display";
import SectionTitle from "@/components/SectionTitle";
import {
  Avatar,
  Card,
  StatusBadge,
  Text,
  TouchableOpacity,
  View,
} from "@/components/ui";
import { useColors } from "@/theme";
import type { AssessmentType } from "@/types/agent";
import { formatRelativeDate } from "@/utils/date";
import TradeActionDisplay from "./TradeActionDisplay";

const hasContent = (value) =>
  typeof value === "string" && value.trim().length > 0;

function AssessmentCard({ assessment }: { assessment: AssessmentType }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const { colors: palette, withOpacity } = useColors();

  const markdownStyles = useMemo(
    () => ({
      body: {
        color: palette.textPrimary,
        fontSize: 16,
        lineHeight: 24,
        fontWeight: "300",
      },
      paragraph: {
        marginTop: 0,
        marginBottom: 8,
        color: palette.textPrimary,
        fontSize: 16,
        lineHeight: 24,
        fontWeight: "300",
      },
      heading1: {
        color: palette.textPrimary,
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 8,
        marginTop: 12,
      },
      heading2: {
        color: palette.textPrimary,
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 6,
        marginTop: 10,
      },
      heading3: {
        color: palette.textPrimary,
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
        marginTop: 8,
      },
      strong: {
        fontWeight: "700",
        color: palette.textPrimary,
      },
      em: {
        fontStyle: "italic",
        color: palette.textSecondary,
      },
      code_inline: {
        backgroundColor: withOpacity(
          palette.surface ?? palette.background,
          0.5,
        ),
        color: palette.primary,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        fontFamily: "monospace",
        fontSize: 13,
      },
      code_block: {
        backgroundColor: withOpacity(
          palette.surface ?? palette.background,
          0.5,
        ),
        color: palette.textSecondary,
        padding: 12,
        borderRadius: 8,
        fontFamily: "monospace",
        fontSize: 12,
        marginVertical: 8,
      },
      fence: {
        backgroundColor: withOpacity(
          palette.surface ?? palette.background,
          0.5,
        ),
        color: palette.textSecondary,
        padding: 12,
        borderRadius: 8,
        fontFamily: "monospace",
        fontSize: 12,
        marginVertical: 8,
      },
      bullet_list: {
        marginVertical: 4,
      },
      ordered_list: {
        marginVertical: 4,
      },
      list_item: {
        marginVertical: 2,
        color: palette.textPrimary,
        fontSize: 14,
        lineHeight: 22,
      },
      blockquote: {
        backgroundColor: withOpacity(
          palette.surface ?? palette.background,
          0.3,
        ),
        borderLeftWidth: 3,
        borderLeftColor: palette.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginVertical: 8,
        borderRadius: 4,
      },
      link: {
        color: palette.primary,
        textDecorationLine: "underline",
      },
      hr: {
        backgroundColor: withOpacity(palette.foreground, 0.2),
        height: 1,
        marginVertical: 12,
      },
    }),
    [palette, withOpacity],
  );

  const [parsedResponse, _] = useState(() => {
    try {
      return assessment?.parsed_llm_response &&
        typeof assessment.parsed_llm_response === "object"
        ? assessment.parsed_llm_response
        : JSON.parse(assessment.llm_response_text);
    } catch (e) {
      return {
        headline: assessment.llm_response_text,
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

  return (
    <Card
      isInteractive={expanded}
      glassEffectStyle="clear"
      variant="glass"
      sx={{ marginBottom: 3 }}
      glassTintColor={withOpacity("#000", 0.9)}
    >
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View
          sx={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Avatar
            backgroundColor={palette.providers[assessment.agent?.llm_provider]}
            name={assessment.agent?.name}
            // email={assessment.agent?.model_name}
            size="sm"
          />
          <Pressable
            onPress={() => {
              router.push(`/agents/${assessment.agent?.id}/${assessment.id}`);
            }}
            style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
          >
            <Text variant="xs" tone="muted">
              {formatRelativeDate(assessment.timestamp) || ""}
            </Text>
          </Pressable>
        </View>

        {tradeActions.length > 0 && (
          <View
            sx={{
              marginTop: 3,
            }}
          >
            <SectionTitle title="New trades" />
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

        <Text variant="md" sx={{ fontWeight: "500", lineHeight: 24 }}>
          {shortSummary || ""}
        </Text>

        {expanded ? (
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
                    <Markdown style={markdownStyles}>
                      {section.content}
                    </Markdown>
                  </View>
                ))}
              </View>
            ) : fallbackText ? (
              <Markdown style={markdownStyles}>{fallbackText}</Markdown>
            ) : (
              <Text
                variant=""
                tone="primary"
                sx={{ lineHeight: 24, fontWeight: 300 }}
              >
                No analysis available
              </Text>
            )}

            <TouchableOpacity
              onPress={() => setExpanded(!expanded)}
              style={{
                backgroundColor: withOpacity(
                  palette.background ?? palette.surface,
                  0.2,
                ),
                borderRadius: 8,
                padding: 8,
                marginTop: 8,
              }}
            >
              <Text
                variant="xs"
                sx={{ textAlign: "center", color: "textPrimary" }}
              >
                Show Less
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </TouchableOpacity>
    </Card>
  );
}

export default React.memo(AssessmentCard);
