import { useEffect, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "@/components/ui";
import { useColors } from "@/theme";
import { PaddedView } from "./ContainerView";
import PromptPickerModal from "./PromptPickerModal";
import SectionTitle from "./SectionTitle";

export const LLM_PROVIDERS = [
  {
    id: "google",
    name: "Google",
    models: ["gemini-2.5-flash-preview-09-2025", "gemini-1.5-pro"],
  },
  {
    id: "openai",
    name: "OpenAI",
    models: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
  },
  { id: "deepseek", name: "DeepSeek", models: ["deepseek-chat"] },
];

export default function CreateAgentModal({
  visible,
  onClose,
  onSubmit,
  promptOptions = [],
  onManagePrompts,
}) {
  const insets = useSafeAreaInsets();
  const { colors: palette, info, withOpacity } = useColors();
  const [formData, setFormData] = useState({
    name: "",
    llm_provider: "google",
    model_name: "gemini-2.5-flash-preview-09-2025",
    initial_capital: "",
    prompt_id: null,
  });
  const [promptPickerVisible, setPromptPickerVisible] = useState(false);

  const promptLibrary = useMemo(() => promptOptions, [promptOptions]);

  useEffect(() => {
    if (!visible) return;

    const defaultPrompt =
      promptLibrary.find((prompt) => prompt.is_default) ||
      promptLibrary[0] ||
      null;

    setFormData((prev) => ({
      ...prev,
      prompt_id: defaultPrompt?.id ?? null,
    }));
  }, [visible, promptLibrary]);

  const handleSubmit = () => {
    if (!formData.name || !formData.initial_capital) {
      alert("Please fill in all required fields");
      return;
    }

    onSubmit({
      ...formData,
      initial_capital: parseFloat(formData.initial_capital),
    });

    // Reset form
    setFormData({
      name: "",
      llm_provider: "google",
      model_name: "gemini-2.5-flash-preview-09-2025",
      initial_capital: "",
      prompt_id: promptLibrary.find((prompt) => prompt.is_default)?.id || null,
    });
  };

  const selectedProvider = LLM_PROVIDERS.find(
    (p) => p.id === formData.llm_provider,
  );
  const selectedPrompt = promptLibrary.find(
    (prompt) => prompt.id === formData.prompt_id,
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      style={{ flex: 1 }}
      backdropColor={palette.background}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        sx={{ flex: 1 }}
      >
        <PaddedView
          sx={{ backgroundColor: "card", flex: 1, paddingTop: insets.top }}
        >
          <View
            sx={{
              paddingVertical: 6,
              marginBottom: 4,
              borderBottomWidth: 1,
              borderBottomColor: withOpacity(palette.foreground, 0.1),
            }}
          >
            <View
              sx={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <SectionTitle title="Create Agent" sx={{ fontSize: 16 }} />
              <TouchableOpacity onPress={onClose}>
                <Text sx={{ fontSize: 24, color: "mutedForeground" }}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            sx={{ padding: 6 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          >
            <View sx={{ marginBottom: 4 }}>
              <SectionTitle title="Agent Name" />
              <TextInput
                sx={{
                  backgroundColor: withOpacity(palette.foreground, 0.05),
                  color: "textPrimary",
                  paddingHorizontal: 4,
                  paddingVertical: 3,
                  borderRadius: "xl",
                  borderWidth: 1,
                  borderColor: withOpacity(palette.foreground, 0.1),
                }}
                placeholder="e.g., Casper the Friendly Ghost"
                placeholderTextColor={
                  palette.secondary500 ?? palette.textSecondary
                }
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
              />
            </View>

            <View sx={{ marginBottom: 4 }}>
              <View
                sx={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 2,
                }}
              >
                <Text variant="sm" tone="muted">
                  Prompt Template
                </Text>
                <TouchableOpacity onPress={() => setPromptPickerVisible(true)}>
                  <Text
                    variant="xs"
                    sx={{
                      color: "accent",
                      fontWeight: "600",
                      textTransform: "uppercase",
                    }}
                  >
                    Select
                  </Text>
                </TouchableOpacity>
              </View>
              <View
                sx={{
                  padding: 3,
                  borderWidth: 1,
                  borderColor: withOpacity(palette.foreground, 0.08),
                  backgroundColor: withOpacity(palette.foreground, 0.04),
                  borderRadius: "xl",
                }}
              >
                <Text variant="sm" sx={{ fontWeight: "600" }}>
                  {selectedPrompt?.name || "Default Prompt"}
                </Text>
                <Text variant="xs" tone="muted" sx={{ marginTop: 1 }}>
                  {selectedPrompt?.description ||
                    "Uses the default AlphaQuant instruction set."}
                </Text>
              </View>
            </View>

            {onManagePrompts ? (
              <TouchableOpacity
                onPress={onManagePrompts}
                sx={{
                  marginBottom: 6,
                  paddingHorizontal: 4,
                  paddingVertical: 3,
                  borderRadius: "xl",
                  borderWidth: 1,
                  borderColor: withOpacity(palette.foreground, 0.08),
                  backgroundColor: withOpacity(palette.foreground, 0.04),
                }}
              >
                <Text
                  variant="sm"
                  sx={{
                    color: "accent",
                    textAlign: "center",
                    fontWeight: "600",
                    textTransform: "uppercase",
                  }}
                >
                  Manage Prompt Library
                </Text>
              </TouchableOpacity>
            ) : null}

            <View sx={{ marginBottom: 4 }}>
              <SectionTitle title="Model Provider" />
              <View sx={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
                {LLM_PROVIDERS.map((provider) => (
                  <TouchableOpacity
                    key={provider.id}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        llm_provider: provider.id,
                        model_name: provider.models[0],
                      })
                    }
                    sx={{
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                      borderRadius: "xl",
                      borderWidth: 1,
                      backgroundColor:
                        formData.llm_provider === provider.id
                          ? withOpacity(info, 0.2)
                          : withOpacity(palette.foreground, 0.05),
                      borderColor:
                        formData.llm_provider === provider.id
                          ? "accent"
                          : withOpacity(palette.foreground, 0.1),
                    }}
                  >
                    <Text
                      sx={{
                        color:
                          formData.llm_provider === provider.id
                            ? "accent"
                            : "mutedForeground",
                      }}
                    >
                      {provider.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View sx={{ marginBottom: 4 }}>
              <SectionTitle title="Model" />
              <View sx={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
                {selectedProvider?.models.map((model) => (
                  <TouchableOpacity
                    key={model}
                    onPress={() =>
                      setFormData({ ...formData, model_name: model })
                    }
                    sx={{
                      paddingHorizontal: 3,
                      paddingVertical: 2,
                      borderRadius: "lg",
                      borderWidth: 1,
                      backgroundColor:
                        formData.model_name === model
                          ? withOpacity(info, 0.2)
                          : withOpacity(palette.foreground, 0.05),
                      borderColor:
                        formData.model_name === model
                          ? "accent"
                          : withOpacity(palette.foreground, 0.1),
                    }}
                  >
                    <Text
                      variant="xs"
                      sx={{
                        color:
                          formData.model_name === model
                            ? "accent"
                            : "mutedForeground",
                      }}
                    >
                      {model}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View sx={{ marginBottom: 6 }}>
              <Text variant="sm" tone="muted" sx={{ marginBottom: 2 }}>
                Initial Capital (USD) *
              </Text>
              <TextInput
                sx={{
                  backgroundColor: withOpacity(palette.foreground, 0.05),
                  color: "textPrimary",
                  paddingHorizontal: 4,
                  paddingVertical: 3,
                  borderRadius: "xl",
                  borderWidth: 1,
                  borderColor: withOpacity(palette.foreground, 0.1),
                }}
                placeholder="10000"
                placeholderTextColor={
                  palette.secondary500 ?? palette.textSecondary
                }
                keyboardType="numeric"
                value={formData.initial_capital}
                onChangeText={(text) =>
                  setFormData({ ...formData, initial_capital: text })
                }
              />
            </View>

            <Button
              variant="primary"
              onPress={handleSubmit}
              sx={{
                backgroundColor: "accent",
                borderRadius: "xl",
                marginTop: 2,
              }}
              activeOpacity={0.8}
            >
              <Text
                sx={{
                  color: "accentForeground",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                Create
              </Text>
            </Button>
          </ScrollView>
        </PaddedView>
      </KeyboardAvoidingView>

      <PromptPickerModal
        visible={promptPickerVisible}
        prompts={promptLibrary}
        selectedPromptId={formData.prompt_id}
        onSelect={(prompt) =>
          setFormData((prev) => ({ ...prev, prompt_id: prompt.id ?? null }))
        }
        onClose={() => setPromptPickerVisible(false)}
        title="Select Prompt"
        emptyMessage="Create a prompt from the prompt library."
        onCreateNew={onManagePrompts}
      />
    </Modal>
  );
}
