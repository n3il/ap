import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import AssessmentCard from '@/components/AssessmentCard';
import StatCard from '@/components/StatCard';
import { assessmentService } from '@/services/assessmentService';

export default function AgentTab() {
  const [filter, setFilter] = useState('all'); // 'all', 'market_scan', 'position_review'

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
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error) {
    return (
      <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 6 }}>
        <Text sx={{ color: '#f87171', textAlign: 'center', marginBottom: 4 }}>Error loading assessments</Text>
        <TouchableOpacity onPress={refetch} sx={{ backgroundColor: '#a855f7', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 'xl' }}>
          <Text sx={{ color: '#f1f5f9', fontWeight: '600' }}>Retry</Text>
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
          tintColor="#fff"
        />
      }
    >
      {/* Stats Cards */}
      {stats && (
        <View sx={{ paddingHorizontal: 6, marginBottom: 6 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} sx={{ marginBottom: 4 }}>
            <StatCard
              label="Total"
              value={stats.totalAssessments}
              trend="Assessments"
              trendColor="#c084fc"
            />
            <StatCard
              label="Market Scans"
              value={stats.marketScans}
              trend="Searches"
              trendColor="#c084fc"
            />
            <StatCard
              label="Reviews"
              value={stats.positionReviews}
              trend="Positions"
              trendColor="#4ade80"
            />
            <StatCard
              label="Actions"
              value={stats.actionsTriggered}
              trend="Triggered"
              trendColor="#fb923c"
            />
          </ScrollView>
        </View>
      )}

      {/* Filter Buttons */}
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
                ? { backgroundColor: 'rgba(168, 85, 247, 0.2)', borderColor: '#c084fc' }
                : { backgroundColor: 'rgba(30, 41, 59, 0.5)', borderColor: 'rgba(51, 65, 85, 0.3)' })
            }}
          >
            <Text sx={{
              textAlign: 'center',
              fontWeight: '600',
              fontSize: 12,
              color: filter === 'all' ? '#c084fc' : '#94a3b8'
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
                ? { backgroundColor: 'rgba(168, 85, 247, 0.2)', borderColor: '#c084fc' }
                : { backgroundColor: 'rgba(30, 41, 59, 0.5)', borderColor: 'rgba(51, 65, 85, 0.3)' })
            }}
          >
            <Text sx={{
              textAlign: 'center',
              fontWeight: '600',
              fontSize: 12,
              color: filter === 'market_scan' ? '#c084fc' : '#94a3b8'
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
                ? { backgroundColor: 'rgba(34, 197, 94, 0.2)', borderColor: '#4ade80' }
                : { backgroundColor: 'rgba(30, 41, 59, 0.5)', borderColor: 'rgba(51, 65, 85, 0.3)' })
            }}
          >
            <Text sx={{
              textAlign: 'center',
              fontWeight: '600',
              fontSize: 12,
              color: filter === 'position_review' ? '#4ade80' : '#94a3b8'
            }}>
              Position Review
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Assessments List */}
      <View sx={{ paddingHorizontal: 6 }}>
        {filteredAssessments.length === 0 ? (
          <View sx={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
            <Text sx={{ color: '#94a3b8', fontSize: 18, textAlign: 'center', marginBottom: 2 }}>No assessments yet</Text>
            <Text sx={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>
              Assessments will appear as your agents analyze the market
            </Text>
          </View>
        ) : (
          <>
            <Text sx={{ color: '#f1f5f9', fontSize: 20, fontWeight: '700', marginBottom: 4 }}>
              Timeline ({filteredAssessments.length})
            </Text>
            {filteredAssessments.map((assessment) => (
              <View key={assessment.id} sx={{ marginBottom: 2 }}>
                {assessment.agents && (
                  <Text sx={{ color: '#94a3b8', fontSize: 12, marginBottom: 1, marginLeft: 1 }}>
                    {assessment.agents.name} • {assessment.agents.model_name}
                  </Text>
                )}
                <AssessmentCard assessment={assessment} />
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}
