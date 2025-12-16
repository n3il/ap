import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ContainerView, { GLOBAL_PADDING } from "@/components/ContainerView";
import StepDirection from "@/components/create/agent/StepDirection";
import StepIdentity, {
  type QuickStartTemplate,
} from "@/components/create/agent/StepIdentity";
import StepModelSelect from "@/components/create/agent/StepModelSelect";
import StepSummary from "@/components/create/agent/StepSummary";
import SectionTitle from "@/components/SectionTitle";
import {
  Badge,
  GlassButton,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SwipeableTabs,
  Text,
  View,
} from "@/components/ui";
import { agentService } from "@/services/agentService";
import { fetchOpenRouterModels, formatModelName } from "@/services/llmService";
import { useColors, withOpacity } from "@/theme";
import { Pressable } from "dripsy";

const normalizeModelSlug = (model: any) =>
  model?.endpoint?.model_variant_permaslug ||
  model?.permaslug ||
  model?.slug ||
  model?.endpoint?.model_variant_slug ||
  "";

const formatPrice = (pricing: any) => {
  const promptCost = parseFloat(pricing?.prompt ?? "");
  if (!Number.isFinite(promptCost)) return null;
  const perK = promptCost * 1000;
  const amount =
    perK >= 1
      ? perK.toFixed(2)
      : perK >= 0.01
        ? perK.toFixed(3)
        : perK.toFixed(4);
  return `$${amount}/1k input`;
};

const contextLengthLabel = (value?: number) => {
  if (!value) return null;
  const inThousands = Math.round(value / 1000);
  return `${inThousands}k ctx`;
};

const guardrailSnippets = [
  "Summarize each decision in 3 bullet points: thesis, risk, upside.",
  "Ask for confirmation before committing to any trade with drawdown risk over 3%.",
  "Keep responses under 90 words unless specifically asked for depth.",
  "Prefer high-confidence moves over frequency; avoid over-trading.",
];

const quickStarts: QuickStartTemplate[] = [
  {
    name: "Lightning",
    headline: "Keeps positions tidy and trims risk before it grows teeth.",
    icon: "lightning-bolt",
  },
  {
    name: "Intra Day",
    headline: "Scans momentum and flags heat with a light, fast touch.",
    icon: "rabbit",
  },
  {
    name: "Long Haul",
    headline: "Stitches together context, risk, and narrative to advise.",
    icon: "tortoise",
  },
];

export default function ModalCreateAgent() {
  const insets = useSafeAreaInsets();
  const { colors: palette } = useColors();
  const isPresented = router.canGoBack();

  const [activeStep, setActiveStep] = useState(0);
  const [models, setModels] = useState<any[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    llm_provider: "",
    model_name: "",
    prompt_direction: "",
  });

  const [modelQuery, setModelQuery] = useState("");
  const [onlyFree, setOnlyFree] = useState(false);
  const [highlightReasoning, setHighlightReasoning] = useState(false);
  const [providerFilter, setProviderFilter] = useState<string | null>(null);

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
  }, []);

  const applyTemplate = useCallback(
    (template: QuickStartTemplate) => {
      const defaultModel = pickDefaultModel(template.modelSuggestions ?? []);
      const slug = defaultModel ? normalizeModelSlug(defaultModel) : "";
      const provider =
        defaultModel?.endpoint?.provider_slug || slug.split("/")[0] || "";

      setFormData((prev) => ({
        ...prev,
        name: template.name,
        prompt_direction: template.prompt,
        model_name: slug || prev.model_name,
        llm_provider: provider || prev.llm_provider,
      }));

      if (slug) {
        setActiveStep(1);
      }
    },
    [pickDefaultModel],
  );

  const appendGuardrail = useCallback((snippet: string) => {
    setFormData((prev) => {
      if (prev.prompt_direction.toLowerCase().includes(snippet.toLowerCase())) {
        return prev;
      }

      const existing = prev.prompt_direction.trim();
      const prefix = existing ? `${existing}\n- ` : "- ";

      return {
        ...prev,
        prompt_direction: `${prefix}${snippet}`,
      };
    });
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
      "openai/gpt-5.2-chat",
      "openai/gpt-4o-mini",
      "google/gemini-2.0-flash",
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

    if (providerFilter) {
      list = list.filter((model) => {
        const provider =
          model?.endpoint?.provider_slug ||
          model?.provider_slug ||
          model?.slug?.split("/")[0];
        return (
          provider?.toString().toLowerCase() === providerFilter.toLowerCase()
        );
      });
    }

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

      const aReasoning = Number(
        a?.endpoint?.supports_reasoning || a?.features?.supports_reasoning,
      );
      const bReasoning = Number(
        b?.endpoint?.supports_reasoning || b?.features?.supports_reasoning,
      );
      if (highlightReasoning) {
        const reasoningSort = bReasoning - aReasoning;
        if (reasoningSort !== 0) return reasoningSort;
      }

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

    return scored.slice(0, 60);
  }, [highlightReasoning, modelQuery, models, onlyFree, providerFilter]);

  const currentModel = useMemo(
    () => findModelBySlug(formData.model_name),
    [formData.model_name, models],
  );

  const creationReady = Boolean(formData.name && formData.model_name);

  const createAgentMutation = useMutation({
    mutationFn: (agentData) => agentService.createAgent(agentData),
    onSuccess: (newAgent) => {
      router.push(`/(agent)/[${newAgent.id}]`);
    },
    onError: (_error: any) => {
      alert(`Failed to create agent. ${_error.message ?? ""}`);
    },
  });

  const renderModel = ({ item }: { item: any }) => {
    const slug = normalizeModelSlug(item);
    if (!slug) return null;

    const isSelected = formData.model_name === slug;
    const displayName = item?.name || formatModelName(item?.slug || slug);
    const provider =
      item?.endpoint?.provider_display_name || "Unknown provider";
    const price = formatPrice(item?.endpoint?.pricing);
    const ctx = contextLengthLabel(
      item?.endpoint?.context_length || item?.context_length,
    );
    const supportsReasoning =
      item?.endpoint?.supports_reasoning || item?.features?.supports_reasoning;

    return (
      <GlassButton
        enabled={false}
        onPress={() => handleModelSelect(slug, item)}
        glassEffectStyle="regular"
        tintColor={
          isSelected ? withOpacity(palette.primary, 0.16) : palette.surface
        }
        style={{
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 6,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            gap: 12,
          }}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="lg" style={{ fontWeight: "700" }}>
              {displayName}
            </Text>
            <Text tone="muted" variant="sm">
              {provider} • {slug}
            </Text>
          </View>
          <Badge variant="default" size="sm">
            Recommended
          </Badge>
        </View>

        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {supportsReasoning && (
            <Badge variant="info" size="sm">
              Reasoning
            </Badge>
          )}
          {ctx && (
            <Badge variant="default" size="sm">
              {ctx}
            </Badge>
          )}
          {price && (
            <Badge variant="default" size="sm">
              {price}
            </Badge>
          )}
          {item?.endpoint?.is_free && (
            <Badge variant="default" size="sm">
              Free
            </Badge>
          )}
        </View>

        <Text
          tone="muted"
          variant="sm"
          style={{
            flex: 0,
          }}
        >
          {item?.description ||
            item?.endpoint?.model?.description ||
            "Balanced defaults for thoughtful, concise replies."}
        </Text>
      </GlassButton>
    );
  };

  const handleRetryModels = () => {
    setModelQuery("");
    setProviderFilter(null);
    setOnlyFree(false);
    setHighlightReasoning(false);
    setModelsError(null);
    setIsLoadingModels(true);
    fetchOpenRouterModels()
      .then(setModels)
      .catch((error: any) => {
        setModels([]);
        setModelsError(error?.message ?? "Could not refresh models.");
      })
      .finally(() => setIsLoadingModels(false));
  };

  const modelLabel = currentModel
    ? formatModelName(currentModel?.slug || normalizeModelSlug(currentModel))
    : "Pick a model";

  const steps = useMemo(
    () => [
      {
        key: "identity",
        title: "Identity",
        isCompleted: Boolean(formData.name.trim()),
        content: () => (
          <StepIdentity
            name={formData.name}
            onChangeName={(name) => setFormData((prev) => ({ ...prev, name }))}
            quickStarts={quickStarts}
            onApplyTemplate={applyTemplate}
          />
        ),
      },
      {
        key: "model",
        title: "Model",
        isCompleted: Boolean(formData.model_name),
        content: () => (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ gap: 12, paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <StepModelSelect
              modelQuery={modelQuery}
              onChangeQuery={setModelQuery}
              onlyFree={onlyFree}
              highlightReasoning={highlightReasoning}
              providerFilter={providerFilter}
              onToggleFree={() => setOnlyFree((prev) => !prev)}
              onToggleReasoning={() => setHighlightReasoning((prev) => !prev)}
              onToggleProviderFilter={() =>
                setProviderFilter((prev) => (prev ? null : "openai"))
              }
              isLoading={isLoadingModels}
              error={modelsError}
              onRetry={handleRetryModels}
              filteredModels={filteredModels}
              renderModelCard={renderModel}
            />
          </ScrollView>
        ),
      },
      {
        key: "direction",
        title: "Direction",
        isCompleted: Boolean(formData.prompt_direction.trim().length),
        content: () => (
          <StepDirection
            prompt={formData.prompt_direction}
            onChangePrompt={(prompt) =>
              setFormData((prev) => ({ ...prev, prompt_direction: prompt }))
            }
            guardrails={guardrailSnippets}
            onAddGuardrail={appendGuardrail}
          />
        ),
      },
      {
        key: "summary",
        title: "Review",
        isCompleted: creationReady,
        content: () => (
          <View style={{ gap: 12, paddingBottom: 32 }}>
            <StepSummary
              name={formData.name || "Unnamed agent"}
              modelLabel={modelLabel}
              promptPreview={formData.prompt_direction}
              creationReady={creationReady}
            />
          </View>
        ),
      },
    ],
    [
      appendGuardrail,
      applyTemplate,
      creationReady,
      filteredModels,
      formData.name,
      formData.model_name,
      formData.prompt_direction,
      highlightReasoning,
      isLoadingModels,
      modelLabel,
      modelQuery,
      modelsError,
      onlyFree,
      providerFilter,
    ],
  );

  const tabs = steps.map((step) => ({
    key: step.key,
    title: step.title,
    isCompleted: step.isCompleted,
    content: step.content,
  }));

  const isLastStep = activeStep === steps.length - 1;

  const stepAllowsNext = () => {
    if (activeStep === 0) return Boolean(formData.name.trim());
    if (activeStep === 1) return Boolean(formData.model_name);
    return true;
  };

  const primaryDisabled = isLastStep
    ? !creationReady || createAgentMutation.isPending
    : !stepAllowsNext();

  const handlePrimary = () => {
    if (isLastStep) {
      if (!creationReady || createAgentMutation.isPending) return;
      createAgentMutation.mutate({
        ...formData,
        name: formData.name.trim(),
        prompt_direction: formData.prompt_direction.trim(),
      });
      return;
    }
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };


  return (
    <ContainerView>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          <View
            style={{
              paddingHorizontal: GLOBAL_PADDING,
              paddingBottom: 12,
              paddingTop: 4,
              borderBottomWidth: 1,
              borderBottomColor: withOpacity(palette.foreground, 0.08),
              gap: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <View style={{ flex: 1, gap: 6 }}>
                <SectionTitle title="New agent" sx={{ padding: 2 }} />
                <Text variant="xl" style={{ fontWeight: "700" }}>
                  Design AI Portfolio Manager
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  <Badge
                    variant={formData.name ? "success" : "default"}
                    size="sm"
                  >
                    Name
                  </Badge>
                  <Badge
                    variant={formData.model_name ? "success" : "default"}
                    size="sm"
                  >
                    Model
                  </Badge>
                  <Badge
                    variant={formData.prompt_direction ? "success" : "default"}
                    size="sm"
                  >
                    Direction
                  </Badge>
                </View>
              </View>
              {isPresented && (
                <Pressable
                  sx={{ padding: 3 }}
                  onPress={() => router.push("../")}
                >
                  <MaterialCommunityIcons
                    name="chevron-double-up"
                    size={18}
                    color={palette.foreground}
                  />
                </Pressable>
              )}
            </View>
          </View>

          <SwipeableTabs
            tabs={tabs}
            activeIndex={activeStep}
            onTabChange={setActiveStep}
            indicatorColor={palette.foreground}
            contentStyle={{
              paddingHorizontal: GLOBAL_PADDING,
              paddingBottom: 16,
            }}
          />

          <View
            style={{
              paddingHorizontal: GLOBAL_PADDING,
              paddingVertical: 12,
              flexDirection: "row",
              gap: 8,
            }}
          >
            {activeStep > 0 && (
              <GlassButton
                onPress={() => setActiveStep((prev) => Math.max(prev - 1, 0))}
                styleVariant="paddedFull"
                tintColor={palette.surface}
                glassEffectStyle="regular"
                style={{ flex: 1 }}
              >
                Back
              </GlassButton>
            )}
            <GlassButton
              onPress={handlePrimary}
              styleVariant="paddedFull"
              tintColor={palette.surface}
              glassEffectStyle="regular"
              disabled={primaryDisabled}
              style={{ flex: 2 }}
            >
              <Text color="surfaceForeground">
                {isLastStep
                  ? createAgentMutation.isPending
                    ? "Launching…"
                    : "Launch agent"
                  : "Next"}
              </Text>

            </GlassButton>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ContainerView>
  );
}
