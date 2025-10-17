import React, { useState } from 'react';
import { Box, Text, TouchableOpacity, StatusBadge, Divider, Stack } from '@/components/ui';
import GlassCard from './GlassCard';

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
    <GlassCard sx={{ marginBottom: 3 }}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <Stack direction="row" justify="space-between" align="flex-start" sx={{ marginBottom: 2 }}>
          <Box sx={{ flex: 1 }}>
            <StatusBadge variant="accent">{typeLabel}</StatusBadge>
            <Text variant="xs" tone="muted" sx={{ marginTop: 2 }}>
              {formatDate(assessment.timestamp)}
            </Text>
          </Box>
          <Text variant="lg" tone="muted">
            {expanded ? '▼' : '▶'}
          </Text>
        </Stack>

        {assessment.trade_action_taken && (
          <Box sx={{ marginTop: 2, marginBottom: 2 }}>
            <Text variant="xs" tone="muted" sx={{ marginBottom: 1 }}>
              Action Taken
            </Text>
            <Text sx={{ color: 'success', fontWeight: '600' }}>
              {assessment.trade_action_taken}
            </Text>
          </Box>
        )}

        {expanded && (
          <>
            <Divider sx={{ marginTop: 3 }} />
            <Box sx={{ paddingTop: 3 }}>
              <Box sx={{ marginBottom: 3 }}>
                <Text variant="xs" tone="muted" sx={{ marginBottom: 2 }}>
                  Market Data Snapshot
                </Text>
                <Box
                  sx={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: 'lg',
                    padding: 3,
                  }}
                >
                  <Text variant="xs" tone="subtle" sx={{ fontFamily: 'monospace' }}>
                    {JSON.stringify(assessment.market_data_snapshot, null, 2)}
                  </Text>
                </Box>
              </Box>

              <Box sx={{ marginBottom: 3 }}>
                <Text variant="xs" tone="muted" sx={{ marginBottom: 2 }}>
                  LLM Analysis
                </Text>
                <Box
                  sx={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: 'lg',
                    padding: 3,
                  }}
                >
                  <Text variant="sm" tone="subtle">
                    {assessment.llm_response_text}
                  </Text>
                </Box>
              </Box>

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
            </Box>
          </>
        )}

        {!expanded && (
          <Box sx={{ marginTop: 2 }}>
            <Text variant="xs" tone="muted">
              Tap to view full analysis
            </Text>
          </Box>
        )}
      </TouchableOpacity>
    </GlassCard>
  );
}
