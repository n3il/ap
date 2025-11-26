import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { Text, View } from "@/components/ui";
import { supabase } from "@/config/supabase";
import { useTheme } from "@/contexts/ThemeContext";

const COLUMN_WIDTHS = {
  symbol: 140,
  status: 80,
  filled: 90,
  price: 110,
  time: 90,
};

const ROW_HEIGHT = 68;

export default function TradeHistoryTable({ userId, agentId }) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const scrollViewRef = useRef(null);
  const headerScrollRef = useRef(null);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        headerRow: {
          flexDirection: "row",
          paddingVertical: 12,
          alignItems: "center",
        },
        dataRow: {
          flexDirection: "row",
          alignItems: "center",
        },
        stickyColumn: {
          paddingHorizontal: 12,
          borderRightWidth: 1,
          borderRightColor:
            theme.colors.border ??
            theme.colors.muted?.DEFAULT ??
            theme.colors.surface,
        },
        scrollableHeader: {
          flex: 1,
        },
      }),
    [theme.colors],
  );

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("trades")
        .select("*")
        .order("entry_timestamp", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }
      if (agentId) {
        query = query.eq("agent_id", agentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTrades(data || []);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "--";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price) => {
    if (!price) return "--";
    return `@${parseFloat(price).toFixed(2)}`;
  };

  const getStatusColor = (status) => {
    if (status?.toLowerCase().includes("buy") || status === "LONG") {
      return theme.colors.success.DEFAULT;
    }
    if (status?.toLowerCase().includes("sell") || status === "SHORT") {
      return theme.colors.error.DEFAULT;
    }
    return theme.colors.text.tertiary;
  };

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollTo({ x: offsetX, animated: false });
    }
  };

  if (loading) {
    return (
      <View
        sx={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 8,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <View sx={{ flex: 1 }}>
      <View
        style={[
          styles.headerRow,
          {
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <View style={[styles.stickyColumn, { width: COLUMN_WIDTHS.symbol }]}>
          <Text variant="xs" tone="muted">
            Symbol
          </Text>
        </View>

        <ScrollView
          ref={headerScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={styles.scrollableHeader}
        >
          <View style={styles.headerRow}>
            <View style={{ width: COLUMN_WIDTHS.status, paddingHorizontal: 8 }}>
              <Text variant="xs" tone="muted">
                Status
              </Text>
            </View>
            <View style={{ width: COLUMN_WIDTHS.filled, paddingHorizontal: 8 }}>
              <Text variant="xs" tone="muted">
                Filled/Total
              </Text>
            </View>
            <View
              style={{
                width: COLUMN_WIDTHS.price,
                paddingHorizontal: 8,
                alignItems: "flex-end",
              }}
            >
              <Text variant="xs" tone="muted">
                Price/Avg Price
              </Text>
            </View>
            <View
              style={{
                width: COLUMN_WIDTHS.time,
                paddingHorizontal: 8,
                alignItems: "flex-end",
              }}
            >
              <Text variant="xs" tone="muted">
                Time
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {trades.map((trade, index) => (
          <View
            key={trade.id || index}
            style={[
              styles.dataRow,
              {
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
                minHeight: ROW_HEIGHT,
              },
            ]}
          >
            <View
              style={[
                styles.stickyColumn,
                {
                  width: COLUMN_WIDTHS.symbol,
                  backgroundColor: theme.colors.background,
                  justifyContent: "center",
                },
              ]}
            >
              <Text variant="body" sx={{ fontWeight: "600" }}>
                {trade.asset || trade.symbol || "--"}
              </Text>
              <Text variant="xs" tone="subtle" sx={{ marginTop: 1 }}>
                {trade.option_type || trade.details || ""}
              </Text>
            </View>

            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              <View style={styles.dataRow}>
                <View
                  style={{
                    width: COLUMN_WIDTHS.status,
                    paddingHorizontal: 8,
                    justifyContent: "center",
                  }}
                >
                  <Text
                    variant="sm"
                    sx={{
                      color: getStatusColor(trade.side || trade.status),
                      fontWeight: "600",
                    }}
                  >
                    {trade.side === "LONG"
                      ? "Buy"
                      : trade.side === "SHORT"
                        ? "Sell"
                        : trade.status || "--"}
                  </Text>
                </View>

                <View
                  style={{
                    width: COLUMN_WIDTHS.filled,
                    paddingHorizontal: 8,
                    justifyContent: "center",
                  }}
                >
                  <Text variant="sm">
                    {trade.filled || 0}/{trade.size || 0}
                  </Text>
                  {trade.avg_price && (
                    <Text variant="xs" tone="muted">
                      {parseFloat(trade.avg_price).toFixed(2)}
                    </Text>
                  )}
                </View>

                <View
                  style={{
                    width: COLUMN_WIDTHS.price,
                    paddingHorizontal: 8,
                    alignItems: "flex-end",
                    justifyContent: "center",
                  }}
                >
                  <Text variant="sm" sx={{ fontWeight: "600" }}>
                    {formatPrice(trade.entry_price || trade.avg_price)}
                  </Text>
                  {trade.avg_price &&
                    trade.entry_price &&
                    trade.avg_price !== trade.entry_price && (
                      <Text variant="xs" tone="muted">
                        {parseFloat(trade.avg_price).toFixed(2)}
                      </Text>
                    )}
                </View>

                <View
                  style={{
                    width: COLUMN_WIDTHS.time,
                    paddingHorizontal: 8,
                    alignItems: "flex-end",
                    justifyContent: "center",
                  }}
                >
                  <Text variant="xs" tone="subtle">
                    {formatDate(trade.entry_timestamp || trade.timestamp)}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {trades.length === 0 && !loading && (
        <View
          sx={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 12,
          }}
        >
          <Text tone="muted">No trades found</Text>
        </View>
      )}
    </View>
  );
}
