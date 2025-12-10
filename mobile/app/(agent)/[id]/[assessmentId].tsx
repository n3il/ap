import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import ContainerView from "@/components/ContainerView";
import ReportDetail from "@/components/reports/Detail";
import { ActivityIndicator, Text, View } from "@/components/ui";
import { assessmentService } from "@/services/assessmentService";
import { useColors } from "@/theme";

export default function AgentReportScreen() {
  const { colors: palette } = useColors();

  const { assessmentId } = useLocalSearchParams();
  const normalizedId =
    typeof assessmentId === "string" && assessmentId.length > 0
      ? assessmentId
      : null;

  const {
    data: assessment,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["agent-assessment-detail", normalizedId],
    queryFn: () => assessmentService.getAssessmentById(normalizedId!),
    enabled: Boolean(normalizedId),
  });

  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        paddingTop: 140,
        backgroundColor: palette.background,
      }}
    >
      {!normalizedId ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text>Missing assessment ID.</Text>
        </View>
      ) : isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator />
        </View>
      ) : isError ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text>
            {error instanceof Error
              ? error.message
              : "Unable to load assessment."}
          </Text>
        </View>
      ) : (
        <ReportDetail assessment={assessment} />
      )}
    </View>
  );
}
