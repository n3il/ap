import SectionTitle from "@/components/SectionTitle";
import { Badge, Card, Text, View } from "@/components/ui";

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
  return (
    <View style={{ gap: 12 }}>
      <SectionTitle title="Launch preview" />
      <Card
        variant="glass"
        glassEffectStyle="regular"
        style={{ gap: 10, paddingVertical: 12, paddingHorizontal: 10 }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontWeight: "700" }}>Ready check</Text>
          <Badge variant={creationReady ? "success" : "warning"} size="sm">
            {creationReady ? "Ready" : "Add missing pieces"}
          </Badge>
        </View>
        <Text>
          {name || "Unnamed agent"} • {modelLabel || "Pick a model"}
        </Text>
        <Text tone="muted" numberOfLines={4}>
          {promptPreview ||
            "Direction preview will appear once you add guardrails."}
        </Text>
      </Card>
    </View>
  );
}
