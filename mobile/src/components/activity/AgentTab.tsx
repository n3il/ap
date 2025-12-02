import { useQuery } from "@tanstack/react-query";
import AssessmentCard from "@/components/AssessmentCard";
import StatCard from "@/components/StatCard";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "@/components/ui";
import { assessmentService } from "@/services/assessmentService";
import { useColors } from "@/theme";

export default function AgentTab() {
  const { colors: palette } = useColors();

  // Fetch all assessments
  const {
    data: allAssessments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["all-assessments"],
    queryFn: assessmentService.getAllAssessments,
  });

  // Fetch assessment stats
  const { data: stats } = useQuery({
    queryKey: ["assessment-stats"],
    queryFn: () => assessmentService.getAssessmentStats(),
  });

  if (isLoading) {
    return (
      <View sx={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={palette.foreground} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        sx={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 6,
        }}
      >
        <Text
          sx={{ color: "errorLight", textAlign: "center", marginBottom: 4 }}
        >
          Error loading assessments
        </Text>
        <TouchableOpacity
          onPress={refetch}
          sx={{
            backgroundColor: "brand300",
            paddingHorizontal: 6,
            paddingVertical: 3,
            borderRadius: "xl",
          }}
        >
          <Text sx={{ color: "textPrimary", fontWeight: "600" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      sx={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          tintColor={palette.foreground}
        />
      }
    >
      {stats && (
        <View sx={{ paddingHorizontal: 6, marginBottom: 6 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            sx={{ marginBottom: 4 }}
          >
            <StatCard
              label="Total"
              value={stats.totalAssessments}
              trend="Assessments"
              trendColor="brand300"
            />
            <StatCard
              label="Actions"
              value={stats.actionsTriggered}
              trend="Triggered"
              trendColor="warning"
            />
          </ScrollView>
        </View>
      )}

      <View sx={{ paddingHorizontal: 6 }}>
        {allAssessments.length === 0 ? (
          <View
            sx={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 20,
            }}
          >
            <Text
              sx={{
                color: "mutedForeground",
                fontSize: 18,
                textAlign: "center",
                marginBottom: 2,
              }}
            >
              No assessments yet
            </Text>
            <Text
              sx={{ color: "secondary500", fontSize: 14, textAlign: "center" }}
            >
              Assessments will appear as your agents analyze the market
            </Text>
          </View>
        ) : (
          <>
            <Text
              sx={{
                color: "textPrimary",
                fontSize: 20,
                fontWeight: "700",
                marginBottom: 4,
              }}
            >
              Timeline ({allAssessments.length})
            </Text>
            {allAssessments.map((assessment) => (
              <AssessmentCard key={assessment.id} assessment={assessment} />
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}
