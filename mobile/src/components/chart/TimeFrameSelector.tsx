import { GlassButton, Text, View } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import {
  TIMEFRAME_OPTIONS,
  useTimeframeStore,
} from "@/stores/useTimeframeStore";
import { useColors } from "@/theme";

export default function TimeFrameSelector({
  visibleTimeFrames, // ["24h", "7d", "1M"]
  invisibleTimeFrames = ["15m", "Alltime"],
}: {
  visibleTimeFrames?: string[];
  invisibleTimeFrames?: string[];
}) {
  const { theme } = useTheme();
  const { colors: palette } = useColors();
  const { timeframe, setTimeframe } = useTimeframeStore();

  if (!timeframe) return null;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        overflow: "visible",
        marginVertical: 3,
        alignSelf: "flex-end",
      }}
    >
      {TIMEFRAME_OPTIONS.map((option) => {
        if (visibleTimeFrames && !visibleTimeFrames.includes(option.id)) {
          return null;
        }
        if (invisibleTimeFrames && invisibleTimeFrames.includes(option.id)) {
          return null;
        }
        const isSelected = timeframe === option.id;

        return (
          <GlassButton
            key={option.id}
            enabled={false}
            // glassEffectStyle={isSelected ? "clear" : "regular"}
            tintColor={isSelected ? palette.surface : palette.surface}
            onPress={() => setTimeframe(option.id)}
            styleVariant="minimal"
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: 1.1,
                // color: isSelected ? palette.accent : palette.foreground,
                opacity: isSelected ? 1 : 0.3,
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
