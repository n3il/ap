import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ContainerView, { PaddedView } from "@/components/ContainerView";
import SectionTitle from "@/components/SectionTitle";
import {
  GlassButton,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "@/components/ui";
import { agentService } from "@/services/agentService";
import { useColors, withOpacity } from "@/theme";

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

export default function ModalCreateAgent() {
  const insets = useSafeAreaInsets();
  const { colors: palette } = useColors();
  const isPresented = router.canGoBack();
  const [formData, setFormData] = useState({
    name: "",
    llm_provider: "google",
    model_name: "gemini-2.5-flash-preview-09-2025",
  });

  const createAgentMutation = useMutation({
    mutationFn: (agentData) => agentService.createAgent(agentData),
    onSuccess: (newAgent) => {
      router.push(`/(agent)/[${newAgent.id}]`);
    },
    onError: (_error) => {
      alert(`Failed to create agent. ${_error.message}`);
    },
  });

  const selectedProvider = LLM_PROVIDERS.find(
    (p) => p.id === formData.llm_provider,
  );

  return (
    <ContainerView>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top}
        style={{ flex: 1 }}
      >
        <PaddedView
          style={{
            backgroundColor: "card",
            flexGrow: 1,
          }}
        >
          <View
            style={{
              marginBottom: 4,
              borderBottomWidth: 1,
              borderBottomColor: withOpacity(palette.foreground, 0.1),
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <SectionTitle title="Create" sx={{ padding: 6, fontSize: 16 }} />
              {isPresented && (
                <GlassButton
                  onPress={() => router.push("../")}
                  tintColor={palette.glassTint}
                  style={{
                    flexGrow: 0,
                  }}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={14}
                    color={palette.foreground}
                  />
                </GlassButton>
              )}
            </View>
          </View>

          <ScrollView
            style={{ padding: 6 }}
            contentContainerStyle={{
              gap: 14,
            }}
          >
            <View style={{ marginBottom: 4, gap: 12 }}>
              <SectionTitle title="Name" />
              <TextInput
                style={{
                  marginTop: 0,
                  paddingVertical: 22,
                  fontSize: 14,
                  backgroundColor: palette.surface,
                  borderWidth: 0,
                  borderRadius: 18,
                  elevation: 10,
                  shadowColor: palette.shadow,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 1,
                  shadowRadius: 1,
                  letterSpacing: 3,
                  fontFamily: "monospace",
                  fontWeight: "700",
                }}
                placeholder="(╯° _ °）╯  ノ( º _ ºノ) "
                placeholderTextColor={
                  palette.secondary500 ?? palette.textSecondary
                }
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                autoFocus
              />
            </View>
            <View style={{ marginBottom: 4, gap: 12 }}>
              <SectionTitle title="Model Provider" />
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
                {LLM_PROVIDERS.map((provider) => (
                  <GlassButton
                    key={provider.id}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        llm_provider: provider.id,
                        model_name: provider.models[0],
                      })
                    }
                    // tintColor={selectedProvider?.id === provider.id
                    //   ? withOpacity(palette.providers[provider.id], .4)
                    //   : withOpacity(palette.providers[provider.id], .1)}
                  >
                    <Text
                      style={{
                        color:
                          formData.llm_provider === provider.id
                            ? palette.foreground
                            : palette.mutedForeground,
                      }}
                    >
                      {provider.name}
                    </Text>
                  </GlassButton>
                ))}
              </View>
            </View>

            <View style={{ marginBottom: 4, gap: 12 }}>
              <SectionTitle title="Model" />
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
                {selectedProvider?.models.map((model) => (
                  <GlassButton
                    key={model}
                    onPress={() =>
                      setFormData({ ...formData, model_name: model })
                    }
                    // tintColor={formData.model_name === model
                    //   ? withOpacity(palette.providers[selectedProvider.id], .9)
                    //   : withOpacity(palette.providers[selectedProvider.id], .1)}
                  >
                    <Text
                      variant="xs"
                      style={{
                        color:
                          formData.model_name === model
                            ? palette.foreground
                            : palette.mutedForeground,
                      }}
                    >
                      {model}
                    </Text>
                  </GlassButton>
                ))}
              </View>
            </View>
          </ScrollView>

          <GlassButton
            variant="primary"
            onPress={() => createAgentMutation.mutate(formData)}
            activeOpacity={0.8}
          >
            Continue
          </GlassButton>
        </PaddedView>
      </KeyboardAvoidingView>
    </ContainerView>
  );
}
