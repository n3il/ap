import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, ListRenderItem } from "react-native";

import {
  ActivityIndicator,
  RefreshControl,
  Text,
  View,
} from "@/components/ui";
import {
  useHyperliquidInfo,
  useHyperliquidStore,
} from "@/hooks/useHyperliquid";
import { useColors } from "@/theme";
import { formatCurrency } from "@/utils/marketFormatting";
import { numberToColor } from "@/utils/currency";
import { AgentType } from "@/types/agent";
import { formatRelativeDate } from "@/utils/date";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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
  const infoClient = useHyperliquidInfo();
  const { connectionState } = useHyperliquidStore();

  const tradingAccountType = !agent?.simulate ? "real" : "paper";
  const tradingAccount = agent?.trading_accounts?.find((ta) => ta.type === tradingAccountType);
  const userAddress = tradingAccount?.hyperliquid_address;

  const [fills, setFills] = useState<UserFill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
        const data = await infoClient.userFills({
          user: userAddress,
          aggregateByTime: false,
        });

        if (!isMounted.current) return;

        if (Array.isArray(data)) {
          setFills(data as UserFill[]);
        } else {
          setFills([]);
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
    [connectionState, infoClient, userAddress],
  );

  useEffect(() => {
    if (connectionState !== "connected" || !userAddress) return;
    loadFills();
  }, [connectionState, loadFills, userAddress]);

  const handleRefresh = useCallback(() => {
    loadFills({ refresh: true });
  }, [loadFills]);

  const renderFill: ListRenderItem<UserFill> = useCallback(
    ({ item: fill }) => {
      console.log(Object.keys(fill))
      const isBuy = fill.side === "B";
      const pnl = Number(fill.closedPnl);
      const fee = Number(fill.fee);
      const hasPnl = Number.isFinite(pnl) && pnl !== 0;
      const pnlColor = numberToColor(pnl);

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
              paddingY: 1,
              borderRadius: "full",
              backgroundColor: withOpacity(palette.surface, 0.8),
              minWidth: 80,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text sx={{ color: "surfaceForeground", fontSize: 14, fontWeight: "700" }}>
              {fill.coin}
            </Text>
          </View>

          <View sx={{ flex: 1 }}>
            <Text sx={{ color: isBuy ? success : error, fontSize: 14, fontWeight: "600" }}>
              {formatCurrency(Number(fill.px))}
            </Text>
            <View sx={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Text sx={{ color: isBuy ? "success" : "error", fontSize: 11, fontWeight: "500" }}>
                {isBuy ? "Buy" : "Sell"}
              </Text>
              <Text sx={{ color: "mutedForeground", fontSize: 11 }}>Size: {fill.sz}</Text>
            </View>
          </View>

          <View sx={{ alignItems: "flex-end", minWidth: 100 }}>
            {hasPnl && (
              <Text sx={{ color: pnlColor, fontSize: 13, fontWeight: "600" }}>
                {formatCurrency(pnl)}
              </Text>
            )}
            {Number.isFinite(fee) && fee !== 0 && (
              <Text sx={{ color: "mutedForeground", fontSize: 10 }}>
                Fee: {formatCurrency(fee)}
              </Text>
            )}
            <Text sx={{ color: "textSecondary", fontSize: 10, marginTop: 1 }}>
              {formatRelativeDate(fill.time)}
            </Text>
          </View>
        </View>
      );
    },
    [error, palette.border, palette.surface, success, withOpacity],
  );

  const keyExtractor = useCallback(
    (item: UserFill) => item.hash ?? `${item.coin}-${item.tid}`,
    [],
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
              ? "Your recent fills"
              : "Connecting to Hyperliquid..."}
          </Text>
        </View>
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

      <FlatList
        data={fills}
        renderItem={renderFill}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 6 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={palette.foreground}
          />
        }
        ListEmptyComponent={
          isLoading ? (
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
            <View
              sx={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                padding: 8,
              }}
            >
              <MaterialCommunityIcons
                name={"binoculars"}
                size={24}
                color={palette.muted}
              />
            </View>
          )
        }
      />
    </View>
  );
}
