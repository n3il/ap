import SectionTitle from "@/components/SectionTitle";
import { GlassButton, ScrollView, Text, TextInput, View } from "@/components/ui";
import { useColors, withOpacity } from "@/theme";

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
        <SectionTitle title="Direction & guardrails" />
        <Text tone="muted" variant="sm">
          Tell the agent how to show up. Think tone, risk posture, and the
          must-haves you never want to explain twice.
        </Text>
        <TextInput
          style={{
            marginTop: 0,
            paddingVertical: 18,
            paddingHorizontal: 18,
            fontSize: 14,
            backgroundColor: palette.surface,
            borderWidth: 0,
            borderRadius: 18,
            elevation: 6,
            shadowColor: palette.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.8,
            shadowRadius: 1,
            fontFamily: "monospace",
            minHeight: 140,
          }}
          placeholder="Custom instructions for agent behavior"
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
          {guardrails.map((snippet) => (
            <GlassButton
              key={snippet}
              styleVariant="minimal"
              tintColor={withOpacity(palette.surface, 0.9)}
              onPress={() => onAddGuardrail(snippet)}
            >
              <Text numberOfLines={2}>{snippet}</Text>
            </GlassButton>
          ))}
        </View>
        <Text tone="muted" variant="sm">
          {characterCount
            ? `${characterCount} characters — clarity is power.`
            : "Add a few lines and we’ll keep them pinned to every run."}
        </Text>
      </View>
    </ScrollView>
  );
}
