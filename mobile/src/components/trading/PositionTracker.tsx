import { MaterialIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "@/components/ui";

import { useTheme } from "@/contexts/ThemeContext";
import { withOpacity } from "@/theme/utils";

export default function PositionTracker({
  positions = [],
  onClosePosition,
  isLoading = false,
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const longBg = withOpacity(theme.colors.success.DEFAULT, 0.15);
  const shortBg = withOpacity(theme.colors.error.DEFAULT, 0.15);
  const longTextColor = theme.colors.success.DEFAULT;
  const shortTextColor = theme.colors.error.DEFAULT;

  const renderPosition = ({ item }) => {
    const isLong = item.side === "LONG";
    const pnl = parseFloat(item.unrealized_pnl || 0);
    const pnlPercent = parseFloat(item.pnl_percentage || 0);
    const isProfitable = pnl >= 0;

    return (
      <View style={styles.positionCard}>
        <View style={styles.positionHeader}>
          <View style={styles.positionLeft}>
            <View style={styles.symbolRow}>
              <Text style={styles.symbol}>{item.asset}</Text>
              <View
                style={[
                  styles.sideBadge,
                  { backgroundColor: isLong ? longBg : shortBg },
                ]}
              >
                <Text
                  style={[
                    styles.sideText,
                    { color: isLong ? longTextColor : shortTextColor },
                  ]}
                >
                  {item.side}
                </Text>
              </View>
              {item.leverage && (
                <View style={styles.leverageBadge}>
                  <Text style={styles.leverageText}>{item.leverage}x</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => onClosePosition?.(item)}
            style={styles.closeButton}
          >
            <MaterialIcons
              name="close"
              size={18}
              color={theme.colors.error.DEFAULT}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.positionDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Size</Text>
            <Text style={styles.detailValue}>{item.size || "0"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Entry Price</Text>
            <Text style={styles.detailValue}>
              ${parseFloat(item.entry_price || 0).toLocaleString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mark Price</Text>
            <Text style={styles.detailValue}>
              ${parseFloat(item.mark_price || 0).toLocaleString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Unrealized P&L</Text>
            <Text
              style={[
                styles.detailValue,
                styles.pnlValue,
                {
                  color: isProfitable
                    ? theme.colors.success.DEFAULT
                    : theme.colors.error.DEFAULT,
                },
              ]}
            >
              {isProfitable ? "+" : "-"}${Math.abs(pnl).toFixed(2)} (
              {pnlPercent.toFixed(2)}%)
            </Text>
          </View>
        </View>

        {item.liquidation_price && (
          <View style={styles.warningBanner}>
            <MaterialIcons
              name="warning"
              size={16}
              color={theme.colors.warning.DEFAULT}
            />
            <Text style={styles.warningText}>
              Liquidation: $
              {parseFloat(item.liquidation_price).toLocaleString()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Open Positions</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.info.DEFAULT} />
          <Text style={styles.loadingText}>Loading positions...</Text>
        </View>
      </View>
    );
  }

  if (!positions.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Open Positions</Text>
          <Text style={styles.count}>0</Text>
        </View>
        <View style={styles.emptyState}>
          <MaterialIcons
            name="trending-up"
            size={48}
            color={withOpacity(theme.colors.text.tertiary, 0.9)}
          />
          <Text style={styles.emptyText}>No open positions</Text>
          <Text style={styles.emptySubtext}>
            Place a trade to start tracking your positions
          </Text>
        </View>
      </View>
    );
  }

  const totalPnl = positions.reduce(
    (sum, pos) => sum + parseFloat(pos.unrealized_pnl || 0),
    0,
  );
  const isProfitable = totalPnl >= 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Open Positions</Text>
          <Text
            style={[
              styles.totalPnl,
              {
                color: isProfitable
                  ? theme.colors.success.DEFAULT
                  : theme.colors.error.DEFAULT,
              },
            ]}
          >
            {isProfitable ? "+" : "-"}${Math.abs(totalPnl).toFixed(2)} Total P&L
          </Text>
        </View>
        <Text style={styles.count}>{positions.length}</Text>
      </View>

      <FlatList
        data={positions}
        renderItem={renderPosition}
        keyExtractor={(item) => item.id || item.asset}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const createStyles = (theme) => {
  const { colors } = theme;
  const longBackground = withOpacity(colors.success.DEFAULT, 0.15);
  const shortBackground = withOpacity(colors.error.DEFAULT, 0.15);

  return {
    container: {
      flex: 1,
      backgroundColor: withOpacity(colors.card.DEFAULT, 0.92),
      borderRadius: 20,
      borderWidth: 1,
      borderColor: withOpacity(colors.border, 0.2),
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: withOpacity(colors.border, 0.2),
    },
    title: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text.primary,
    },
    totalPnl: {
      fontSize: 13,
      fontWeight: "600",
      marginTop: 4,
    },
    count: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.primary.DEFAULT,
    },
    listContent: {
      padding: 12,
    },
    positionCard: {
      backgroundColor: withOpacity(colors.backgroundSecondary, 0.6),
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: withOpacity(colors.border, 0.18),
    },
    positionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    positionLeft: {
      flex: 1,
    },
    symbolRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    symbol: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text.primary,
    },
    sideBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    sideText: {
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    leverageBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: withOpacity(colors.primary.DEFAULT, 0.15),
    },
    leverageText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.primary.DEFAULT,
    },
    closeButton: {
      padding: 4,
    },
    positionDetails: {
      gap: 8,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    detailLabel: {
      fontSize: 12,
      color: colors.text.secondary,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text.primary,
    },
    pnlValue: {
      fontSize: 14,
    },
    warningBanner: {
      marginTop: 12,
      borderRadius: 8,
      padding: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: withOpacity(colors.warning.DEFAULT, 0.12),
      borderWidth: 1,
      borderColor: withOpacity(colors.warning.DEFAULT, 0.2),
    },
    warningText: {
      fontSize: 12,
      color: colors.warning.dark ?? colors.warning.DEFAULT,
      fontWeight: "600",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 12,
      padding: 24,
    },
    loadingText: {
      fontSize: 13,
      color: colors.text.secondary,
    },
    emptyState: {
      alignItems: "center",
      gap: 12,
      paddingVertical: 40,
      paddingHorizontal: 24,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text.primary,
    },
    emptySubtext: {
      fontSize: 13,
      color: colors.text.secondary,
      textAlign: "center",
    },
  };
};
