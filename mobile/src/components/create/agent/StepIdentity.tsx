import SectionTitle from "@/components/SectionTitle";
import { Button, GlassButton, ScrollView, Text, TextInput, View } from "@/components/ui";
import { border, useColors, withOpacity } from "@/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable } from "dripsy";
import { useState } from "react";

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
  const [selected, setSelected] = useState(quickStarts[1])

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 12, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={{ gap: 4, paddingTop: 8 }}>
        <SectionTitle title="Expected Investment Horizon" />
        <Text variant="sm">
          All agents are connected to live data feeds and can react to market conditions quickly.
        </Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-evenly",
            gap: 10,
            marginTop: 16
          }}
        >
          {quickStarts.map((template) => (
            <Pressable
              key={template.name}
              onPress={() => setSelected(template)}
              sx={{
                flexDirection: "column",
                background: "transparent",
                borderWidth: 2,
                border: "border",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 18,
                paddingHorizontal: 4,
                paddingVertical: 1,
                opacity: selected.name === template.name ? 1 : 0.5,
              }}
            >
              <Text
                variant="lg"
                sx={{ fontWeight: "700",  }}

              >
                {template.name}
              </Text>
              <MaterialCommunityIcons
                name={template.icon}
                size={30}
              />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <SectionTitle title="Identity" />
        <TextInput
          placeholder={'Name your agent (e.g., "Calm Risk Manager")'}
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
