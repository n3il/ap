import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, Card } from '@/components/ui';
import AssessmentCard from '@/components/AssessmentCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassContainer, GlassView } from 'expo-glass-effect';
import SectionTitle from '../SectionTitle';
import { useColors } from '@/theme';
import { useQuery } from '@tanstack/react-query';
import { assessmentService } from '@/services/assessmentService';

export default function ThoughtsTab({ agentId, isOwnAgent, pendingAssessment = false }) {
  const { info, error: errorColor, withOpacity } = useColors();

  // Fetch assessments for this agent
  const {
    data: assessments = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['agent-assessments', agentId],
    queryFn: () => assessmentService.getAssessmentsByAgent(agentId),
    enabled: !!agentId && isOwnAgent,
  });

  return (
    <View style={{ flex: 1}}>
      <SectionTitle>
        All Assessments ({assessments.length + (pendingAssessment ? 1 : 0)})
      </SectionTitle>

      <GlassContainer style={{ gap: 16 }}>
        {/* Loading State */}
        {isLoading && (
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 2, justifyContent: 'center', paddingVertical: 4 }}>
            <ActivityIndicator size="small" color={info} />
            <Text sx={{ color: 'mutedForeground', fontSize: 12 }}>
              Loading assessments...
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <GlassView
            variant="glass"
            style={{
              borderRadius: 16,
              padding: 4,
            }}
          >
            <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={24}
                color={errorColor}
              />
              <View sx={{ flex: 1 }}>
                <Text
                  sx={{
                    color: 'errorLight',
                    fontWeight: '600',
                    fontSize: 14,
                    marginBottom: 1,
                  }}
                >
                  Failed to Load Assessments
                </Text>
                <Text
                  sx={{
                    color: 'secondary500',
                    fontSize: 12,
                  }}
                >
                  {error.message || 'An error occurred while loading assessments'}
                </Text>
              </View>
            </View>
          </GlassView>
        )}

        {/* Pending Assessment Card */}
        {!isLoading && !error && pendingAssessment && (
          <GlassView
            variant="glass"
            style={{
              borderRadius: 16,
              padding: 4,
            }}
          >
            <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <ActivityIndicator size="small" color={info} />
              <View sx={{ flex: 1 }}>
                <Text
                  sx={{
                    color: 'infoLight',
                    fontWeight: '600',
                    fontSize: 14,
                    marginBottom: 1,
                  }}
                >
                  Assessment Running...
                </Text>
                <Text
                  sx={{
                    color: 'secondary500',
                    fontSize: 12,
                  }}
                >
                  Your agent is analyzing the market and generating insights
                </Text>
              </View>
              <MaterialCommunityIcons
                name="timer-sand"
                size={24}
                color={info}
              />
            </View>
          </GlassView>
        )}

        {/* Assessments List */}
        {!isLoading && !error && assessments.length === 0 && !pendingAssessment && (
          <Text sx={{ color: 'mutedForeground', textAlign: 'center', paddingVertical: 3, fontSize: 12 }}>
            No assessments yet
          </Text>
        )}

        {!isLoading && !error && assessments.map((assessment) => (
          <AssessmentCard key={assessment.id} assessment={assessment} />
        ))}
      </GlassContainer>
    </View>
  );
}
