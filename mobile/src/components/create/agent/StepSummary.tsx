import SectionTitle from "@/components/SectionTitle";
import { Badge, Card, Text, View } from "@/components/ui";
import { useColors, withOpacity } from "@/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

interface StepSummaryProps {
  name: string;
  modelLabel: string;
  promptPreview: string;
  creationReady: boolean;
}

export default function StepSummary({
  name,
  modelLabel,
  promptPreview,
  creationReady,
}: StepSummaryProps) {
  const { colors: palette } = useColors();

  return (
    <View style={{ gap: 24, paddingTop: 8 }}>
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ gap: 12 }}>
        <SectionTitle title="Launch Preview" />
        <Card
          variant="glass"
          glassEffectStyle="regular"
          style={{
            gap: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: creationReady ? withOpacity(palette.success, 0.2) : withOpacity(palette.foreground, 0.1)
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: withOpacity(palette.primary, 0.1),
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MaterialCommunityIcons name="robot" size={24} color={palette.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="lg" style={{ fontWeight: "800" }}>{name || "Unnamed agent"}</Text>
              <Text variant="sm" tone="muted">{modelLabel || "No model selected"}</Text>
            </View>
            <Badge variant={creationReady ? "success" : "default"}>
              {creationReady ? "READY" : "INCOMPLETE"}
            </Badge>
          </View>

          <View style={{ height: 1, backgroundColor: withOpacity(palette.foreground, 0.05) }} />

          <View style={{ gap: 8 }}>
            <Text variant="sm" style={{ fontWeight: "600", color: palette.foreground }}>Operating Instructions</Text>
            <Text variant="sm" tone="muted" style={{ lineHeight: 20 }}>
              {promptPreview || "No instructions provided yet."}
            </Text>
          </View>
        </Card>
      </Animated.View>

      {!creationReady && (
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Card
            variant="outlined"
            style={{
              padding: 12,
              backgroundColor: withOpacity(palette.warning, 0.05),
              borderColor: withOpacity(palette.warning, 0.2),
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10
            }}
          >
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={palette.warning} />
            <Text variant="xs" style={{ color: palette.warning, flex: 1 }}>
              Please complete all steps to enable the launch button.
            </Text>
          </Card>
        </Animated.View>
      )}
    </View>
  );
}
