import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBadge, Divider, Stack, Card, Avatar } from '@/components/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatRelative } from 'date-fns';
import { formatRelativeDate } from '@/utils/date';
import { PROVIDER_COLORS } from '@/factories/mockAgentData';
import { useLocalization } from '@/hooks/useLocalization';

export default function AssessmentCard({ assessment }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLocalization();

  const typeLabel = assessment.type === 'MARKET_SCAN' ? 'Market Scan' : 'Position Review';

  return (
    <Card glassEffectStyle="clear" variant="glass" sx={{ marginBottom: 3 }}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Avatar
            backgroundColor={PROVIDER_COLORS[assessment.agent?.llm_provider]}
            name={assessment.agent?.name}
            email={assessment.agent?.email}
            size="sm"
          />
          <Text variant="xs" tone="muted">
            {formatRelativeDate(assessment.timestamp)}
          </Text>
        </View>

        {assessment.trade_action_taken && (
          <View sx={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 2,
            justifyContent: 'flex-start',
            marginVertical: 4
          }}>
            <StatusBadge variant="info">
              {typeLabel}
            </StatusBadge>
            <StatusBadge variant="muted">
              {t(`tradeActionTaken.${assessment.trade_action_taken}`)}
            </StatusBadge>
          </View>
        )}
        <View
          sx={{
            borderRadius: 'lg',
            fontFamily: 'monospace'
          }}
        >

          {!expanded ? (
            <>
              <Text variant="" tone="primary" sx={{ lineHeight: 24, fontWeight: 300 }}>
                {assessment.llm_response_text.split("\n")[0].slice(0, 800) || 'No analysis available'}
              </Text>

              <Text variant="xs" tone="muted">
                Tap to view full analysis
              </Text>
            </>
          ) : (
            <>
            <Text variant="" tone="primary" sx={{ lineHeight: 24, fontWeight: 300 }}>
              {assessment.llm_response_text || 'No analysis available'}
            </Text>
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
            </>
          )}
        </View>
      </TouchableOpacity>
    </Card>
  );
}
