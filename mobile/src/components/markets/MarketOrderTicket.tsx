import { useEffect, useMemo, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { withOpacity } from "@/theme/utils";
import { ORDER_TICKET_TABS } from "./constants";
import { formatPriceDisplay, formatUsdValue } from "./utils";

const BUY_PRESETS = ["0.001", "0.1", "0.4", "0.8"];
const SELL_PRESETS = ["10%", "25%", "50%", "100%"];

type OrderPayload = {
  symbol?: string;
  side: "LONG" | "SHORT";
  amount: number;
  type: string;
  price: number;
};

type MarketOrderTicketProps = {
  asset: { symbol?: string; quote?: string };
  price?: number;
  availableBalance?: number;
  onSubmit?: (payload: OrderPayload) => void;
  initialSide?: "buy" | "sell";
  isSubmitting?: boolean;
};

export default function MarketOrderTicket({
  asset,
  price,
  availableBalance = 0,
  onSubmit,
  initialSide = "buy",
  isSubmitting = false,
}: MarketOrderTicketProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [activeTab, setActiveTab] = useState("instant");
  const [side, setSide] = useState(initialSide);
  const [amount, setAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");

  useEffect(() => {
    setSide(initialSide);
  }, [initialSide]);

  const actionLabel = side === "buy" ? "Buy" : "Sell";
  const pillColor =
    side === "buy" ? colors.success.DEFAULT : colors.error.DEFAULT;
  const placeholder = side === "buy" ? `0.00 ${asset?.symbol}` : "0%";
  const showLimitInput = activeTab === "limit";

  const resolvedPrice = showLimitInput
    ? limitPrice || formatPriceDisplay(price)
    : formatPriceDisplay(price);

  const summary = useMemo(() => {
    const numericAmount = parseFloat(amount);
    if (!Number.isFinite(numericAmount) || !price) return "—";
    const value = numericAmount * price;
    return formatUsdValue(value);
  }, [amount, price]);

  const handleSubmit = () => {
    const numericAmount = parseFloat(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return;
    }

    const payload = {
      symbol: asset?.symbol,
      side: side === "buy" ? "LONG" : "SHORT",
      amount: numericAmount,
      type: activeTab.toUpperCase(),
      price: showLimitInput ? parseFloat(limitPrice) || price : price,
    };

    onSubmit?.(payload);
  };

  return (
    <View
      style={{
        borderRadius: 20,
        padding: 16,
        backgroundColor: withOpacity(colors.backgroundSecondary, 0.95),
        borderWidth: 1,
        borderColor: withOpacity(colors.border, 0.2),
        gap: 14,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          backgroundColor: withOpacity(colors.background, 0.6),
          borderRadius: 14,
        }}
      >
        {ORDER_TICKET_TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 14,
                backgroundColor: isActive
                  ? withOpacity(colors.primary.DEFAULT, 0.25)
                  : "transparent",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: isActive
                    ? colors.primary.DEFAULT
                    : colors.text.secondary,
                  fontWeight: "700",
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View
        style={{
          flexDirection: "row",
          borderRadius: 14,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: withOpacity(colors.border, 0.4),
        }}
      >
        {["buy", "sell"].map((option) => {
          const isActive = option === side;
          const optionColor =
            option === "buy" ? colors.success.DEFAULT : colors.error.DEFAULT;
          return (
            <TouchableOpacity
              key={option}
              onPress={() => setSide(option)}
              style={{
                flex: 1,
                paddingVertical: 10,
                backgroundColor: isActive
                  ? withOpacity(optionColor, 0.2)
                  : "transparent",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: isActive ? optionColor : colors.text.secondary,
                  fontWeight: "700",
                }}
              >
                {option === "buy" ? "Buy" : "Sell"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View>
        <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
          Price
        </Text>
        <View
          style={{
            marginTop: 6,
            borderRadius: 14,
            backgroundColor: withOpacity(colors.background, 0.45),
            paddingHorizontal: 12,
            paddingVertical: 10,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {showLimitInput ? (
            <TextInput
              style={{ flex: 1, color: colors.text.primary, fontWeight: "700" }}
              value={limitPrice}
              onChangeText={setLimitPrice}
              keyboardType="decimal-pad"
              placeholder={resolvedPrice}
              placeholderTextColor={colors.text.tertiary}
            />
          ) : (
            <Text
              style={{
                color: colors.text.primary,
                fontWeight: "700",
                fontSize: 18,
              }}
            >
              {resolvedPrice}
            </Text>
          )}
          <View
            style={{
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 4,
              backgroundColor: withOpacity(colors.backgroundSecondary, 0.6),
            }}
          >
            <Text style={{ color: colors.text.secondary, fontWeight: "600" }}>
              {asset?.quote ?? "USDC"}
            </Text>
          </View>
        </View>
      </View>

      <View>
        <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
          Amount
        </Text>
        <TextInput
          style={{
            marginTop: 6,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: withOpacity(colors.border, 0.4),
            padding: 12,
            fontSize: 18,
            fontWeight: "600",
            color: colors.text.primary,
          }}
          value={amount}
          onChangeText={setAmount}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          keyboardType="decimal-pad"
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          {(side === "buy" ? BUY_PRESETS : SELL_PRESETS).map((preset) => (
            <TouchableOpacity
              key={preset}
              onPress={() =>
                setAmount(side === "buy" ? preset : preset.replace("%", ""))
              }
              style={{
                flex: 1,
                marginHorizontal: 4,
                borderRadius: 10,
                paddingVertical: 6,
                backgroundColor: withOpacity(pillColor, 0.1),
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: pillColor,
                  fontWeight: "600",
                }}
              >
                {preset}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: colors.text.secondary }}>Balance</Text>
        <Text style={{ color: colors.text.primary, fontWeight: "600" }}>
          {availableBalance?.toFixed
            ? availableBalance.toFixed(4)
            : availableBalance}
        </Text>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: colors.text.secondary }}>Order Value</Text>
        <Text style={{ color: colors.text.primary, fontWeight: "700" }}>
          {summary}
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={{
          borderRadius: 16,
          paddingVertical: 14,
          backgroundColor: pillColor,
          opacity: isSubmitting ? 0.6 : 1,
        }}
      >
        <Text
          style={{
            textAlign: "center",
            color: colors.surface,
            fontWeight: "700",
          }}
        >
          {isSubmitting ? "Submitting..." : actionLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
