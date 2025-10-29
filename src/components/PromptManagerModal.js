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
  ActivityIndicator,
} from '@/components/ui';
import { BlurView } from 'expo-blur';
import { useMutation } from '@tanstack/react-query';
import GlassCard from './GlassCard';
import { promptService, PROMPT_TYPES, PROMPT_PLACEHOLDERS } from '@/services';
import { supabase } from '@/config/supabase';

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
  const [testingPromptId, setTestingPromptId] = useState(null);
  const [testResults, setTestResults] = useState({});

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

  const testPromptMutation = useMutation({
    mutationFn: async (prompt) => {
      const { data, error } = await supabase.functions.invoke('run-assessment', {
        body: {
          prompt_id: prompt.id,
          prompt_type: prompt.prompt_type,
          system_instruction: prompt.system_instruction,
          user_template: prompt.user_template,
        },
      });

      if (error) throw error;
      return { promptId: prompt.id, result: data };
    },
    onSuccess: ({ promptId, result }) => {
      setTestResults((prev) => ({ ...prev, [promptId]: result }));
      setTestingPromptId(null);
    },
    onError: (error) => {
      setTestingPromptId(null);
      Alert.alert('Test Failed', error.message || 'Failed to run prompt test.');
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

  const handleTestPrompt = (prompt) => {
    setTestingPromptId(prompt.id);
    testPromptMutation.mutate(prompt);
  };

  const toggleTestResult = (promptId) => {
    if (testResults[promptId]) {
      setTestResults((prev) => {
        const updated = { ...prev };
        delete updated[promptId];
        return updated;
      });
    }
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
        data.map((prompt) => {
          const isTesting = testingPromptId === prompt.id;
          const hasResult = testResults[prompt.id];

          return (
            <GlassCard
              key={prompt.id}
              sx={{ padding: 3, marginBottom: 3, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
            >
              <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                <View sx={{ flex: 1, paddingRight: 3 }}>
                  <Text sx={{ fontWeight: '600' }}>{prompt.name}</Text>
                  {prompt.description ? (
                    <Text variant="xs" tone="muted" sx={{ marginTop: 1 }}>
                      {prompt.description}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => handleTestPrompt(prompt)}
                  disabled={isTesting}
                  sx={{
                    paddingHorizontal: 3,
                    paddingVertical: 2,
                    borderRadius: 'lg',
                    backgroundColor: isTesting ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.2)',
                    borderWidth: 1,
                    borderColor: 'rgba(59, 130, 246, 0.5)',
                    minWidth: 70,
                    alignItems: 'center',
                  }}
                >
                  {isTesting ? (
                    <ActivityIndicator size="small" color="#60a5fa" />
                  ) : (
                    <Text variant="xs" sx={{ fontWeight: '600', color: '#60a5fa' }}>
                      Run
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <Text variant="xs" sx={{ color: 'rgba(148, 163, 184, 0.7)', marginTop: 2, fontFamily: 'monospace', lineHeight: 16 }}>
                {prompt.system_instruction}
              </Text>

              {hasResult && (
                <View sx={{ marginTop: 3, paddingTop: 3, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <Text variant="xs" sx={{ fontWeight: '600', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: 1 }}>
                      Test Result
                    </Text>
                    <TouchableOpacity onPress={() => toggleTestResult(prompt.id)}>
                      <Text variant="xs" sx={{ color: '#94a3b8' }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView
                    horizontal
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: 'lg',
                      padding: 3,
                      maxHeight: 200,
                    }}
                  >
                    <Text variant="xs" sx={{ fontFamily: 'monospace', color: '#cbd5e1', lineHeight: 18 }}>
                      {typeof testResults[prompt.id] === 'string'
                        ? testResults[prompt.id]
                        : JSON.stringify(testResults[prompt.id], null, 2)}
                    </Text>
                  </ScrollView>
                </View>
              )}
            </GlassCard>
          );
        })
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
