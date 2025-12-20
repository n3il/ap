import SectionTitle from "@/components/SectionTitle";
import {
  ActivityIndicator,
  Badge,
  Button,
  Card,
  Text,
  TextInput,
  View,
} from "@/components/ui";
import { useColors, withOpacity } from "@/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable } from "dripsy";
import Animated, { FadeInDown } from "react-native-reanimated";

interface StepModelSelectProps {
  modelQuery: string;
  onChangeQuery: (value: string) => void;
  onlyFree: boolean;
  highlightReasoning: boolean;
  providerFilter: string | null;
  onToggleFree: () => void;
  onToggleReasoning: () => void;
  onToggleProviderFilter: () => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  filteredModels: any[];
  handleModelSelect: (modelSlug: string, model: any) => void;
  selectedModelSlug: string;
}

export default function StepModelSelect({
  modelQuery,
  onChangeQuery,
  onlyFree,
  onToggleFree,
  isLoading,
  error,
  onRetry,
  filteredModels,
  handleModelSelect,
  selectedModelSlug,
}: StepModelSelectProps) {
  const { colors: palette } = useColors();

  const featuredModels = [
    {
      slug: "openai/gpt-4o",
      name: "GPT-4o",
      provider: "OpenAI",
      desc: "Top tier intelligence, best for complex logic.",
      icon: "brain"
    },
    {
      slug: "google/gemini-2.0-flash-exp:free",
      name: "Gemini 2.0 Flash",
      provider: "Google",
      desc: "Instant responses, great for high frequency.",
      icon: "flash",
      isFree: true
    }
  ];

  const renderModelCard = (item: any) => {
    const slug = item?.endpoint?.model_variant_permaslug || item?.permaslug || item?.slug || "";
    const isSelected = selectedModelSlug === slug;
    const isFree = item?.endpoint?.is_free;
    const name = item?.name || item?.short_name || slug;

    return (
      <Pressable key={slug} onPress={() => handleModelSelect(slug, item)}>
        <Card
          variant="glass"
          glassEffectStyle="light"
          style={{
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected ? palette.primary : withOpacity(palette.foreground, 0.05),
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text variant="md" style={{ fontWeight: '700' }}>{name}</Text>
              {isFree && (
                <Badge variant="success" size="xs">FREE</Badge>
              )}
            </View>
            <Text variant="xs" tone="muted" numberOfLines={1}>{slug}</Text>
          </View>
          {isSelected && (
            <MaterialCommunityIcons name="check-circle" size={20} color={palette.primary} />
          )}
        </Card>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, gap: 20 }}>
      {/* Featured Models */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ gap: 12 }}>
        <SectionTitle title="Recommended" />
        <View style={{ gap: 10 }}>
          {featuredModels.map((m) => {
            const isSelected = selectedModelSlug === m.slug;
            return (
              <Pressable key={m.slug} onPress={() => handleModelSelect(m.slug, m)}>
                <Card
                  variant="glass"
                  glassEffectStyle="regular"
                  style={{
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? palette.primary : withOpacity(palette.foreground, 0.05),
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: withOpacity(palette.primary, 0.1),
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MaterialCommunityIcons name={m.icon as any} size={22} color={palette.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text variant="md" style={{ fontWeight: '800' }}>{m.name}</Text>
                      {m.isFree && <Badge variant="success" size="xs">FREE</Badge>}
                    </View>
                    <Text variant="xs" tone="muted">{m.desc}</Text>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* Library Search */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ gap: 12 }}>
        <SectionTitle title="Model Library" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <TextInput
              placeholder={'Search models…'}
              value={modelQuery}
              onChangeText={onChangeQuery}
              style={{ paddingVertical: 10 }}
            />
          </View>
          <Button
            variant={onlyFree ? "surface" : "outline"}
            size="md"
            onPress={onToggleFree}
            style={{ paddingHorizontal: 12 }}
          >
            <Text style={{ fontSize: 12 }}>Free Only</Text>
          </Button>
        </View>

        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: "center", gap: 12 }}>
            <ActivityIndicator color={palette.primary} />
            <Text tone="muted" variant="sm">Connecting to OpenRouter…</Text>
          </View>
        ) : error ? (
          <Card variant="outlined" style={{ padding: 16, borderStyle: 'dashed', alignItems: 'center', gap: 12 }}>
            <Text tone="muted" variant="sm">{error}</Text>
            <Button onPress={onRetry} variant="surface" size="sm">Retry</Button>
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {filteredModels.map(renderModelCard)}
            {filteredModels.length === 0 && (
              <Text tone="muted" style={{ textAlign: 'center', paddingVertical: 20 }}>No models match your search.</Text>
            )}
          </View>
        )}
      </Animated.View>
    </View>
  );
}
