import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StatusBadge, Divider, Stack, Card, Avatar } from '@/components/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatRelative } from 'date-fns';
import { formatRelativeDate } from '@/utils/date';
import { PROVIDER_COLORS } from '@/factories/mockAgentData';
import { formatTradeActionLabel, getTradeActionVariant } from '@/utils/tradeActions';
import TradeActionDisplay from './TradeActionDisplay';
import { useColors } from '@/theme';
import Markdown from 'react-native-markdown-display';

export default function AssessmentCard({ assessment }) {
  const [expanded, setExpanded] = useState(false);
  const { colors: palette, withOpacity } = useColors();

  const markdownStyles = useMemo(() => ({
    body: {
      color: palette.textPrimary,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '300',
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 8,
      color: palette.textPrimary,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '300',
    },
    heading1: {
      color: palette.textPrimary,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 8,
      marginTop: 12,
    },
    heading2: {
      color: palette.textPrimary,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 6,
      marginTop: 10,
    },
    heading3: {
      color: palette.textPrimary,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
      marginTop: 8,
    },
    strong: {
      fontWeight: '700',
      color: palette.textPrimary,
    },
    em: {
      fontStyle: 'italic',
      color: palette.textSecondary,
    },
    code_inline: {
      backgroundColor: withOpacity(palette.surface ?? palette.background, 0.5),
      color: palette.primary,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: 'monospace',
      fontSize: 13,
    },
    code_block: {
      backgroundColor: withOpacity(palette.surface ?? palette.background, 0.5),
      color: palette.textSecondary,
      padding: 12,
      borderRadius: 8,
      fontFamily: 'monospace',
      fontSize: 12,
      marginVertical: 8,
    },
    fence: {
      backgroundColor: withOpacity(palette.surface ?? palette.background, 0.5),
      color: palette.textSecondary,
      padding: 12,
      borderRadius: 8,
      fontFamily: 'monospace',
      fontSize: 12,
      marginVertical: 8,
    },
    bullet_list: {
      marginVertical: 4,
    },
    ordered_list: {
      marginVertical: 4,
    },
    list_item: {
      marginVertical: 2,
      color: palette.textPrimary,
      fontSize: 14,
      lineHeight: 22,
    },
    blockquote: {
      backgroundColor: withOpacity(palette.surface ?? palette.background, 0.3),
      borderLeftWidth: 3,
      borderLeftColor: palette.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginVertical: 8,
      borderRadius: 4,
    },
    link: {
      color: palette.primary,
      textDecorationLine: 'underline',
    },
    hr: {
      backgroundColor: withOpacity(palette.foreground, 0.2),
      height: 1,
      marginVertical: 12,
    },
  }), [palette, withOpacity]);

  const extractedAction = useMemo(() => {
    if (!assessment.llm_response_text) return null;

    try {
      // Try to match array format first: ACTION_JSON: [{...}, {...}]
      const arrayMatch = assessment.llm_response_text.match(/\*\*ACTION_JSON:\*\*\s*(\[\s*\{[\s\S]*?\}\s*\])/);
      if (arrayMatch && arrayMatch[1]) {
        const parsed = JSON.parse(arrayMatch[1]);
        return Array.isArray(parsed) ? parsed : [parsed];
      }

      // Try to match ACTION_JSON: without ** formatting
      const plainArrayMatch = assessment.llm_response_text.match(/ACTION_JSON:\s*(\[\s*\{[\s\S]*?\}\s*\])/);
      if (plainArrayMatch && plainArrayMatch[1]) {
        const parsed = JSON.parse(plainArrayMatch[1]);
        return Array.isArray(parsed) ? parsed : [parsed];
      }

      // Fall back to single object format: ACTION_JSON: {...}
      const singleMatch = assessment.llm_response_text.match(/\*\*ACTION_JSON:\*\*\s*(\{[^}]+\})/);
      if (singleMatch && singleMatch[1]) {
        return [JSON.parse(singleMatch[1])];
      }

      // Try plain single object without ** formatting
      const plainSingleMatch = assessment.llm_response_text.match(/ACTION_JSON:\s*(\{[^}]+\})/);
      if (plainSingleMatch && plainSingleMatch[1]) {
        return [JSON.parse(plainSingleMatch[1])];
      }
    } catch (error) {
      return;
    }

    return null;
  }, [assessment.llm_response_text]);

  const cleanedResponseText = useMemo(() => {
    if (!assessment.llm_response_text) return '';
    // Remove both array and single object ACTION_JSON patterns
    return assessment.llm_response_text
      .replace('Market Analysis:', '')
      .replace(/\*\*ACTION_JSON:\*\*\s*(\[\s*\{[\s\S]*?\}\s*\]|\{[^}]+\})/g, '')
      .replace(/ACTION_JSON:\s*(\[\s*\{[\s\S]*?\}\s*\]|\{[^}]+\})/g, '')
      .trim();
  }, [assessment.llm_response_text]);

  return (
    <Card isInteractive={expanded} glassEffectStyle="clear" variant="glass" sx={{ marginBottom: 3 }}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Avatar
            backgroundColor={palette.providers[assessment.agent?.llm_provider]}
            name={assessment.agent?.name}
            email={assessment.agent?.model_name}
            size="sm"
          />
          <Text variant="xs" tone="muted">
            {formatRelativeDate(assessment.timestamp) || ''}
          </Text>
        </View>

        {extractedAction && Array.isArray(extractedAction) && extractedAction.length > 0 && (
          <View sx={{ marginVertical: 3, gap: 2 }}>
            {extractedAction.map((action, index) => (
              <TradeActionDisplay key={`${action.asset}-${index}`} actionData={action} showReason={expanded} />
            ))}
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
              {cleanedResponseText ? (
                <Markdown style={markdownStyles}>
                  {cleanedResponseText.split("\n").slice(0, 3).join("\n").slice(0, 800) || 'No analysis available'}
                </Markdown>
              ) : (
                <Text variant="" tone="primary" sx={{ lineHeight: 24, fontWeight: 300 }}>
                  No analysis available
                </Text>
              )}

              <Text variant="xs" tone="muted">
                Tap to view full analysis
              </Text>
            </>
          ) : (
            <>
            {cleanedResponseText ? (
              <Markdown style={markdownStyles}>
                {cleanedResponseText}
              </Markdown>
            ) : (
              <Text variant="" tone="primary" sx={{ lineHeight: 24, fontWeight: 300 }}>
                No analysis available
              </Text>
            )}
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
