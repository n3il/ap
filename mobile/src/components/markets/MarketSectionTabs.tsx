import { ScrollView, Text, TouchableOpacity, View } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";

export default function MarketSectionTabs({ sections = [], active, onChange }) {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: 8 }}
    >
      <View style={{ flexDirection: "row", gap: 10 }}>
        {sections.map((section) => {
          const isActive = section.key === active;
          return (
            <TouchableOpacity
              key={section.key}
              onPress={() => onChange?.(section.key)}
              activeOpacity={0.85}
              style={{
                paddingBottom: 6,
                borderBottomWidth: isActive ? 2 : 0,
                borderBottomColor: isActive
                  ? colors.primary.DEFAULT
                  : "transparent",
              }}
            >
              <Text
                style={{
                  color: isActive ? colors.text.primary : colors.text.secondary,
                  fontSize: 14,
                  fontWeight: isActive ? "700" : "500",
                }}
              >
                {section.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
