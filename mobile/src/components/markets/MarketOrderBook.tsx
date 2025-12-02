import { useMemo } from "react";
import { Text, View } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { withOpacity } from "@/theme/utils";
import { formatPriceDisplay } from "./utils";

type MarketOrderBookProps = {
  symbol?: string;
  price?: number;
};

const generateDepth = (price, depth = 12) => {
  const safePrice = Number.isFinite(price) && price > 0 ? price : 1;
  let bidPrice = safePrice * 0.9995;
  let askPrice = safePrice * 1.0005;
  const levels = [];

  for (let i = 0; i < depth; i++) {
    const bidAmount = Math.random() * 300 + 25;
    const askAmount = Math.random() * 300 + 25;
    levels.push({
      bid: {
        price: bidPrice,
        amount: bidAmount,
        total: bidAmount * (bidPrice || 1),
      },
      ask: {
        price: askPrice,
        amount: askAmount,
        total: askAmount * (askPrice || 1),
      },
    });
    bidPrice -= safePrice * 0.0003;
    askPrice += safePrice * 0.0003;
  }

  return levels;
};

export default function MarketOrderBook({
  symbol = "XPL",
  price = 0,
}: MarketOrderBookProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const levels = useMemo(() => generateDepth(price), [price]);

  return (
    <View
      style={{
        backgroundColor: withOpacity(colors.card.DEFAULT, 0.92),
        borderRadius: 20,
        borderWidth: 1,
        borderColor: withOpacity(colors.border, 0.2),
        padding: 16,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View>
          <Text style={{ color: colors.text.primary, fontWeight: "700" }}>
            Order Book
          </Text>
          <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>
            Real-time depth overview
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
            Last
          </Text>
          <Text style={{ color: colors.text.primary, fontWeight: "700" }}>
            {formatPriceDisplay(price)}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          borderRadius: 12,
          paddingVertical: 8,
          paddingHorizontal: 12,
          backgroundColor: withOpacity(colors.backgroundSecondary, 0.5),
        }}
      >
        <Text style={{ color: colors.text.secondary, flex: 1, fontSize: 11 }}>
          Total ({symbol})
        </Text>
        <Text
          style={{
            color: colors.text.secondary,
            flex: 1,
            fontSize: 11,
            textAlign: "right",
          }}
        >
          Price
        </Text>
        <Text
          style={{
            color: colors.text.secondary,
            flex: 1,
            fontSize: 11,
            textAlign: "left",
          }}
        >
          Price
        </Text>
        <Text
          style={{
            color: colors.text.secondary,
            flex: 1,
            fontSize: 11,
            textAlign: "right",
          }}
        >
          Total ({symbol})
        </Text>
      </View>

      <View style={{ gap: 6 }}>
        {levels.map((level) => {
          const levelKey = `${level.bid.price}-${level.ask.price}-${level.bid.amount}-${level.ask.amount}`;
          return (
            <View
              key={levelKey}
              style={{ flexDirection: "row", gap: 8, overflow: "hidden" }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  backgroundColor: withOpacity(colors.success.DEFAULT, 0.08),
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: `${Math.min(100, level.bid.amount / 4)}%`,
                    backgroundColor: withOpacity(colors.success.DEFAULT, 0.15),
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{ color: colors.text.primary, fontWeight: "600" }}
                  >
                    {level.bid.total.toFixed(2)}
                  </Text>
                  <Text style={{ color: colors.success.DEFAULT }}>
                    {formatPriceDisplay(level.bid.price)}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  flex: 1,
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  backgroundColor: withOpacity(colors.error.DEFAULT, 0.08),
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${Math.min(100, level.ask.amount / 4)}%`,
                    backgroundColor: withOpacity(colors.error.DEFAULT, 0.15),
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: colors.error.DEFAULT }}>
                    {formatPriceDisplay(level.ask.price)}
                  </Text>
                  <Text
                    style={{ color: colors.text.primary, fontWeight: "600" }}
                  >
                    {level.ask.total.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
