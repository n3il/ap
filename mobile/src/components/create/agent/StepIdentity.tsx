import SectionTitle from "@/components/SectionTitle";
import { Button, ScrollView, Text, TextInput, View } from "@/components/ui";
import { useColors, withOpacity } from "@/theme";

export interface QuickStartTemplate {
  name: string;
  headline: string;
  prompt: string;
  modelSuggestions?: string[];
}

interface StepIdentityProps {
  name: string;
  onChangeName: (value: string) => void;
  quickStarts: QuickStartTemplate[];
  onApplyTemplate: (template: QuickStartTemplate) => void;
}

export default function StepIdentity({
  name,
  onChangeName,
  quickStarts,
  onApplyTemplate,
}: StepIdentityProps) {
  const { colors: palette } = useColors();

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 12, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={{ gap: 10 }}>
        <SectionTitle title="Start with a vibe" />
        <Text tone="muted" variant="sm">
          One tap to pre-fill tone, direction, and a suggested model. You can
          tweak everything afterward.
        </Text>
        <View
          style={{
            flexDirection: "column",
            gap: 10,
          }}
        >
          {quickStarts.map((template) => (
            <Button
              key={template.name}
              onPress={() => onApplyTemplate(template)}
              variant="surface"
              size="lg"
              sx={{
                width: "100%",
                alignItems: "flex-start",
                gap: 4,
                backgroundColor: withOpacity(palette.surface, 0.9),
              }}
            >
              <View sx={{ gap: 4 }}>
                <Text variant="lg" style={{ fontWeight: "700" }}>
                  {template.name}
                </Text>
                <Text numberOfLines={2}>
                  {template.headline}
                </Text>
              </View>
            </Button>
          ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <SectionTitle title="Identity" />
        <TextInput
          placeholder={"Name your agent (e.g., \"Calm Risk Manager\")"}
          placeholderTextColor={palette.secondary500 ?? palette.textSecondary}
          value={name}
          onChangeText={onChangeName}
          autoFocus
          style={{ fontWeight: "600" }}
        />
        <Text tone="muted" variant="sm">
          Make it memorable—this appears on timelines, trades, and invites.
        </Text>
      </View>
    </ScrollView>
  );
}
