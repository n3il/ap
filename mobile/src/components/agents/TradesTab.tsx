import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "@/components/ui";
import {
  useHyperliquidRequests,
  useHyperliquidStore,
} from "@/hooks/useHyperliquid";
import { useColors } from "@/theme";

const DEFAULT_COINS = ["BTC", "ETH", "SOL", "ARB", "OP", "DOGE"];

type RecentTrade = {
  coin: string;
  side: "A" | "B";
  px: string;
  sz: string;
  time: number;
  hash: string;
  tid: number;
  users: string[];
};

const formatTradeTimestamp = (timestamp?: number) => {
  if (!timestamp && timestamp !== 0) return "—";
  const normalized =
    typeof timestamp === "number" && timestamp < 1e12
      ? timestamp * 1000
      : timestamp;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "—";
  return date
    .toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace("24:", "00:");
};

export default function TradesTab() {
  const { colors: palette, success, error, withOpacity } = useColors();
  const { sendRequest } = useHyperliquidRequests();
  const { connectionState } = useHyperliquidStore();

  const [selectedCoin, setSelectedCoin] = useState(DEFAULT_COINS[0]);
  const [trades, setTrades] = useState<RecentTrade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const isMounted = useRef(true);

  useEffect(
    () => () => {
      isMounted.current = false;
    },
    [],
  );

  const loadTrades = useCallback(
    async (coin: string, { refresh = false } = {}) => {
      if (!coin || connectionState !== "connected") return;
      setErrorMessage(null);
      refresh ? setIsRefreshing(true) : setIsLoading(true);

      try {
        const response = await sendRequest({
          type: "info",
          payload: {
            type: "recentTrades",
          },
        });

        if (!isMounted.current) return;

        const payload = response?.payload?.data;
        if (Array.isArray(payload)) {
          setTrades(payload as RecentTrade[]);
          const newest = payload.reduce(
            (acc: number, trade: RecentTrade) =>
              Math.max(acc, Number(trade?.time) || 0),
            0,
          );
          setLastUpdated(newest || Date.now());
        } else {
          setTrades([]);
          setLastUpdated(Date.now());
        }
      } catch (err) {
        console.error("Failed to load recent trades", err);
        if (!isMounted.current) return;
        setErrorMessage("Unable to load trades right now.");
        setTrades([]);
      } finally {
        if (!isMounted.current) return;
        refresh ? setIsRefreshing(false) : setIsLoading(false);
      }
    },
    [connectionState, sendRequest],
  );

  useEffect(() => {
    if (connectionState !== "connected") return;
    loadTrades(selectedCoin);
  }, [connectionState, loadTrades, selectedCoin]);

  const handleRefresh = useCallback(() => {
    loadTrades(selectedCoin, { refresh: true });
  }, [loadTrades, selectedCoin]);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) return null;
    return formatTradeTimestamp(lastUpdated);
  }, [lastUpdated]);

  const renderTrade = useCallback(
    ({ item }: { item: RecentTrade }) => {
      const isBuy = item.side === "B";
      return (
        <View
          sx={{
            flexDirection: "row",
            alignItems: "center",
            paddingY: 3,
            paddingX: 3,
            borderBottomWidth: 1,
            borderBottomColor: withOpacity(palette.border, 0.3),
            gap: 3,
          }}
        >
          <View
            sx={{
              paddingX: 3,
              paddingY: 1.5,
              borderRadius: "full",
              backgroundColor: withOpacity(palette.surface, 0.8),
              minWidth: 64,
            }}
          >
            <Text
              sx={{
                color: "textPrimary",
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              {item.coin}
            </Text>
            <Text
              sx={{
                color: isBuy ? "success" : "error",
                fontSize: 11,
                fontWeight: "500",
              }}
            >
              {isBuy ? "Buy" : "Sell"}
            </Text>
          </View>

          <View sx={{ flex: 1 }}>
            <Text
              sx={{
                color: isBuy ? success : error,
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              {item.px}
            </Text>
            <Text sx={{ color: "mutedForeground", fontSize: 11 }}>
              {item.sz}
            </Text>
          </View>

          <Text
            sx={{
              color: "textSecondary",
              fontSize: 11,
              minWidth: 80,
              textAlign: "right",
            }}
          >
            {formatTradeTimestamp(item.time)}
          </Text>
        </View>
      );
    },
    [error, palette.border, palette.surface, success, withOpacity],
  );

  return (
    <View sx={{ flex: 1, padding: 6, gap: 4 }}>
      <View
        sx={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text sx={{ fontSize: 18, fontWeight: "700", color: "textPrimary" }}>
            Trades
          </Text>
          <Text sx={{ color: "textSecondary", fontSize: 12 }}>
            {connectionState === "connected"
              ? `Live fills for ${selectedCoin} perp`
              : "Connecting to Hyperliquid..."}
          </Text>
        </View>
        {lastUpdatedLabel && connectionState === "connected" && (
          <Text sx={{ color: "textTertiary", fontSize: 11, textAlign: "right" }}>
            Updated {lastUpdatedLabel}
          </Text>
        )}
      </View>

      <View sx={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
        {DEFAULT_COINS.map((coin) => {
          const isActive = coin === selectedCoin;
          const highlight = palette.brand300 ?? palette.accent ?? "#7CFFAA";
          return (
            <TouchableOpacity
              key={coin}
              onPress={() => setSelectedCoin(coin)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: isActive ? highlight : palette.border,
                backgroundColor: isActive
                  ? withOpacity(highlight, 0.15)
                  : "transparent",
              }}
            >
              <Text
                sx={{
                  color: isActive ? "brand300" : "textSecondary",
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {coin}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View
        sx={{
          flex: 1,
          borderRadius: "xl",
          backgroundColor: withOpacity(palette.card.DEFAULT, 0.9),
          borderWidth: 1,
          borderColor: withOpacity(palette.border, 0.4),
          overflow: "hidden",
        }}
      >
        {errorMessage && (
          <View
            sx={{
              paddingX: 4,
              paddingY: 3,
              backgroundColor: withOpacity(palette.error.DEFAULT, 0.15),
              borderBottomWidth: 1,
              borderBottomColor: withOpacity(palette.border, 0.3),
            }}
          >
            <Text sx={{ color: "error", fontSize: 12 }}>{errorMessage}</Text>
          </View>
        )}

        {isLoading && !isRefreshing ? (
          <View
            sx={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: 6,
            }}
          >
            <ActivityIndicator color={palette.foreground} size="large" />
          </View>
        ) : (
          <FlatList
            data={trades}
            keyExtractor={(item) => item.hash ?? `${item.coin}-${item.tid}`}
            renderItem={renderTrade}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={palette.foreground}
              />
            }
            contentContainerStyle={{
              flexGrow: 1,
            }}
            ListEmptyComponent={
              <View
                sx={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 8,
                }}
              >
                <Text
                  sx={{
                    color: "mutedForeground",
                    fontSize: 16,
                    textAlign: "center",
                  }}
                >
                  No trades yet
                </Text>
                <Text
                  sx={{
                    color: "textSecondary",
                    fontSize: 12,
                    textAlign: "center",
                    marginTop: 1,
                  }}
                >
                  Pull to refresh once there is activity.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}
