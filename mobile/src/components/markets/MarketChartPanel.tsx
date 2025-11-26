import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import TradingViewChart from "@/components/trading/TradingViewChart";
import { Text, View } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { withOpacity } from "@/theme/utils";
import { formatCompactNumber, formatPriceDisplay } from "./utils";

const TOOLBAR_ICONS = [
  "crosshairs-gps",
  "chart-bell-curve",
  "vector-line",
  "format-line-style",
  "cursor-move",
];

export default function MarketChartPanel({ asset, price, volume, timeframe }) {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <View
      style={{
        backgroundColor: withOpacity(colors.card.DEFAULT, 0.92),
        borderRadius: 20,
        borderWidth: 1,
        borderColor: withOpacity(colors.border, 0.2),
        padding: 16,
        gap: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.text.secondary, fontWeight: "600" }}>
          Chart
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <IconPill name="tune-variant" colors={colors} />
          <IconPill name="dots-grid" colors={colors} />
          <IconPill name="fullscreen" colors={colors} />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View
          style={{
            width: 36,
            borderRadius: 16,
            backgroundColor: withOpacity(colors.backgroundSecondary, 0.8),
            alignItems: "center",
            paddingVertical: 12,
            gap: 12,
          }}
        >
          {TOOLBAR_ICONS.map((icon) => (
            <MaterialCommunityIcons
              key={icon}
              name={icon}
              size={18}
              color={colors.text.secondary}
            />
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <TradingViewChart symbol={asset?.symbol ?? "BTC"} height={320} />
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <View>
          <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
            Volume
          </Text>
          <Text
            style={{
              color: colors.text.primary,
              fontWeight: "700",
            }}
          >
            {formatCompactNumber(volume)}
          </Text>
        </View>
        <View>
          <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
            Date Range
          </Text>
          <Text style={{ color: colors.text.primary, fontWeight: "700" }}>
            {timeframe.toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
            Time
          </Text>
          <Text style={{ color: colors.text.primary, fontWeight: "700" }}>
            01:03:39 (UTC-5)
          </Text>
        </View>
        <View>
          <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
            % log auto
          </Text>
          <Text style={{ color: colors.text.primary, fontWeight: "700" }}>
            auto
          </Text>
        </View>
        <View>
          <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
            Last Price
          </Text>
          <Text style={{ color: colors.text.primary, fontWeight: "700" }}>
            {formatPriceDisplay(price)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const IconPill = ({ name, colors }) => (
  <View
    style={{
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: withOpacity(colors.backgroundSecondary, 0.5),
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <MaterialCommunityIcons
      name={name}
      size={16}
      color={colors.text.secondary}
    />
  </View>
);
