import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { withOpacity } from "@/theme/utils";
import { ASSET_CATEGORIES } from "./constants";
import {
  formatCompactNumber,
  formatPercentChange,
  formatPriceDisplay,
} from "./utils";

const FILTER_MODES = [
  { key: "strict", label: "Strict" },
  { key: "all", label: "All" },
];

export default function AssetSelectorModal({
  visible,
  onClose,
  assets = [],
  favorites = [],
  onSelect,
  onToggleFavorite,
  priceMap = {},
}) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [activeCategory, setActiveCategory] = useState("all");
  const [mode, setMode] = useState("strict");
  const [query, setQuery] = useState("");

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return assets
      .filter((asset) => {
        if (mode === "strict" && !asset.strict) return false;
        if (activeCategory === "favorites" && !favoriteSet.has(asset.id))
          return false;
        if (
          activeCategory !== "all" &&
          activeCategory !== "favorites" &&
          !asset.categories?.includes(activeCategory)
        ) {
          return false;
        }

        if (!normalizedQuery) return true;
        return (
          asset.symbol.toLowerCase().includes(normalizedQuery) ||
          asset.pair.toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0));
  }, [assets, mode, activeCategory, query, favoriteSet]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: withOpacity(colors.background, 0.75),
          padding: 20,
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 28,
            padding: 20,
            maxHeight: "85%",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: colors.text.primary,
                fontSize: 20,
                fontWeight: "700",
              }}
            >
              Select Asset
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          <View
            style={{
              marginTop: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: withOpacity(colors.border, 0.35),
              paddingHorizontal: 12,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: withOpacity(colors.backgroundSecondary, 0.6),
            }}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={colors.text.secondary}
            />
            <TextInput
              style={{
                flex: 1,
                color: colors.text.primary,
                padding: 10,
              }}
              placeholder="Search"
              placeholderTextColor={colors.text.tertiary}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 16,
            }}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {ASSET_CATEGORIES.map((category) => {
                  const isActive = activeCategory === category.key;
                  return (
                    <TouchableOpacity
                      key={category.key}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 14,
                        backgroundColor: isActive
                          ? withOpacity(colors.primary.DEFAULT, 0.2)
                          : withOpacity(colors.backgroundSecondary, 0.45),
                      }}
                      onPress={() => setActiveCategory(category.key)}
                    >
                      <Text
                        style={{
                          color: isActive
                            ? colors.primary.DEFAULT
                            : colors.text.secondary,
                          fontWeight: "600",
                        }}
                      >
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View
              style={{
                flexDirection: "row",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: withOpacity(colors.border, 0.3),
                overflow: "hidden",
              }}
            >
              {FILTER_MODES.map((filter) => {
                const isActive = filter.key === mode;
                return (
                  <TouchableOpacity
                    key={filter.key}
                    onPress={() => setMode(filter.key)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: isActive
                        ? withOpacity(colors.primary.DEFAULT, 0.2)
                        : colors.surface,
                    }}
                  >
                    <Text
                      style={{
                        color: isActive
                          ? colors.primary.DEFAULT
                          : colors.text.secondary,
                        fontWeight: "600",
                      }}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ marginTop: 18 }}
          >
            {filteredAssets.map((asset) => {
              const isFavorite = favoriteSet.has(asset.id);
              const price = priceMap[asset.symbol] ?? asset.price;
              return (
                <TouchableOpacity
                  key={asset.id}
                  onPress={() => onSelect?.(asset)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: withOpacity(colors.border, 0.2),
                  }}
                  activeOpacity={0.85}
                >
                  <TouchableOpacity
                    onPress={() => onToggleFavorite?.(asset.id)}
                    hitSlop={8}
                    style={{ marginRight: 12 }}
                  >
                    <MaterialCommunityIcons
                      name={isFavorite ? "star" : "star-outline"}
                      size={18}
                      color={
                        isFavorite
                          ? colors.primary.DEFAULT
                          : colors.text.secondary
                      }
                    />
                  </TouchableOpacity>

                  <View style={{ flex: 2 }}>
                    <Text
                      style={{ color: colors.text.primary, fontWeight: "700" }}
                    >
                      {asset.pair}
                    </Text>
                    <View
                      style={{ flexDirection: "row", gap: 6, marginTop: 4 }}
                    >
                      <Badge text={asset.leverage} colors={colors} tinted />
                      <Badge text={asset.type.toUpperCase()} colors={colors} />
                    </View>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ color: colors.text.secondary, fontSize: 11 }}
                    >
                      Volume
                    </Text>
                    <Text
                      style={{ color: colors.text.primary, fontWeight: "600" }}
                    >
                      {formatCompactNumber(asset.volume24h)}
                    </Text>
                  </View>

                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <Text
                      style={{ color: colors.text.primary, fontWeight: "700" }}
                    >
                      {formatPriceDisplay(price)}
                    </Text>
                    <Text
                      style={{
                        color:
                          asset.change24h >= 0
                            ? colors.success.DEFAULT
                            : colors.error.DEFAULT,
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {formatPercentChange(asset.change24h)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {!filteredAssets.length && (
              <View style={{ paddingVertical: 36, alignItems: "center" }}>
                <Text style={{ color: colors.text.secondary }}>
                  No assets found.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const Badge = ({ text, colors, tinted = false }) => (
  <View
    style={{
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: tinted
        ? withOpacity(colors.primary.DEFAULT, 0.18)
        : withOpacity(colors.backgroundSecondary, 0.6),
    }}
  >
    <Text
      style={{
        fontSize: 11,
        fontWeight: "600",
        color: tinted ? colors.primary.DEFAULT : colors.text.secondary,
      }}
    >
      {text}
    </Text>
  </View>
);
