import React from 'react';
import { View, Text, TouchableOpacity } from '@/components/ui';
import GlassCard from '@/components/GlassCard';
import { PROMPT_TYPES } from '@/services';

const PromptAssignmentsCard = ({
  selectedMarketPrompt,
  selectedPositionPrompt,
  onSelectPrompt,
  onOpenLibrary,
  isFetching,
  isMutating,
}) => {
  const renderPromptBlock = (label, summary, description, instruction, onPress) => (
    <TouchableOpacity onPress={onPress} sx={{ marginBottom: 3 }} activeOpacity={0.8}>
      <View sx={{ padding: 3 }}>
        <Text variant="sm" sx={{ color: '#cbd5e1', fontWeight: '600' }}>{label}</Text>
        <Text variant="xs" sx={{ color: '#94a3b8', textTransform: 'uppercase', marginTop: 1, letterSpacing: 1 }}>
          {summary || 'Default Prompt'}
        </Text>
        <Text variant="xs" sx={{ color: '#64748b', marginTop: 2 }}>
          {description ||
            'Configure a custom prompt to override the default AlphaQuant instruction.'}
        </Text>
        <Text variant="xs" sx={{ color: 'rgba(100, 116, 139, 0.7)', marginTop: 3, fontFamily: 'monospace', lineHeight: 16 }} numberOfLines={3}>
          {instruction || 'Uses the built-in AlphaQuant system instruction.'}
        </Text>
        <Text variant="xs" sx={{ color: 'accent', fontWeight: '600', marginTop: 3 }}>Tap to change →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <GlassCard sx={{ padding: 4 }}>
      <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <Text sx={{ color: '#cbd5e1', fontSize: 16, fontWeight: '600' }}>Think Strat</Text>
        <TouchableOpacity
          onPress={onOpenLibrary}
          sx={{
            paddingHorizontal: 3,
            paddingVertical: 2,
            borderRadius: 'lg',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(255, 255, 255, 0.04)'
          }}
          activeOpacity={0.8}
        >
          <Text variant="xs" sx={{ color: 'accent', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
            Manage Library
          </Text>
        </TouchableOpacity>
      </View>
      {isFetching ? (
        <Text variant="sm" sx={{ color: '#64748b' }}>Loading prompts...</Text>
      ) : (
        <>
          {renderPromptBlock(
            'Market Scan',
            selectedMarketPrompt?.name,
            selectedMarketPrompt?.description,
            selectedMarketPrompt?.system_instruction,
            () => onSelectPrompt(PROMPT_TYPES.MARKET_SCAN)
          )}
          {renderPromptBlock(
            'Position Review',
            selectedPositionPrompt?.name,
            selectedPositionPrompt?.description,
            selectedPositionPrompt?.system_instruction,
            () => onSelectPrompt(PROMPT_TYPES.POSITION_REVIEW)
          )}
        </>
      )}
      {(isMutating) ? (
        <Text variant="xs" sx={{ color: '#64748b', marginTop: 3 }}>Updating agent prompt selection...</Text>
      ) : null}
    </GlassCard>
  );
};

export default PromptAssignmentsCard;
