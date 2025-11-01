import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBadge, Divider, Stack, Card } from '@/components/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AssessmentCard({ assessment }) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const typeLabel = assessment.type === 'MARKET_SCAN' ? 'Market Scan' : 'Position Review';

  return (
    <Card variant="glass" sx={{ marginBottom: 3 }}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <Stack direction="row" justify="space-between" align="flex-start" sx={{ marginBottom: 2 }}>
          <View sx={{ flex: 1 }}>
            <StatusBadge variant="accent">{typeLabel}</StatusBadge>
            <Text variant="xs" tone="muted" sx={{ marginTop: 2 }}>
              {formatDate(assessment.timestamp)}
            </Text>
          </View>
          {expanded ? (
            <MaterialCommunityIcons name="chevron-up" size={24} color="#ddd" />
          ) : (
            <MaterialCommunityIcons name="chevron-down" size={24} color="#ddd" />
          )}
        </Stack>

        {assessment.trade_action_taken && (
          <View sx={{ flexDirection: 'column', gap: 2, marginTop: 2, marginBottom: 2 }}>
            <Text sx={{ color: 'success', fontWeight: '600' }}>
              {assessment.trade_action_taken.replace('_', ' ').toLocaleLowerCase()}
            </Text>
          </View>
        )}


        {!expanded ? (
          <Text variant="sm" tone="primary" sx={{ marginTop: 2 }}>
            {assessment.llm_response_text.split("\n")[0].slice(0, 800) || 'No analysis available'}
          </Text>
        ) : (
          <>
            <Divider sx={{ marginTop: 3 }} />
            <View sx={{ paddingTop: 3 }}>
              <View sx={{ marginBottom: 3 }}>
                <Text variant="xs" tone="muted" sx={{ marginBottom: 2 }}>
                  LLM Analysis
                </Text>
                <View
                  sx={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: 'lg',
                    padding: 3,
                  }}
                >
                  <Text variant="sm" tone="subtle">
                    {assessment.llm_response_text || 'No analysis available'}
                  </Text>
                </View>
              </View>
              <View sx={{ marginBottom: 3 }}>
                <Text variant="xs" tone="muted" sx={{ marginBottom: 2 }}>
                  Market Data Snapshot
                </Text>
                <View
                  sx={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: 'lg',
                    padding: 3,
                  }}
                >
                  <Text variant="xs" tone="subtle" sx={{ fontFamily: 'monospace' }}>
                    {JSON.stringify(assessment.market_data_snapshot, null, 2)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setExpanded(!expanded)}
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: 8,
                  padding: 8,
                  marginTop: 8,
                }}
              >
                <Text variant="xs" sx={{ textAlign: 'center', color: 'textPrimary' }}>
                  Show Less
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {!expanded && (
          <View sx={{ marginTop: 2 }}>
            <Text variant="xs" tone="muted">
              Tap to view full analysis
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Card>
  );
}
