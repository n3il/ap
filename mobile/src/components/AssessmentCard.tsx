import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import Markdown from "react-native-markdown-display";
import { AssessmentPreview } from "@/components/AgentCard";
import { Card, Text, TouchableOpacity, View } from "@/components/ui";
import { ROUTES } from "@/config/routes";
import { useColors } from "@/theme";
import type { AssessmentType } from "@/types/agent";
import TradeActionDisplay, { TradeSummary } from "./TradeActionDisplay";
import PendingAssessmentCard from "@/components/PendingAssessmentCard";
import useMarkdownStyles from "@/hooks/useMarkdownStyles";

const hasContent = (value) =>
  typeof value === "string" && value.trim().length > 0;

function AssessmentCard({ assessment }: { assessment: AssessmentType }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const { colors: palette, withOpacity } = useColors();
  const markdownStyles = useMarkdownStyles()

  const [parsedResponse, _] = useState(() => {
    try {
      return assessment?.parsed_llm_response &&
        typeof assessment.parsed_llm_response === "object"
        ? assessment.parsed_llm_response
        : JSON.parse(assessment.llm_response_text);
    } catch (_e) {
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

  const _shortSummary = hasContent(headline?.short_summary)
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

  const showStructured = Boolean(parsedResponse);

  if (assessment.status === "pending") {
    return <PendingAssessmentCard assessment={assessment} />
  }

  return (
    <Card
      isInteractive
      glassEffectStyle="clear"
      variant="glass"
      sx={{ marginBottom: 3 }}
      glassTintColor={withOpacity("#000", 0.9)}
    >
      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: ROUTES.AGENT_ASSESSMENT_ID.path,
            params: { id: assessment.agent?.id, assessmentId: assessment.id },
          });
        }}
        activeOpacity={0.7}
      >
        <AssessmentPreview assessmentData={assessment} />
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

      {/* <TradeSummary tradeActions={tradeActions} /> */}
      {tradeActions.length > 0 && tradeActions.map((action, index) => (
        <TradeActionDisplay
          key={`${action.asset ?? "action"}-${index}`}
          actionData={action}
          showReason={expanded}
        />
      ))}
    </Card>
  );
}

export default React.memo(AssessmentCard);
