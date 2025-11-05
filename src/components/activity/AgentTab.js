import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import AssessmentCard from '@/components/AssessmentCard';
import StatCard from '@/components/StatCard';
import { assessmentService } from '@/services/assessmentService';
import { useColors } from '@/theme';

export default function AgentTab() {
  const [filter, setFilter] = useState('all'); // 'all', 'market_scan', 'position_review'
  const {
    colors: palette,
    success,
    withOpacity,
  } = useColors();

  // Fetch all assessments
  const { data: allAssessments = [], isLoading, error, refetch } = useQuery({
    queryKey: ['all-assessments'],
    queryFn: assessmentService.getAllAssessments,
  });

  // Fetch assessment stats
  const { data: stats } = useQuery({
    queryKey: ['assessment-stats'],
    queryFn: () => assessmentService.getAssessmentStats(),
  });

  // Filter assessments based on selected filter
  const filteredAssessments = allAssessments.filter(assessment => {
    if (filter === 'market_scan') return assessment.type === 'MARKET_SCAN';
    if (filter === 'position_review') return assessment.type === 'POSITION_REVIEW';
    return true;
  });

  if (isLoading) {
    return (
      <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={palette.foreground} />
      </View>
    );
  }

  if (error) {
    return (
      <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 6 }}>
        <Text sx={{ color: 'errorLight', textAlign: 'center', marginBottom: 4 }}>Error loading assessments</Text>
        <TouchableOpacity
          onPress={refetch}
          sx={{
            backgroundColor: 'brand300',
            paddingHorizontal: 6,
            paddingVertical: 3,
            borderRadius: 'xl',
          }}
        >
          <Text sx={{ color: 'textPrimary', fontWeight: '600' }}>Retry</Text>
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} sx={{ marginBottom: 4 }}>
            <StatCard
              label="Total"
              value={stats.totalAssessments}
              trend="Assessments"
              trendColor="brand300"
            />
            <StatCard
              label="Market Scans"
              value={stats.marketScans}
              trend="Searches"
              trendColor="brand300"
            />
            <StatCard
              label="Reviews"
              value={stats.positionReviews}
              trend="Positions"
              trendColor="successLight"
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


      <View sx={{ paddingHorizontal: 6, marginBottom: 6 }}>
        <View sx={{ flexDirection: 'row', gap: 2 }}>
          <TouchableOpacity
            onPress={() => setFilter('all')}
            sx={{
              flex: 1,
              paddingVertical: 3,
              borderRadius: 'xl',
              borderWidth: 1,
              ...(filter === 'all'
                ? {
                    backgroundColor: withOpacity(palette.brand500 ?? palette.primary, 0.2),
                    borderColor: 'brand300',
                  }
                : {
                    backgroundColor: withOpacity(palette.secondary800 ?? palette.surfaceSecondary, 0.5),
                    borderColor: withOpacity(palette.secondary700 ?? palette.border, 0.3),
                  })
            }}
          >
            <Text sx={{
              textAlign: 'center',
              fontWeight: '600',
              fontSize: 12,
              color: filter === 'all' ? 'brand300' : 'mutedForeground'
            }}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('market_scan')}
            sx={{
              flex: 1,
              paddingVertical: 3,
              borderRadius: 'xl',
              borderWidth: 1,
              ...(filter === 'market_scan'
                ? {
                    backgroundColor: withOpacity(palette.brand500 ?? palette.primary, 0.2),
                    borderColor: 'brand300',
                  }
                : {
                    backgroundColor: withOpacity(palette.secondary800 ?? palette.surfaceSecondary, 0.5),
                    borderColor: withOpacity(palette.secondary700 ?? palette.border, 0.3),
                  })
            }}
          >
            <Text sx={{
              textAlign: 'center',
              fontWeight: '600',
              fontSize: 12,
              color: filter === 'market_scan' ? 'brand300' : 'mutedForeground'
            }}>
              Market Scan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('position_review')}
            sx={{
              flex: 1,
              paddingVertical: 3,
              borderRadius: 'xl',
              borderWidth: 1,
              ...(filter === 'position_review'
                ? {
                    backgroundColor: withOpacity(success, 0.2),
                    borderColor: 'success',
                  }
                : {
                    backgroundColor: withOpacity(palette.secondary800 ?? palette.surfaceSecondary, 0.5),
                    borderColor: withOpacity(palette.secondary700 ?? palette.border, 0.3),
                  })
            }}
          >
            <Text sx={{
              textAlign: 'center',
              fontWeight: '600',
              fontSize: 12,
              color: filter === 'position_review' ? 'success' : 'mutedForeground'
            }}>
              Position Review
            </Text>
          </TouchableOpacity>
        </View>
      </View>


      <View sx={{ paddingHorizontal: 6 }}>
        {filteredAssessments.length === 0 ? (
          <View sx={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
            <Text sx={{ color: 'mutedForeground', fontSize: 18, textAlign: 'center', marginBottom: 2 }}>No assessments yet</Text>
            <Text sx={{ color: 'secondary500', fontSize: 14, textAlign: 'center' }}>
              Assessments will appear as your agents analyze the market
            </Text>
          </View>
        ) : (
          <>
            <Text sx={{ color: 'textPrimary', fontSize: 20, fontWeight: '700', marginBottom: 4 }}>
              Timeline ({filteredAssessments.length})
            </Text>
            {/* {filteredAssessments.map((assessment) => (
              <View key={assessment.id} sx={{ marginBottom: 2 }}>
                {assessment.agents && (
                  <Text sx={{ color: 'mutedForeground', fontSize: 12, marginBottom: 1, marginLeft: 1 }}>
                    {assessment.agents.name} • {assessment.agents.model_name}
                  </Text>
                )}
                <AssessmentCard assessment={assessment} />
              </View>
            ))} */}
          </>
        )}
      </View>
    </ScrollView>
  );
}
