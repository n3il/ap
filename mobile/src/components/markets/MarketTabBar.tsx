import { Text, TouchableOpacity, View } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { withOpacity } from "@/theme/utils";

type MarketTab = {
  key: string;
  label: string;
};

type MarketTabBarProps = {
  tabs?: MarketTab[];
  activeTab?: string;
  onChange?: (key: string) => void;
};

export default function MarketTabBar({
  tabs = [],
  activeTab,
  onChange,
}: MarketTabBarProps) {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        backgroundColor: withOpacity(colors.backgroundSecondary, 0.6),
        padding: 4,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 12,
              alignItems: "center",
              backgroundColor: isActive
                ? withOpacity(colors.primary.DEFAULT, 0.18)
                : "transparent",
            }}
            onPress={() => onChange?.(tab.key)}
            activeOpacity={0.85}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                letterSpacing: 0.4,
                color: isActive
                  ? colors.primary.DEFAULT
                  : colors.text.secondary,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
