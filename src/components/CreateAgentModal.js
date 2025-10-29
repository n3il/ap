import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, KeyboardAvoidingView, Platform } from '@/components/ui';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassCard from './GlassCard';
import PromptPickerModal from './PromptPickerModal';
import { PROMPT_TYPES } from '@/services';

export const LLM_PROVIDERS = [
  { id: 'google', name: 'Google', models: ['gemini-2.5-flash-preview-09-2025', 'gemini-1.5-pro'] },
  { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { id: 'anthropic', name: 'Anthropic', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
  { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-chat'] },
];

export default function CreateAgentModal({
  visible,
  onClose,
  onSubmit,
  promptOptions = [],
  onManagePrompts,
}) {
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    name: '',
    llm_provider: 'google',
    model_name: 'gemini-2.5-flash-preview-09-2025',
    initial_capital: '',
    market_prompt_id: null,
    position_prompt_id: null,
  });
  const [marketPickerVisible, setMarketPickerVisible] = useState(false);
  const [positionPickerVisible, setPositionPickerVisible] = useState(false);

  const marketPrompts = useMemo(
    () => promptOptions.filter((prompt) => prompt.prompt_type === PROMPT_TYPES.MARKET_SCAN),
    [promptOptions]
  );
  const positionPrompts = useMemo(
    () => promptOptions.filter((prompt) => prompt.prompt_type === PROMPT_TYPES.POSITION_REVIEW),
    [promptOptions]
  );

  useEffect(() => {
    if (!visible) return;

    const defaultMarketPrompt =
      marketPrompts.find((prompt) => prompt.is_default) || marketPrompts[0] || null;
    const defaultPositionPrompt =
      positionPrompts.find((prompt) => prompt.is_default) || positionPrompts[0] || null;

    setFormData((prev) => ({
      ...prev,
      market_prompt_id: defaultMarketPrompt?.id ?? null,
      position_prompt_id: defaultPositionPrompt?.id ?? null,
    }));
  }, [visible, marketPrompts, positionPrompts]);

  const handleSubmit = () => {
    if (!formData.name || !formData.initial_capital) {
      alert('Please fill in all required fields');
      return;
    }

    onSubmit({
      ...formData,
      initial_capital: parseFloat(formData.initial_capital),
    });

    // Reset form
    setFormData({
      name: '',
      llm_provider: 'google',
      model_name: 'gemini-2.5-flash-preview-09-2025',
      initial_capital: '',
      market_prompt_id: marketPrompts.find((prompt) => prompt.is_default)?.id || null,
      position_prompt_id: positionPrompts.find((prompt) => prompt.is_default)?.id || null,
    });
  };

  const selectedProvider = LLM_PROVIDERS.find(p => p.id === formData.llm_provider);
  const selectedMarketPrompt = marketPrompts.find(
    (prompt) => prompt.id === formData.market_prompt_id
  );
  const selectedPositionPrompt = positionPrompts.find(
    (prompt) => prompt.id === formData.position_prompt_id
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      style={{ flex: 1 }}
    >
      <BlurView intensity={80} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          sx={{ flex: 1 }}
        >
          <View sx={{ backgroundColor: '#1e293b', flex: 1, paddingTop: insets.top }}>
            <View sx={{ padding: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' }}>
              <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="2xl" sx={{ fontWeight: 'bold' }}>Create Agent</Text>
                <TouchableOpacity onPress={onClose}>
                  <Text sx={{ fontSize: 24, color: 'mutedForeground' }}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView sx={{ padding: 6 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
              <View sx={{ marginBottom: 4 }}>
                <Text variant="sm" tone="muted" sx={{ marginBottom: 2 }}>Agent Name *</Text>
                <TextInput
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'textPrimary',
                    paddingHorizontal: 4,
                    paddingVertical: 3,
                    borderRadius: 'xl',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                  placeholder="e.g., AlphaQuant Pro"
                  placeholderTextColor="#64748b"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View sx={{ marginBottom: 4 }}>
                <Text variant="sm" tone="muted" sx={{ marginBottom: 2 }}>LLM Provider *</Text>
                <View sx={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
                  {LLM_PROVIDERS.map((provider) => (
                    <TouchableOpacity
                      key={provider.id}
                      onPress={() => setFormData({
                        ...formData,
                        llm_provider: provider.id,
                        model_name: provider.models[0]
                      })}
                      sx={{
                        paddingHorizontal: 4,
                        paddingVertical: 2,
                        borderRadius: 'xl',
                        borderWidth: 1,
                        backgroundColor: formData.llm_provider === provider.id
                          ? 'rgba(59, 130, 246, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                        borderColor: formData.llm_provider === provider.id
                          ? 'accent'
                          : 'rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <Text sx={{ color: formData.llm_provider === provider.id ? 'accent' : 'mutedForeground' }}>
                        {provider.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View sx={{ marginBottom: 4 }}>
                <Text variant="sm" tone="muted" sx={{ marginBottom: 2 }}>Model *</Text>
                <View sx={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
                  {selectedProvider?.models.map((model) => (
                    <TouchableOpacity
                      key={model}
                      onPress={() => setFormData({ ...formData, model_name: model })}
                      sx={{
                        paddingHorizontal: 3,
                        paddingVertical: 2,
                        borderRadius: 'lg',
                        borderWidth: 1,
                        backgroundColor: formData.model_name === model
                          ? 'rgba(59, 130, 246, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                        borderColor: formData.model_name === model
                          ? 'accent'
                          : 'rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <Text variant="xs" sx={{ color: formData.model_name === model ? 'accent' : 'mutedForeground' }}>
                        {model}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View sx={{ marginBottom: 6 }}>
                <Text variant="sm" tone="muted" sx={{ marginBottom: 2 }}>Initial Capital (USD) *</Text>
                <TextInput
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'textPrimary',
                    paddingHorizontal: 4,
                    paddingVertical: 3,
                    borderRadius: 'xl',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                  placeholder="10000"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={formData.initial_capital}
                  onChangeText={(text) => setFormData({ ...formData, initial_capital: text })}
                />
              </View>

              <View sx={{
                marginBottom: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 'xl',
                padding: 4
              }}>
                <Text variant="xs" tone="muted" sx={{ textTransform: 'uppercase', marginBottom: 1 }}>Hyperliquid Wallet</Text>
                <Text variant="sm" tone="muted">
                  A new wallet address is generated automatically when the agent is created. Update it later with your production wallet before pushing live trades.
                </Text>
              </View>

              <View sx={{ marginBottom: 4 }}>
                <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <Text variant="sm" tone="muted">Market Scan Prompt</Text>
                  <TouchableOpacity onPress={() => setMarketPickerVisible(true)}>
                    <Text variant="xs" sx={{ color: 'accent', fontWeight: '600', textTransform: 'uppercase' }}>Select</Text>
                  </TouchableOpacity>
                </View>
                <GlassCard sx={{ padding: 3, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.04)' }}>
                  <Text variant="sm" sx={{ fontWeight: '600' }}>
                    {selectedMarketPrompt?.name || 'Default Market Scan'}
                  </Text>
                  <Text variant="xs" tone="muted" sx={{ marginTop: 1 }}>
                    {selectedMarketPrompt?.description ||
                      'Uses the default AlphaQuant market scan instructions.'}
                  </Text>
                </GlassCard>
              </View>

              <View sx={{ marginBottom: 4 }}>
                <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <Text variant="sm" tone="muted">Position Review Prompt</Text>
                  <TouchableOpacity onPress={() => setPositionPickerVisible(true)}>
                    <Text variant="xs" sx={{ color: 'accent', fontWeight: '600', textTransform: 'uppercase' }}>Select</Text>
                  </TouchableOpacity>
                </View>
                <GlassCard sx={{ padding: 3, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.04)' }}>
                  <Text variant="sm" sx={{ fontWeight: '600' }}>
                    {selectedPositionPrompt?.name || 'Default Position Review'}
                  </Text>
                  <Text variant="xs" tone="muted" sx={{ marginTop: 1 }}>
                    {selectedPositionPrompt?.description ||
                      'Uses the default AlphaQuant position management instructions.'}
                  </Text>
                </GlassCard>
              </View>

              <TouchableOpacity
                onPress={onManagePrompts}
                sx={{
                  marginBottom: 6,
                  paddingHorizontal: 4,
                  paddingVertical: 3,
                  borderRadius: 'xl',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)'
                }}
              >
                <Text variant="sm" sx={{ color: 'accent', textAlign: 'center', fontWeight: '600', textTransform: 'uppercase' }}>
                  Manage Prompt Library
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                sx={{ backgroundColor: 'accent', borderRadius: 'xl', paddingVertical: 4, marginTop: 2 }}
                activeOpacity={0.8}
              >
                <Text variant="lg" sx={{ color: 'accentForeground', textAlign: 'center', fontWeight: 'bold' }}>Create Agent</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </BlurView>

      <PromptPickerModal
        visible={marketPickerVisible}
        prompts={marketPrompts}
        selectedPromptId={formData.market_prompt_id}
        onSelect={(prompt) =>
          setFormData((prev) => ({ ...prev, market_prompt_id: prompt.id ?? null }))
        }
        onClose={() => setMarketPickerVisible(false)}
        title="Select Market Scan Prompt"
        emptyMessage="Create a market scan prompt from the prompt library."
        onCreateNew={onManagePrompts}
      />

      <PromptPickerModal
        visible={positionPickerVisible}
        prompts={positionPrompts}
        selectedPromptId={formData.position_prompt_id}
        onSelect={(prompt) =>
          setFormData((prev) => ({ ...prev, position_prompt_id: prompt.id ?? null }))
        }
        onClose={() => setPositionPickerVisible(false)}
        title="Select Position Review Prompt"
        emptyMessage="Create a position review prompt from the prompt library."
        onCreateNew={onManagePrompts}
      />
    </Modal>
  );
}
