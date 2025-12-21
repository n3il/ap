import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView as RNScrollView, View as RNView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ContainerView, { GLOBAL_PADDING } from "@/components/ContainerView";
import SectionTitle from "@/components/SectionTitle";
import {
  Badge,
  GlassButton,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Button,
} from "@/components/ui";
import { agentService } from "@/services/agentService";
import { fetchOpenRouterModels, formatModelName } from "@/services/llmService";
import { useColors, withOpacity } from "@/theme";
import { Pressable } from "dripsy";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import { uniqueNamesGenerator, adjectives, animals, colors } from 'unique-names-generator';

const normalizeModelSlug = (model: any) =>
  model?.endpoint?.model_variant_permaslug ||
  model?.permaslug ||
  model?.slug ||
  model?.endpoint?.model_variant_slug ||
  "";

const quickStarts = [
  {
    id: "The Woodpecker",
    name: "Lightning",
    headline: `Beak strikes hollow wood—
    steady rhythm through the trees,
    drumming out his claim.`,
    icon: "bird",
  },
  {
    id: "The Hare",
    name: "Intra Day",
    headline: `Long ears catch the wind,
    racing through the meadow grass—
    gone before you blink.`,
    icon: "rabbit",
  },
  {
    id: "The Tortoise",
    name: "Long Haul",
    headline: `Ancient, patient shell
    carries centuries of earth.
    Slow steps outlast all.`,
    icon: "tortoise",
  },
];

export default function ModalCreateAgent() {
  const insets = useSafeAreaInsets();
  const { colors: palette } = useColors();
  const isPresented = router.canGoBack();
  const scrollRef = useRef<RNScrollView>(null);
  const modelSectionRef = useRef<RNView>(null);

  const [models, setModels] = useState<any[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    llm_provider: "",
    model_name: "",
    time_horizon: "The Hare",
  });

  const [modelQuery, setModelQuery] = useState("");
  const [isModelDropdownExpanded, setIsModelDropdownExpanded] = useState(false);
  const [onlyFree, setOnlyFree] = useState(false);

  const generateRandomName = useCallback(() => {
    const randomName = uniqueNamesGenerator({
      dictionaries: [adjectives, colors, animals],
      separator: ' ',
      length: 2,
      style: 'capital'
    });
    setFormData(prev => ({ ...prev, name: randomName }));
  }, []);

  const findModelBySlug = useCallback(
    (slug: string) =>
      models.find((model) => normalizeModelSlug(model) === slug),
    [models],
  );

  const pickDefaultModel = useCallback(
    (preferredSlugs: string[] = []) => {
      if (!models.length) return null;
      const preferred =
        preferredSlugs
          .map((slug) => findModelBySlug(slug))
          .filter(Boolean)[0] ?? null;
      if (preferred) return preferred;

      const freeModel = models.find((model) => model?.endpoint?.is_free);
      if (freeModel) return freeModel;

      return models[0];
    },
    [findModelBySlug, models],
  );

  const handleModelSelect = useCallback((modelSlug: string, model?: any) => {
    const provider =
      model?.endpoint?.provider_slug ||
      model?.provider_slug ||
      modelSlug.split("/")[0] ||
      "openai";

    setFormData((prev) => ({
      ...prev,
      llm_provider: provider,
      model_name: modelSlug,
    }));
    setIsModelDropdownExpanded(false);
  }, []);

  useEffect(() => {
    async function loadModels() {
      try {
        setIsLoadingModels(true);
        setModelsError(null);
        const allModels = await fetchOpenRouterModels();
        setModels(allModels);
      } catch (error: any) {
        console.error("Failed to load models:", error);
        setModels([]);
        setModelsError(error?.message ?? "Could not load models right now.");
      } finally {
        setIsLoadingModels(false);
      }
    }
    loadModels();
  }, []);

  useEffect(() => {
    if (!models.length || formData.model_name) return;
    const defaultModel = pickDefaultModel([
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "google/gemini-2.0-flash-exp:free",
    ]);
    if (!defaultModel) return;
    const slug = normalizeModelSlug(defaultModel);
    const provider =
      defaultModel?.endpoint?.provider_slug || slug.split("/")[0] || "";

    setFormData((prev) => ({
      ...prev,
      model_name: slug,
      llm_provider: provider,
    }));
  }, [formData.model_name, models.length, pickDefaultModel]);

  const filteredModels = useMemo(() => {
    const query = modelQuery.trim().toLowerCase();
    let list = models.filter((model) => Boolean(normalizeModelSlug(model)));

    if (onlyFree) {
      list = list.filter((model) => model?.endpoint?.is_free);
    }

    if (query) {
      list = list.filter((model) => {
        const slug = normalizeModelSlug(model).toLowerCase();
        const name = (model?.name || model?.short_name || "").toLowerCase();
        const provider = (
          model?.endpoint?.provider_display_name || ""
        ).toLowerCase();
        return (
          slug.includes(query) ||
          name.includes(query) ||
          provider.includes(query)
        );
      });
    }

    const scored = [...list].sort((a, b) => {
      const aFree = Number(a?.endpoint?.is_free);
      const bFree = Number(b?.endpoint?.is_free);
      const freeSort = bFree - aFree;
      if (freeSort !== 0) return freeSort;

      const aPrice =
        parseFloat(a?.endpoint?.pricing?.prompt ?? "") || Number.MAX_VALUE;
      const bPrice =
        parseFloat(b?.endpoint?.pricing?.prompt ?? "") || Number.MAX_VALUE;
      const priceSort = aPrice - bPrice;
      if (priceSort !== 0) return priceSort;

      const aCreated = new Date(a?.created_at || 0).getTime();
      const bCreated = new Date(b?.created_at || 0).getTime();
      return bCreated - aCreated;
    });

    return scored.slice(0, 40);
  }, [modelQuery, models, onlyFree]);

  const currentModel = useMemo(
    () => findModelBySlug(formData.model_name),
    [formData.model_name, models],
  );

  const modelLabel = currentModel
    ? formatModelName(currentModel?.slug || normalizeModelSlug(currentModel))
    : "Pick a model";

  const creationReady = Boolean(formData.name.trim() && formData.model_name);

  const createAgentMutation = useMutation({
    mutationFn: (agentData: any) => agentService.createAgent(agentData),
    onSuccess: (newAgent: any) => {
      router.push(`/(agent)/[${newAgent.id}]`);
    },
    onError: (_error: any) => {
      alert(`Failed to create agent. ${_error.message ?? ""}`);
    },
  });

  const handleLaunch = () => {
    if (!creationReady || createAgentMutation.isPending) return;
    createAgentMutation.mutate({
      ...formData,
      name: formData.name.trim(),
      prompt_direction: `Time Horizon: ${formData.time_horizon}`,
      simulate: true,
      initial_capital: 10000,
    });
  };

  const toggleModelDropdown = () => {
    const nextState = !isModelDropdownExpanded;
    setIsModelDropdownExpanded(nextState);
    if (nextState) {
      modelSectionRef.current?.measure((_x, y, _width, _height, _pageX, _pageY) => {
        scrollRef.current?.scrollTo({ y: y - 200, animated: true });
      });
    }
  };

  return (
    <ContainerView>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              paddingHorizontal: GLOBAL_PADDING * 1.3,
              paddingBottom: 16,
              paddingTop: 24,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottomWidth: 1,
              borderBottomColor: withOpacity(palette.border, .5),
              marginBottom: 16,
            }}
          >
            <SectionTitle title="Create" sx={{ fontSize: 18, lineHeight: 24 }} />
            {isPresented && (
              <GlassButton
                onPress={() => router.back()}
                styleVariant="minimalSquare"
                tintColor={palette.surfaceLight}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color={palette.surfaceForeground}
                />
              </GlassButton>
            )}
          </View>

          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: GLOBAL_PADDING,
              paddingBottom: "80%",
              gap: 32
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{
              gap: 16,
            }}>
              <View style={{
                gap: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-evenly',
                marginTop: 12,
              }}>
                {quickStarts.map((item) => {
                  const isSelected = formData.time_horizon === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setFormData(p => ({ ...p, time_horizon: item.id }))}
                      sx={{
                        flexDirection: "row",
                        alignItems: "center",
                        borderRadius: "full",
                        borderColor: isSelected ? palette.foreground : withOpacity(palette.foreground, 0.2),
                        borderWidth: 1,
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 20,
                          borderColor: withOpacity(isSelected ? palette.surfaceLight : palette.foreground, 0.05),
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <MaterialCommunityIcons
                          name={item.icon as any}
                          size={36}
                          color={isSelected ? palette.surfaceLight : palette.textSecondary}
                        />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <Text variant="body" sx={{
                  fontWeight: "600",
                  color: palette.textPrimary,
                  textAlign: 'center'
                }}>
                  {formData.time_horizon}
                </Text>
                <Text
                  variant="xs"
                  tone="muted"
                  sx={{
                    marginTop: 2,
                    textAlign: 'center',
                    letterSpacing: 4,
                    lineHeight: 24,
                  }}>
                  {quickStarts.find((item) => item.id === formData.time_horizon)?.headline}
                </Text>
              </View>
            </View>

            <View style={{ gap: 16 }}>
              <View sx={{ gap: 2, paddingHorizontal: 6, }}>
                <View sx={{
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  position: 'relative',
                }}>
                  <TextInput
                    placeholder={'name'}
                    placeholderTextColor={withOpacity(palette.foreground, 0.5)}
                    value={formData.name}
                    onChangeText={(val) => setFormData(p => ({ ...p, name: val }))}
                    style={{
                      flex: 1,
                      fontSize: 24,
                      fontWeight: "300",
                      paddingVertical: 12,
                      paddingHorizontal: 24,
                      borderRadius: 999,
                      width: "100%",
                      borderColor: withOpacity(palette.foreground, 0.2),
                    }}
                  />
                  <Pressable
                    onPress={generateRandomName}
                    sx={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderRadius: 999,
                      position: "absolute",
                      paddingHorizontal: 4,
                      right: 0,
                      top: 0,
                      bottom: 0,
                    }}
                  >
                    <MaterialCommunityIcons name="dice-6" size={24} color={palette.surfaceLight} />
                  </Pressable>
                </View>
                <Text
                  tone="muted" variant="xs"
                  sx={{
                    textAlign: 'center',
                    paddingHorizontal: 24,
                  }}
                >
                  This can be changed anytime between now and publishing your agent.
                </Text>
              </View>
            </View>

            <View ref={modelSectionRef} style={{ gap: 16, marginTop: 12 }}>
              <Pressable
                onPress={toggleModelDropdown}
                sx={{
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  borderRadius: 12,
                  backgroundColor: withOpacity(palette.surfaceLight, 0.1),
                }}
              >
                <MaterialCommunityIcons name="robot-excited" size={20} color={palette.surfaceLight} />
                <View style={{ flex: 1 }}>
                  <Text variant="body" style={{ fontWeight: "700" }}>
                    {modelLabel}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={isModelDropdownExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={palette.textSecondary}
                />
              </Pressable>

              {isModelDropdownExpanded && (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                  layout={Layout.springify()}
                  style={{ gap: 12, marginTop: 4 }}
                >
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        placeholder={'Search'}
                        value={modelQuery}
                        onChangeText={setModelQuery}
                        style={{ paddingVertical: 10 }}
                        autoFocus
                      />
                    </View>
                  </View>

                  {isLoadingModels ? (
                    <View style={{ paddingVertical: 20, alignItems: "center" }}>
                      <ActivityIndicator color={palette.surfaceLight} />
                    </View>
                  ) : (
                    <View style={{ gap: 4 }}>
                      <ScrollView
                        nestedScrollEnabled
                        style={{ maxHeight: 300, marginRight: 96 }}
                        contentContainerStyle={{ gap: 4 }}
                      >
                        {filteredModels.map((item) => {
                          const slug = normalizeModelSlug(item);
                          const isSelected = formData.model_name === slug;
                          const name = item?.name || item?.short_name || slug;
                          return (
                            <Pressable
                              key={slug}
                              onPress={() => handleModelSelect(slug, item)}
                              sx={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                                borderRadius: 8,
                                backgroundColor: isSelected ? withOpacity(palette.surfaceLight, 0.05) : 'transparent',
                              }}
                            >
                              <View style={{ flex: 1 }}>
                                <Text variant="sm" style={{ fontWeight: isSelected ? '700' : '500', color: isSelected ? palette.surfaceLight : palette.textPrimary }}>{name}</Text>
                                <Text variant="xs" tone="muted" numberOfLines={1}>{slug}</Text>
                              </View>
                              {isSelected && (
                                <MaterialCommunityIcons name="check" size={16} color={palette.surfaceLight} />
                              )}
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                </Animated.View>
              )}
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View
            style={{
              paddingHorizontal: GLOBAL_PADDING,
              paddingVertical: 16,
              borderTopWidth: 1,
            }}
          >
            <GlassButton
              onPress={handleLaunch}
              styleVariant="paddedFull"
              tintColor={palette.surfaceLight}
              glassEffectStyle="regular"
              disabled={!creationReady || createAgentMutation.isPending}
            >
              <Text style={{ color: palette.surfaceSecondary, fontWeight: "700" }}>
                {createAgentMutation.isPending ? "Launching…" : "Launch Agent"}
              </Text>
            </GlassButton>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ContainerView>
  );
}
