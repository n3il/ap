import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, Card } from '@/components/ui';
import AssessmentCard from '@/components/AssessmentCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassContainer } from 'expo-glass-effect';
import SectionTitle from '../SectionTitle';
import { useColors } from '@/theme';

export default function ThoughtsTab({ assessments = [], isOwnAgent, pendingAssessment = false }) {
  const { info, withOpacity } = useColors();

  return (
    <View
    style={{ flex: 1}}
    >
      {isOwnAgent ? (
        <>
          <SectionTitle>
            All Assessments ({assessments.length + (pendingAssessment ? 1 : 0)})
          </SectionTitle>

          <GlassContainer style={{ gap: 16 }}>
            {/* Pending Assessment Card */}
            {pendingAssessment && (
              <Card
                variant="glass"
                sx={{
                  backgroundColor: withOpacity(info, 0.1),
                  borderWidth: 1,
                  borderColor: withOpacity(info, 0.3),
                  borderRadius: 'lg',
                  padding: 4,
                  marginBottom: 2,
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
              </Card>
            )}

            {assessments.length === 0 && !pendingAssessment ? (
              <Text sx={{ color: 'mutedForeground', textAlign: 'center', paddingVertical: 3, fontSize: 12 }}>
                No assessments yet
              </Text>
            ) : (
              assessments.map((assessment) => (
                <AssessmentCard key={assessment.id} assessment={assessment} />
              ))
            )}
          </GlassContainer>
        </>
      ) : (
        <Text variant="sm" sx={{ color: 'secondary500', fontSize: 12, lineHeight: 18 }}>
          Assessment logs stay private to protect alpha. Clone the agent to produce your own ACTION_JSON telemetry.
        </Text>
      )}
    </View>
  );
}
