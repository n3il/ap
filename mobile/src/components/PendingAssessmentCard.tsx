import React from "react";
import AnimatedPhraseSlider from "@/components/ui/AnimatedPhraseSlider";
import { ActivityIndicator, Card, Skeleton, Text, View } from "@/components/ui";
import { useColors, withOpacity } from "@/theme";
import type { AssessmentType } from "@/types/agent";
import { useTheme } from "@/contexts/ThemeContext";

const LOADING_PHRASES = [
  "Calibrating signals...",
  "Digesting market context...",
  "Crunching trade ideas...",
  "Optimizing risk levels...",
];

function PendingAssessmentCard({ assessment }: { assessment: AssessmentType }) {
  const { colors } = useColors();
  const { isDark } = useTheme()

  return (
    <Card
      isInteractive
      glassEffectStyle={isDark ? "clear" : "regular"}
      variant="glass"
      style={{
        paddingVertical: 18,
        paddingHorizontal: 18,
        borderRadius: 24
      }}
    >
      <View sx={{ gap: 3 }}>
        <View
          sx={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <AnimatedPhraseSlider phrases={LOADING_PHRASES} />
          <ActivityIndicator />
        </View>


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
