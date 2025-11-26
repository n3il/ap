import { useLocalSearchParams } from "expo-router";
import React from "react";
import ReportDetail from "@/components/reports/Detail";
import { assessmentService } from "@/services/assessmentService";

export default function AgentReportScreen() {
  const { id: _agentId, assessmentId } = useLocalSearchParams();

  const { data: assessment } =
    assessmentService.getAssessmentById(assessmentId);

  return <ReportDetail assessment={assessment} />;
}
