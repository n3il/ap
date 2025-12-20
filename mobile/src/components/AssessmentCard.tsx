import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import PendingAssessmentCard from "@/components/PendingAssessmentCard";
import { ROUTES } from "@/config/routes";
import { useTheme } from "@/contexts/ThemeContext";
import useMarkdownStyles from "@/hooks/useMarkdownStyles";
import { useColors } from "@/theme";
import type { AssessmentType } from "@/types/agent";
import ReportPreview from "./reports/Preview";
import TradeActionDisplay from "./TradeActionDisplay";
import { Pressable, Text, View } from "dripsy";
import { GlassButton } from "./ui";


function AssessmentCard({ assessment }: { assessment: AssessmentType }) {
  const { isDark } = useTheme();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const { colors: palette, withOpacity } = useColors();

  if (assessment.status === "pending") {
    return <PendingAssessmentCard assessment={assessment} />;
  }

  return (
    <GlassButton
      enabled={true}
      glassEffectStyle={"clear"}
      tintColor={isDark
        ? withOpacity(palette.surfaceLight, .5) // "rgba(0, 0, 0, 0.3)"
        : "rgba(255,255,255, 1)"
      }
      style={[{
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginHorizontal: 10,
        backgroundColor: "transparent",
        flexDirection: "row",
        // borderColor: "#000",
      }, !isDark && {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }]}
    >
      <Pressable
        onPress={() => {
          router.push({
            pathname: ROUTES.AGENT_ASSESSMENT_ID.path,
            params: { id: assessment.agent?.id, assessmentId: assessment.id },
          });
        }}
      >
        <ReportPreview
          assessmentData={assessment}
          innerStyle={{
            gap: 8,
            flexDirection: "column-reverse",
            justifyContent: "space-between",
          }}
        />
        <Text>asdf</Text>
      </Pressable>

      {assessment?.parsed_llm_response.tradeActions.map((action, index) => (
        <TradeActionDisplay
          key={`${action.asset ?? "action"}-${index}`}
          actionData={action}
          showReason={expanded}
        />
      ))}
    </GlassButton>
  );
}

export default AssessmentCard;
