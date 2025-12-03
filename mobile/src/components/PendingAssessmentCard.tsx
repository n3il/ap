import React from "react";
import AnimatedPhraseSlider from "@/components/ui/AnimatedPhraseSlider";
import { Card, Skeleton, Text, View } from "@/components/ui";
import { useColors, withOpacity } from "@/theme";
import type { AssessmentType } from "@/types/agent";

const LOADING_PHRASES = [
  "Calibrating signals...",
  "Digesting market context...",
  "Crunching trade ideas...",
  "Optimizing risk levels...",
];

function PendingAssessmentCard({ assessment }: { assessment: AssessmentType }) {
  const { colors } = useColors();

  return (
    <Card
      isInteractive
      glassEffectStyle="clear"
      variant="glass"
      sx={{ marginBottom: 3 }}
      glassTintColor={withOpacity("#000", 0.9)}
    >
      <View sx={{ gap: 3 }}>
        <View
          sx={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text variant="xs" tone="muted" sx={{ fontStyle: "italic" }}>
            Waiting for assessment
          </Text>
          <Text variant="xs" sx={{ fontWeight: "300" }}>
            {assessment.agent?.name ?? "Agent"}
          </Text>
        </View>

        <AnimatedPhraseSlider phrases={LOADING_PHRASES} />

        <View sx={{ gap: 2 }}>
          <Skeleton height={16} width="65%" />
          <Skeleton height={12} width="90%" />
          <Skeleton height={12} width="80%" />
        </View>

        <View sx={{ gap: 2, marginTop: 2 }}>
          {Array.from({ length: 2 }).map((_, index) => (
            <View
              key={`pending-action-${index}`}
              sx={{
                borderWidth: 1,
                borderColor: withOpacity(colors.border ?? "#ffffff", 0.5),
                borderRadius: "lg",
                padding: 3,
                gap: 2,
              }}
            >
              <Skeleton height={10} width="40%" />
              <Skeleton height={12} width="100%" />
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

export default React.memo(PendingAssessmentCard);
