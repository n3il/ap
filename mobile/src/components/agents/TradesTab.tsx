import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  Text,
  View,
} from "@/components/ui";
import {
  useHyperliquidRequests,
  useHyperliquidStore,
} from "@/hooks/useHyperliquid";
import { useColors } from "@/theme";
import { formatCurrency } from "@/utils/marketFormatting";
import { numberToColor } from "@/utils/currency";
import { AgentType } from "@/types/agent";

type UserFill = {
  coin: string;
  side: string;
  px: string;
  sz: string;
  time: number;
  hash: string;
  tid: number;
  startPosition: string;
  dir: string;
  closedPnl: string;
  fee: string;
  oid: number;
  crossed: boolean;
  feeToken?: string;
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

export default function TradesTab({ agent }: { agent: AgentType }) {
  const { colors: palette, success, error, withOpacity } = useColors();
  const { sendRequest } = useHyperliquidRequests();
  const { connectionState } = useHyperliquidStore();

  const tradingAccountType = !agent?.simulate ? "real" : "paper";
  const tradingAccount = agent?.trading_accounts?.find((ta) => ta.type === tradingAccountType);
  const userAddress = tradingAccount?.hyperliquid_address;

  const [fills, setFills] = useState<UserFill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(true);

  useEffect(
    () => () => {
      isMounted.current = false;
    },
    [],
  );

  const loadFills = useCallback(
    async ({ refresh = false } = {}) => {
      if (!userAddress || connectionState !== "connected") return;
      setErrorMessage(null);
      refresh ? setIsRefreshing(true) : setIsLoading(true);

      try {
        const response = await sendRequest({
          type: "info",
          payload: {
            type: "userFills",
            user: userAddress,
            aggregateByTime: false,
          },
        });

        if (!isMounted.current) return;

        const payload = response?.payload?.data;
        if (Array.isArray(payload)) {
          setFills(payload as UserFill[]);
          const newest = payload.reduce(
            (acc: number, fill: UserFill) =>
              Math.max(acc, Number(fill?.time) || 0),
            0,
          );
          setLastUpdated(newest || Date.now());
        } else {
          setFills([]);
          setLastUpdated(Date.now());
        }
      } catch (err) {
        console.error("Failed to load user fills", err);
        if (!isMounted.current) return;
        setErrorMessage("Unable to load fills right now.");
        setFills([]);
      } finally {
        if (!isMounted.current) return;
        refresh ? setIsRefreshing(false) : setIsLoading(false);
      }
    },
    [connectionState, sendRequest, userAddress],
  );

  useEffect(() => {
    if (connectionState !== "connected" || !userAddress) return;
    loadFills();
  }, [connectionState, loadFills, userAddress]);

  const handleRefresh = useCallback(() => {
    loadFills({ refresh: true });
  }, [loadFills]);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) return null;
    return formatTradeTimestamp(lastUpdated);
  }, [lastUpdated]);

  const renderFill = useCallback(
    (fill: UserFill) => {
      const isBuy = fill.side === "B";
      const pnl = Number(fill.closedPnl);
      const fee = Number(fill.fee);
      const hasPnl = Number.isFinite(pnl) && pnl !== 0;
      const pnlColor = numberToColor(pnl);

      return (
        <View
          key={fill.hash ?? `${fill.coin}-${fill.tid}`}
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
              {fill.coin}
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
              {formatCurrency(Number(fill.px))}
            </Text>
            <Text sx={{ color: "mutedForeground", fontSize: 11 }}>
              Size: {fill.sz}
            </Text>
          </View>

          <View sx={{ alignItems: "flex-end", minWidth: 100 }}>
            {hasPnl && (
              <Text
                sx={{
                  color: pnlColor,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {formatCurrency(pnl)}
              </Text>
            )}
            {Number.isFinite(fee) && fee !== 0 && (
              <Text sx={{ color: "mutedForeground", fontSize: 10 }}>
                Fee: {formatCurrency(fee)}
              </Text>
            )}
            <Text
              sx={{
                color: "textSecondary",
                fontSize: 10,
                marginTop: 1,
              }}
            >
              {formatTradeTimestamp(fill.time)}
            </Text>
          </View>
        </View>
      );
    },
    [error, palette.border, palette.surface, success, withOpacity],
  );

  if (!userAddress) {
    return (
      <View sx={{ flex: 1, padding: 6, alignItems: "center", justifyContent: "center" }}>
        <Text sx={{ color: "mutedForeground", fontSize: 14, textAlign: "center" }}>
          No trading account connected
        </Text>
        <Text sx={{ color: "textSecondary", fontSize: 12, textAlign: "center", marginTop: 2 }}>
          Connect a Hyperliquid account to view fills
        </Text>
      </View>
    );
  }

  return (
    <View sx={{ flex: 1 }}>
      <View
        sx={{
          paddingX: 6,
          paddingY: 4,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: withOpacity(palette.border, 0.3),
        }}
      >
        <View>
          <Text sx={{ fontSize: 18, fontWeight: "700", color: "textPrimary" }}>
            Fills
          </Text>
          <Text sx={{ color: "textSecondary", fontSize: 12 }}>
            {connectionState === "connected"
              ? `Your recent fills`
              : "Connecting to Hyperliquid..."}
          </Text>
        </View>
        {lastUpdatedLabel && connectionState === "connected" && (
          <Text sx={{ color: "textTertiary", fontSize: 11, textAlign: "right" }}>
            {lastUpdatedLabel}
          </Text>
        )}
      </View>

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
        <Animated.ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={palette.foreground}
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
        >
          {fills.length > 0 ? (
            <View sx={{ paddingBottom: 6 }}>
              {fills.map((fill) => renderFill(fill))}
            </View>
          ) : (
            <View
              sx={{
                alignItems: "center",
                justifyContent: "center",
                padding: 8,
                marginTop: 12,
              }}
            >
              <Text
                sx={{
                  color: "mutedForeground",
                  fontSize: 16,
                  textAlign: "center",
                }}
              >
                No fills yet
              </Text>
              <Text
                sx={{
                  color: "textSecondary",
                  fontSize: 12,
                  textAlign: "center",
                  marginTop: 1,
                }}
              >
                Your trading fills will appear here
              </Text>
            </View>
          )}
        </Animated.ScrollView>
      )}
    </View>
  );
}
