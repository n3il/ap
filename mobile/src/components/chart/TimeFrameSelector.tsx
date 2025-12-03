import { GlassView } from "expo-glass-effect";
import { StyleSheet } from "react-native";
import { ScrollView, Text, TouchableOpacity } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { useTimeframeStore } from "@/stores/useTimeframeStore";

const TIMEFRAME_OPTIONS = [
  // { id: "5m", label: "5m" },
  // { id: "15m", label: "15m" },
  { id: "1h", label: "1H" },
  { id: "24h", label: "24H" },
  { id: "7d", label: "7D" },
  { id: '1M', label: '1M' },
  { id: 'All', label: 'All' },
];

export default function TimeFrameSelector() {
  const { theme } = useTheme();
  const { timeframe, setTimeframe } = useTimeframeStore();
  return (
    <ScrollView
      contentContainerStyle={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 0,
      }}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {TIMEFRAME_OPTIONS.map((option) => {
        const isSelected = timeframe === option.id;
        return (
          <GlassView
            key={option.id}
            glassEffectStyle={isSelected ? "clear" : "regular"}
            style={[
              {
                borderRadius: 32,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginHorizontal: 4,
                marginVertical: 6,
              },
            ]}
            isInteractive
            tintColor={isSelected ? theme.colors.primary : theme.colors.surface}
          >
            <TouchableOpacity
              key={option.id}
              onPress={() => setTimeframe(option.id)}
              style={{
                paddingHorizontal: 2,
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isSelected
                      ? theme.colors.accent
                      : theme.colors.foreground,
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          </GlassView>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    position: "relative",
  },
  tabBarContent: {
    flex: 1,
    alignItems: "flex-start",
    gap: 8,
  },

  tabText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    height: 2,
  },
});
