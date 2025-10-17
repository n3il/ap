import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from '@/components/ui';
import { BlurView } from 'expo-blur';
import { useMutation } from '@tanstack/react-query';
import GlassCard from './GlassCard';
import { promptService, PROMPT_TYPES, PROMPT_PLACEHOLDERS } from '@/services';

const defaultFormState = {
  name: '',
  prompt_type: PROMPT_TYPES.MARKET_SCAN,
  description: '',
  system_instruction: '',
  user_template: '',
};

export default function PromptManagerModal({
  visible,
  onClose,
  prompts = [],
  onPromptCreated,
}) {
  const [form, setForm] = useState(defaultFormState);

  const createPromptMutation = useMutation({
    mutationFn: promptService.createPrompt,
    onSuccess: () => {
      setForm(defaultFormState);
      onPromptCreated?.();
      Alert.alert('Prompt Saved', 'Your prompt template is ready to use.');
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to save prompt.');
    },
  });

  const marketScanPrompts = useMemo(
    () => prompts.filter((prompt) => prompt.prompt_type === PROMPT_TYPES.MARKET_SCAN),
    [prompts]
  );
  const positionPrompts = useMemo(
    () => prompts.filter((prompt) => prompt.prompt_type === PROMPT_TYPES.POSITION_REVIEW),
    [prompts]
  );

  const handleSubmit = () => {
    if (!form.name.trim()) {
      Alert.alert('Missing Name', 'Please provide a name for this prompt.');
      return;
    }
    if (!form.system_instruction.trim()) {
      Alert.alert('Missing System Instruction', 'Please provide a system instruction.');
      return;
    }
    if (!form.user_template.trim()) {
      Alert.alert('Missing Template', 'Please provide a user message template.');
      return;
    }
    createPromptMutation.mutate(form);
  };

  const renderPromptList = (title, data) => (
    <View sx={{ marginBottom: 6 }}>
      <Text variant="xs" tone="muted" sx={{ textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
        {title}
      </Text>
      {data.length === 0 ? (
        <GlassCard sx={{ padding: 3, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.04)' }}>
          <Text variant="sm" tone="muted">
            No prompts yet. Create one below.
          </Text>
        </GlassCard>
      ) : (
        data.map((prompt) => (
          <GlassCard
            key={prompt.id}
            sx={{ padding: 3, marginBottom: 3, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
          >
            <Text sx={{ fontWeight: '600' }}>{prompt.name}</Text>
            {prompt.description ? (
              <Text variant="xs" tone="muted" sx={{ marginTop: 1 }}>
                {prompt.description}
              </Text>
            ) : null}
            <Text variant="xs" sx={{ color: 'rgba(148, 163, 184, 0.7)', marginTop: 2, fontFamily: 'monospace', lineHeight: 16 }}>
              {prompt.system_instruction}
            </Text>
          </GlassCard>
        ))
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <BlurView intensity={80} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View sx={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.95)' }}>
            <View sx={{ paddingHorizontal: 6, paddingTop: 14, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)' }}>
              <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="xl" sx={{ fontWeight: 'bold' }}>Prompt Library</Text>
                <TouchableOpacity onPress={onClose}>
                  <Text sx={{ fontSize: 24, color: 'mutedForeground' }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text variant="sm" tone="muted" sx={{ marginTop: 2 }}>
                Create reusable prompt templates and assign them to your agents.
              </Text>
            </View>

            <ScrollView
              sx={{ flex: 1, paddingHorizontal: 6, paddingVertical: 4 }}
              contentContainerStyle={{ paddingBottom: 120 }}
            >
              {renderPromptList('Market Scan Prompts', marketScanPrompts)}
              {renderPromptList('Position Review Prompts', positionPrompts)}

              <GlassCard sx={{ padding: 4, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                <Text variant="lg" sx={{ fontWeight: '600', marginBottom: 3 }}>
                  Create New Prompt
                </Text>

                <View sx={{ marginBottom: 4 }}>
                  <Text variant="xs" tone="muted" sx={{ textTransform: 'uppercase', marginBottom: 1 }}>
                    Prompt Name
                  </Text>
                  <TextInput
                    value={form.name}
                    onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
                    placeholder="Morning Market Sweep"
                    placeholderTextColor="#64748b"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: 'xl',
                      paddingHorizontal: 3,
                      paddingVertical: 2,
                      color: 'textPrimary'
                    }}
                  />
                </View>

                <View sx={{ marginBottom: 4 }}>
                  <Text variant="xs" tone="muted" sx={{ textTransform: 'uppercase', marginBottom: 2 }}>
                    Prompt Type
                  </Text>
                  <View sx={{ flexDirection: 'row', gap: 2 }}>
                    {Object.values(PROMPT_TYPES).map((type) => {
                      const isSelected = form.prompt_type === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          onPress={() =>
                            setForm((prev) => ({ ...prev, prompt_type: type }))
                          }
                          sx={{
                            paddingHorizontal: 3,
                            paddingVertical: 2,
                            borderRadius: 'lg',
                            borderWidth: 1,
                            borderColor: isSelected ? 'accent' : 'rgba(255, 255, 255, 0.08)',
                            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)'
                          }}
                        >
                          <Text
                            variant="xs"
                            sx={{
                              fontWeight: '600',
                              color: isSelected ? 'accent' : 'mutedForeground'
                            }}
                          >
                            {type === PROMPT_TYPES.MARKET_SCAN ? 'Market Scan' : 'Position Review'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View sx={{ marginBottom: 4 }}>
                  <Text variant="xs" tone="muted" sx={{ textTransform: 'uppercase', marginBottom: 1 }}>
                    Description (optional)
                  </Text>
                  <TextInput
                    value={form.description}
                    onChangeText={(text) =>
                      setForm((prev) => ({ ...prev, description: text }))
                    }
                    placeholder="How this prompt guides the model"
                    placeholderTextColor="#64748b"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: 'xl',
                      paddingHorizontal: 3,
                      paddingVertical: 2,
                      color: 'textPrimary'
                    }}
                  />
                </View>

                <View sx={{ marginBottom: 4 }}>
                  <Text variant="xs" tone="muted" sx={{ textTransform: 'uppercase', marginBottom: 1 }}>
                    System Instruction
                  </Text>
                  <TextInput
                    value={form.system_instruction}
                    onChangeText={(text) =>
                      setForm((prev) => ({ ...prev, system_instruction: text }))
                    }
                    placeholder="System prompt for the model"
                    placeholderTextColor="#64748b"
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: 'xl',
                      paddingHorizontal: 3,
                      paddingVertical: 3,
                      color: 'textPrimary'
                    }}
                  />
                </View>

                <View sx={{ marginBottom: 4 }}>
                  <Text variant="xs" tone="muted" sx={{ textTransform: 'uppercase', marginBottom: 1 }}>
                    User Template
                  </Text>
                  <TextInput
                    value={form.user_template}
                    onChangeText={(text) =>
                      setForm((prev) => ({ ...prev, user_template: text }))
                    }
                    placeholder="Prompt content with placeholders like {{MARKET_PRICES}}"
                    placeholderTextColor="#64748b"
                    multiline
                    numberOfLines={8}
                    textAlignVertical="top"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: 'xl',
                      paddingHorizontal: 3,
                      paddingVertical: 3,
                      color: 'textPrimary'
                    }}
                  />
                </View>

                <View sx={{ marginBottom: 4, padding: 3, borderRadius: 'xl', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <Text variant="xs" tone="muted" sx={{ textTransform: 'uppercase', marginBottom: 2 }}>
                    Available Placeholders
                  </Text>
                  {Object.entries(PROMPT_PLACEHOLDERS).map(([token, description]) => (
                    <View key={token} sx={{ marginBottom: 2 }}>
                      <Text variant="xs" sx={{ fontFamily: 'monospace' }}>{token}</Text>
                      <Text variant="xs" tone="muted" sx={{ marginTop: 1 }}>
                        {description}
                      </Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={createPromptMutation.isLoading}
                  sx={{
                    borderRadius: 'xl',
                    paddingVertical: 4,
                    backgroundColor: createPromptMutation.isLoading ? 'rgba(59, 130, 246, 0.4)' : 'accent'
                  }}
                >
                  <Text sx={{ color: 'accentForeground', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
                    {createPromptMutation.isLoading ? 'Saving...' : 'Save Prompt'}
                  </Text>
                </TouchableOpacity>
              </GlassCard>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}
