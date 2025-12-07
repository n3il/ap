import { GlassButton, View, Text } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { TIMEFRAME_OPTIONS, useTimeframeStore } from "@/stores/useTimeframeStore";
import { useColors } from "@/theme";

export default function TimeFrameSelector({
  visibleTimeFrames = ["24h", "7d", "1M"]
}) {
  const { theme } = useTheme();
  const { colors: palette } = useColors()
  const { timeframe, setTimeframe } = useTimeframeStore();

  if (!timeframe) return null;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 0,
        overflow: "visible",
        marginVertical: 2,
        alignSelf: "flex-end"
      }}
    >
      {TIMEFRAME_OPTIONS.map((option) => {
        if (!visibleTimeFrames.includes(option.id)) {
          return null;
        }
        const isSelected = timeframe === option.id;
        console.log({ timeframe, isSelected })
        return (
          <GlassButton
            key={option.id}
            enabled={true}
            // glassEffectStyle={isSelected ? "clear" : "regular"}
            tintColor={isSelected ? palette.primary : palette.surface}
            onPress={() => setTimeframe(option.id)}
            styleVariant="minimal"
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: 1.1,
                color: isSelected ? palette.surfaceForeground : palette.surfaceForeground,
              }}
            >
              {option.label}
            </Text>
          </GlassButton>
        );
      })}
    </View>
  );
}
