import SectionTitle from "@/components/SectionTitle";
import { Button, Card, ScrollView, Text, TextInput, View } from "@/components/ui";
import { useColors, withOpacity } from "@/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

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

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 24, paddingBottom: 48, paddingTop: 8 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ gap: 12 }}>
        <SectionTitle title="Operating Instructions" />
        <Card
          variant="glass"
          glassEffectStyle="light"
          style={{
            padding: 4,
            borderWidth: 1,
            borderColor: withOpacity(palette.foreground, 0.1),
          }}
        >
          <TextInput
            style={{
              padding: 16,
              fontSize: 16,
              minHeight: 180,
              textAlignVertical: "top",
              fontFamily: "monospace",
              color: palette.foreground,
            }}
            placeholder="e.g., Prioritize preserving capital during high volatility. Only trade BTC and ETH."
            placeholderTextColor={withOpacity(palette.foreground, 0.3)}
            value={prompt}
            onChangeText={onChangePrompt}
            multiline
            numberOfLines={8}
          />
        </Card>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Text variant="xs" tone="muted">
            {prompt.length} characters
          </Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ gap: 16 }}>
        <View style={{ gap: 4 }}>
          <SectionTitle title="Suggested Guardrails" />
          <Text variant="sm" tone="muted">
            Tap to append common constraints to your agent.
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {guardrails.map((snippet) => (
            <Button
              key={snippet}
              variant="outline"
              size="sm"
              onPress={() => onAddGuardrail(snippet)}
              style={{
                borderRadius: 12,
                borderColor: withOpacity(palette.foreground, 0.1),
                backgroundColor: withOpacity(palette.foreground, 0.03),
                paddingVertical: 8,
                paddingHorizontal: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="plus" size={14} color={palette.primary} />
                <Text variant="sm" style={{ maxWidth: 200 }}>{snippet}</Text>
              </View>
            </Button>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}
