import SectionTitle from "@/components/SectionTitle";
import { Button, ScrollView, Text, TextInput, View } from "@/components/ui";
import { useColors, withOpacity } from "@/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface StepDirectionProps {
  prompt: string;
  onChangePrompt: (value: string) => void;
  guardrails: string[];
  onAddGuardrail: (snippet: string) => void;
}

export default function StepDirection({
  prompt,
  onChangePrompt,
  guardrails,
  onAddGuardrail,
}: StepDirectionProps) {
  const { colors: palette } = useColors();
  const characterCount = prompt.trim().length;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 12, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={{ gap: 10 }}>
        <SectionTitle title="Direction" />
        <MaterialCommunityIcons name="movie-open-outline" size={40} />
        <Text tone="muted" variant="sm">
          Just some hints will do.
        </Text>
        <TextInput
          style={{
            marginTop: 0,
            paddingVertical: 18,
            paddingHorizontal: 18,
            fontSize: 14,
            borderColor: palette.surface,
            borderWidth: .5,
            borderRadius: 18,
            elevation: 6,
            shadowColor: palette.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.8,
            shadowRadius: 1,
            fontFamily: "monospace",
            minHeight: 140,
          }}
          placeholder="Prioritize real life summits"
          placeholderTextColor={palette.secondary500 ?? palette.textSecondary}
          value={prompt}
          onChangeText={onChangePrompt}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <SectionTitle title="Quick-add Examples" />

          {guardrails.map((snippet) => (
            <Button
              key={snippet}
              variant="outline"
              size="sm"
              onPress={() => onAddGuardrail(snippet)}
            >
              <Text numberOfLines={2}>{snippet}</Text>
            </Button>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
