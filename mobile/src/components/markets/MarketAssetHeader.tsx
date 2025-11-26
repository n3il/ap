import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { withOpacity } from "@/theme/utils";
import {
  formatAddress,
  formatCompactNumber,
  formatPercentChange,
  formatPriceDisplay,
} from "./utils";

export default function MarketAssetHeader({
  asset,
  price,
  onSelectAsset,
  priceChange,
  onOpenTrade,
  onToggleFavorite,
  favorites = [],
}) {
  const { theme } = useTheme();
  const { colors } = theme;
  const isFavorite = favorites.includes(asset?.id);
  const changeColor =
    priceChange >= 0 ? colors.success.DEFAULT : colors.error.DEFAULT;
  const changeValue =
    Number.isFinite(price) && Number.isFinite(priceChange)
      ? price * (priceChange / 100)
      : null;
  const hasChangeValue = Number.isFinite(changeValue);
  const hasPrice = Number.isFinite(price);
  const displayPrice = hasPrice ? formatPriceDisplay(price) : "—";

  const stats = [
    {
      label: "Price",
      value: hasPrice ? `$${displayPrice}` : "—",
    },
    {
      label: "24h Volume",
      value: `${formatCompactNumber(asset?.volume24h)} ${asset?.quote}`,
    },
    {
      label: "Market Cap",
      value: asset?.marketCap
        ? `${formatCompactNumber(asset.marketCap)} ${asset?.quote}`
        : "—",
    },
    {
      label: "More Info",
      value: formatAddress(asset?.contractAddress),
    },
  ];

  return (
    <View style={{ gap: 16 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={onSelectAsset}
          style={{
            flexDirection: "row",
            gap: 12,
            alignItems: "center",
            flex: 1,
          }}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text
                style={{
                  color: colors.text.primary,
                  fontSize: 20,
                  fontWeight: "700",
                }}
              >
                {asset?.pair}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={22}
                color={colors.text.secondary}
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginTop: 4,
              }}
            >
              {asset?.score ? (
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 10,
                    backgroundColor: withOpacity(colors.success.DEFAULT, 0.25),
                  }}
                >
                  <Text
                    style={{
                      color: colors.success.DEFAULT,
                      fontWeight: "700",
                      fontSize: 11,
                    }}
                  >
                    {(asset.score * 100).toFixed(0)}%
                  </Text>
                </View>
              ) : null}
              <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
                {asset?.contractAddress}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              <Tag
                text={(asset?.type ?? "Spot").toUpperCase()}
                colors={colors}
              />
              <Tag text={asset?.leverage ?? "—"} colors={colors} tinted />
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <IconButton
            icon={isFavorite ? "star" : "star-outline"}
            color={isFavorite ? colors.primary.DEFAULT : colors.text.secondary}
            onPress={() => onToggleFavorite?.(asset)}
          />
        </View>
      </View>

      <View>
        <Text
          style={{
            color: colors.text.primary,
            fontSize: 36,
            lineHeight: 36,
            fontWeight: "700",
          }}
        >
          {displayPrice}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ color: changeColor, fontWeight: "600" }}>
            {hasChangeValue ? formatPriceDisplay(Math.abs(changeValue)) : "—"}
          </Text>
          <Text style={{ color: changeColor, fontWeight: "600" }}>
            {formatPercentChange(priceChange)}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {stats.map((stat) => (
          <View
            key={stat.label}
            style={{
              flexBasis: "48%",
              borderRadius: 16,
              padding: 14,
              backgroundColor: withOpacity(colors.backgroundSecondary, 0.6),
            }}
          >
            <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
              {stat.label}
            </Text>
            <Text
              style={{
                color: colors.text.primary,
                fontWeight: "700",
                marginTop: 4,
              }}
            >
              {stat.value}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <TouchableOpacity
          onPress={() => onOpenTrade?.("buy")}
          style={{
            flex: 1,
            borderRadius: 18,
            backgroundColor: colors.long,
            paddingVertical: 14,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontWeight: "700",
              color: colors.surface,
            }}
          >
            Buy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onOpenTrade?.("sell")}
          style={{
            flex: 1,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.short,
            paddingVertical: 14,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontWeight: "700",
              color: colors.primary.DEFAULT,
            }}
          >
            Sell
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const Tag = ({ text, colors, tinted = false }) => (
  <View
    style={{
      paddingHorizontal: 10,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: tinted
        ? withOpacity(colors.primary.DEFAULT, 0.2)
        : withOpacity(colors.backgroundSecondary, 0.6),
    }}
  >
    <Text
      style={{
        color: tinted ? colors.primary.DEFAULT : colors.text.secondary,
        fontSize: 11,
        fontWeight: "600",
      }}
    >
      {text}
    </Text>
  </View>
);

const IconButton = ({ icon, color, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: withOpacity(color, 0.4),
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <MaterialCommunityIcons name={icon} size={18} color={color} />
  </TouchableOpacity>
);
