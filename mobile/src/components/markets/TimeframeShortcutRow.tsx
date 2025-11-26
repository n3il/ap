import { Text, TouchableOpacity, View } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { withOpacity } from "@/theme/utils";

export default function TimeframeShortcutRow({
  options = [],
  active,
  onChange,
}) {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      {options.map((option) => {
        const isActive = option.key === active;
        return (
          <TouchableOpacity
            key={option.key}
            onPress={() => onChange?.(option.key)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
              backgroundColor: isActive
                ? withOpacity(colors.primary.DEFAULT, 0.18)
                : withOpacity(colors.backgroundSecondary, 0.4),
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: isActive
                  ? colors.primary.DEFAULT
                  : colors.text.secondary,
                fontWeight: "600",
              }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
