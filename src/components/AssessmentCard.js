import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StatusBadge, Divider, Stack, Card, Avatar } from '@/components/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatRelative } from 'date-fns';
import { formatRelativeDate } from '@/utils/date';
import { PROVIDER_COLORS } from '@/factories/mockAgentData';
import { formatTradeActionLabel, getTradeActionVariant } from '@/utils/tradeActions';
import TradeActionDisplay from './TradeActionDisplay';
import { useColors } from '@/theme';

export default function AssessmentCard({ assessment }) {
  const [expanded, setExpanded] = useState(false);
  const { colors: palette, withOpacity } = useColors();

  const extractedAction = useMemo(() => {
    if (!assessment.llm_response_text) return null;

    try {
      const actionJsonMatch = assessment.llm_response_text.match(/\*\*ACTION_JSON:\*\*\s*(\{[^}]+\})/);
      if (actionJsonMatch && actionJsonMatch[1]) {
        return JSON.parse(actionJsonMatch[1]);
      }
    } catch (error) {
      console.error('Error parsing action JSON:', error);
    }

    return null;
  }, [assessment.llm_response_text]);

  const cleanedResponseText = useMemo(() => {
    if (!assessment.llm_response_text) return '';
    return assessment.llm_response_text.replace(/\*\*ACTION_JSON:\*\*\s*\{[^}]+\}/g, '').trim();
  }, [assessment.llm_response_text]);

  const typeLabel = assessment.type === 'MARKET_SCAN' ? 'Market Scan' : 'Position Review';

  console.log({ palette })
  return (
    <Card glassEffectStyle="clear" variant="glass" sx={{ marginBottom: 3 }}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Avatar
            backgroundColor={palette.providers[assessment.agent?.llm_provider]}
            name={assessment.agent?.name}
            email={assessment.agent?.model_name}
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
            <StatusBadge variant={getTradeActionVariant(assessment.trade_action_taken)}>
              {formatTradeActionLabel(assessment.trade_action_taken)}
            </StatusBadge>
          </View>
        )}

        {extractedAction && (
          <View sx={{ marginVertical: 3 }}>
            <TradeActionDisplay actionData={extractedAction} />
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
                {cleanedResponseText.split("\n")[0].slice(0, 800) || 'No analysis available'}
              </Text>

              <Text variant="xs" tone="muted">
                Tap to view full analysis
              </Text>
            </>
          ) : (
            <>
            <Text variant="" tone="primary" sx={{ lineHeight: 24, fontWeight: 300 }}>
              {cleanedResponseText || 'No analysis available'}
            </Text>
            <TouchableOpacity
              onPress={() => setExpanded(!expanded)}
              style={{
                backgroundColor: withOpacity(palette.background ?? palette.surface, 0.2),
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
