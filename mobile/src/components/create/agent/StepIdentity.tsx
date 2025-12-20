import SectionTitle from "@/components/SectionTitle";
import { Card, ScrollView, Text, TextInput, View } from "@/components/ui";
import { useColors, withOpacity } from "@/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable } from "dripsy";
import Animated, { FadeInDown } from "react-native-reanimated";

export interface QuickStartTemplate {
  name: string;
  headline: string;
  icon: string;
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
      contentContainerStyle={{ gap: 24, paddingBottom: 48, paddingTop: 8 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ gap: 10 }}>
        <SectionTitle title="Identity" />
        <TextInput
          placeholder={'Name your agent (e.g., "Mojo Manager")'}
          placeholderTextColor={palette.secondary500 ?? palette.textSecondary}
          value={name}
          onChangeText={onChangeName}
          autoFocus
          style={{
            fontSize: 18,
            fontWeight: "700",
            paddingVertical: 12
          }}
        />
        <Text tone="muted" variant="sm">
          A memorable name helps personality shine through.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ gap: 12 }}>
        <View style={{ gap: 4 }}>
          <SectionTitle title="Persona Templates" />
          <Text variant="sm" tone="muted">
            Start fast with a predefined momentum profile.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          {quickStarts.map((template, index) => (
            <Pressable
              key={template.name}
              onPress={() => onApplyTemplate(template)}
            >
              <Card
                variant="glass"
                glassEffectStyle="light"
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  gap: 16,
                  borderWidth: name === template.name ? 2 : 1,
                  borderColor: name === template.name ? palette.primary : withOpacity(palette.foreground, 0.05),
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: withOpacity(palette.primary, 0.1),
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <MaterialCommunityIcons
                    name={template.icon as any}
                    size={28}
                    color={palette.primary}
                  />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="lg" style={{ fontWeight: "800" }}>
                    {template.name}
                  </Text>
                  <Text variant="sm" tone="muted" numberOfLines={2}>
                    {template.headline}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={withOpacity(palette.foreground, 0.3)}
                />
              </Card>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}
