import SectionTitle from "@/components/SectionTitle";
import {
  ActivityIndicator,
  Button,
  Card,
  FlatList,
  Text,
  TextInput,
  View,
} from "@/components/ui";
import { useColors, withOpacity } from "@/theme";

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
  renderModelCard: ({ item }: { item: any }) => React.ReactElement | null;
}

export default function StepModelSelect({
  modelQuery,
  onChangeQuery,
  onlyFree,
  highlightReasoning,
  providerFilter,
  onToggleFree,
  onToggleReasoning,
  onToggleProviderFilter,
  isLoading,
  error,
  onRetry,
  filteredModels,
  renderModelCard,
}: StepModelSelectProps) {
  const { colors: palette } = useColors();

  return (
    <View style={{ flex: 1, gap: 12 }}>
      <View style={{ gap: 10 }}>
        <TextInput
          placeholder={'Search models or providers (e.g., "gemini", "claude")'}
          value={modelQuery}
          onChangeText={onChangeQuery}
          style={{ marginTop: 6 }}
        />
      </View>

      {isLoading ? (
        <View
          style={{
            paddingVertical: 24,
            alignItems: "center",
            gap: 8,
          }}
        >
          <ActivityIndicator />
          <Text tone="muted">Fetching the latest models…</Text>
        </View>
      ) : error ? (
        <Card
          variant="outlined"
          style={{
            padding: 12,
            borderColor: withOpacity(palette.error, 0.4),
            gap: 8,
          }}
        >
          <Text style={{ fontWeight: "700" }}>Couldn't load models</Text>
          <Text tone="muted">{error}</Text>
          <Button onPress={onRetry} variant="surface" size="md">
            Try again
          </Button>
        </Card>
      ) : (
        <FlatList
          data={filteredModels}
          keyExtractor={(item) =>
            item?.endpoint?.model_variant_permaslug ??
            item?.permaslug ??
            item?.slug
          }
          renderItem={renderModelCard}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <Card
              variant="outlined"
              style={{
                padding: 12,
                gap: 6,
                borderColor: withOpacity(palette.warning, 0.4),
              }}
            >
              <Text style={{ fontWeight: "700" }}>No matches yet</Text>
              <Text tone="muted">
                Adjust filters or clear the search to see everything.
              </Text>
            </Card>
          }
        />
      )}
    </View>
  );
}
