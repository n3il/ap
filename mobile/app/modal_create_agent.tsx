import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ContainerView, { PaddedView } from "@/components/ContainerView";
import SectionTitle from "@/components/SectionTitle";
import {
  FlatList,
  GlassButton,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "@/components/ui";
import { Keyboard, TouchableWithoutFeedback } from "react-native";
import { agentService } from "@/services/agentService";
import { useColors, withOpacity } from "@/theme";
import {
  fetchOpenRouterModels,
  groupModelsByProvider,
  getPopularModels,
  formatModelName,
  DEFAULT_LLM_PROVIDERS,
  type LLMProvider,
} from "@/services/llmService";

export default function ModalCreateAgent() {
  const insets = useSafeAreaInsets();
  const { colors: palette } = useColors();
  const isPresented = router.canGoBack();

  const [models, setModels] = useState<any[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    llm_provider: "",
    model_name: "",
    prompt_direction: "",
  });

  // Handler to select a model
  const handleModelSelect = (modelSlug: string) => {
    // Extract provider from slug (e.g., "google/gemini-2.0-flash" -> "google")
    const provider = modelSlug.split('/')[0] || 'google';

    setFormData({
      ...formData,
      llm_provider: provider,
      model_name: modelSlug,
    });
  };

  // Fetch available models from OpenRouter on mount
  useEffect(() => {
    async function loadModels() {
      try {
        setIsLoadingModels(true);
        const allModels = await fetchOpenRouterModels();
        setModels(allModels)
      } catch (error) {
        console.error('Failed to load models:', error);
        setModels([]);
      } finally {
        setIsLoadingModels(false);
      }
    }
    loadModels();
  }, []);

  const createAgentMutation = useMutation({
    mutationFn: (agentData) => agentService.createAgent(agentData),
    onSuccess: (newAgent) => {
      router.push(`/(agent)/[${newAgent.id}]`);
    },
    onError: (_error) => {
      alert(`Failed to create agent. ${_error.message}`);
    },
  });

  return (
    <ContainerView>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top}
        style={{ flex: 1 }}
      >
        <PaddedView
          style={{
            flex: 1,
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
            style={{ flex: 1, padding: 6 }}
            contentContainerStyle={{
              gap: 14,
              paddingBottom: 20,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ marginBottom: 4, gap: 12 }}>
              <SectionTitle title="Name" />
              <TextInput
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
              <SectionTitle title="Select Model" />
              {isLoadingModels ? (
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Text style={{ color: palette.mutedForeground }}>
                    Loading models...
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={models.slice(0, 10)}
                  keyExtractor={(item) => item.permaslug || item.slug}
                  contentContainerStyle={{ gap: 8 }}
                  style={{ maxHeight: 300 }}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const isSelected = formData.model_name === item.slug;
                    const displayName = item.name || formatModelName(item.slug);

                    return (
                      <GlassButton
                        onPress={() => handleModelSelect(item.slug)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          marginBottom: 4,
                        }}
                        tintColor={
                          isSelected
                            ? palette.primary
                            : withOpacity(palette.surface, 0.5)
                        }
                      >
                        <View style={{ gap: 4 }}>
                          <Text
                            variant="xs"
                            numberOfLines={2}
                            style={{
                              color: isSelected
                                ? palette.foreground
                                : palette.mutedForeground,
                              fontWeight: isSelected ? "700" : "400",
                              fontSize: 11,
                            }}
                          >
                            {displayName}
                          </Text>
                          {item.provider_display_name && (
                            <Text
                              variant="xs"
                              style={{
                                color: withOpacity(palette.mutedForeground, 0.6),
                                fontSize: 9,
                              }}
                            >
                              {item.provider_display_name}
                              {item.is_free && " • Free"}
                            </Text>
                          )}
                        </View>
                      </GlassButton>
                    );
                  }}
                />
              )}
            </View>

            <View style={{ marginBottom: 4, gap: 12 }}>
              <SectionTitle title="Direction" />
              <TextInput
                style={{
                  marginTop: 0,
                  paddingVertical: 22,
                  paddingHorizontal: 18,
                  fontSize: 14,
                  backgroundColor: palette.surface,
                  borderWidth: 0,
                  borderRadius: 18,
                  elevation: 10,
                  shadowColor: palette.shadow,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 1,
                  shadowRadius: 1,
                  fontFamily: "monospace",
                }}
                placeholder="Custom instructions for agent behavior"
                placeholderTextColor={
                  palette.secondary500 ?? palette.textSecondary
                }
                value={formData.prompt_direction}
                onChangeText={(text) =>
                  setFormData({ ...formData, prompt_direction: text })
                }
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={{ padding: 6, paddingTop: 8 }}>
            <GlassButton
              onPress={() => createAgentMutation.mutate(formData)}
              styleVariant="paddedFull"
              tintColor={palette.surface}
              glassEffectStyle="regular"
              disabled={!formData.name || !formData.model_name}
            >
              Continue
            </GlassButton>
          </View>
        </PaddedView>
      </KeyboardAvoidingView>
    </ContainerView>
  );
}
