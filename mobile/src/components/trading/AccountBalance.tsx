import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { Text, TouchableOpacity, View } from "@/components/ui";

import { useTheme } from "@/contexts/ThemeContext";
import { withOpacity } from "@/theme/utils";

export default function AccountBalance({
  balance = 0,
  equity = 0,
  margin = 0,
  availableMargin = 0,
  unrealizedPnl = 0,
  onDeposit,
  onWithdraw,
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const marginUsagePercent = margin > 0 ? (margin / equity) * 100 : 0;
  const isHealthy = marginUsagePercent < 70;

  const depositColor = theme.colors.success.DEFAULT;
  const withdrawColor = theme.colors.error.DEFAULT;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          withOpacity(theme.colors.primary.DEFAULT, 0.12),
          withOpacity(theme.colors.success.DEFAULT, 0.12),
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.mainBalance}>
          <Text style={styles.balanceLabel}>Total Equity</Text>
          <Text style={styles.balanceValue}>
            $
            {equity.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          {unrealizedPnl !== 0 && (
            <Text
              style={[
                styles.pnlValue,
                { color: unrealizedPnl >= 0 ? depositColor : withdrawColor },
              ]}
            >
              {unrealizedPnl >= 0 ? "+" : "-"}$
              {Math.abs(unrealizedPnl).toFixed(2)} Unrealized
            </Text>
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Wallet Balance</Text>
            <Text style={styles.statValue}>${balance.toLocaleString()}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Available Margin</Text>
            <Text style={styles.statValue}>
              ${availableMargin.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Used Margin</Text>
            <Text style={styles.statValue}>${margin.toLocaleString()}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Margin Usage</Text>
            <Text
              style={[
                styles.statValue,
                {
                  color: isHealthy
                    ? depositColor
                    : theme.colors.warning.DEFAULT,
                },
              ]}
            >
              {marginUsagePercent.toFixed(1)}%
            </Text>
          </View>
        </View>

        {marginUsagePercent > 0 && (
          <View style={styles.marginBar}>
            <View
              style={[
                styles.marginBarFill,
                {
                  width: `${Math.min(marginUsagePercent, 100)}%`,
                  backgroundColor: isHealthy
                    ? depositColor
                    : theme.colors.warning.DEFAULT,
                },
              ]}
            />
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={onDeposit}>
            <MaterialIcons name="add-circle" size={20} color={depositColor} />
            <Text style={styles.actionText}>Deposit</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity style={styles.actionButton} onPress={onWithdraw}>
            <MaterialIcons
              name="remove-circle"
              size={20}
              color={withdrawColor}
            />
            <Text style={styles.actionText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const createStyles = (theme) => {
  const { colors } = theme;
  return {
    container: {
      borderRadius: 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: withOpacity(colors.border, 0.2),
      backgroundColor: withOpacity(colors.card.DEFAULT, 0.9),
    },
    gradient: {
      padding: 20,
    },
    mainBalance: {
      alignItems: "center",
      marginBottom: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: withOpacity(colors.border, 0.2),
    },
    balanceLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text.secondary,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 8,
    },
    balanceValue: {
      fontSize: 36,
      fontWeight: "700",
      color: colors.text.primary,
    },
    pnlValue: {
      fontSize: 14,
      fontWeight: "600",
      marginTop: 6,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 16,
    },
    statItem: {
      width: "50%",
      marginBottom: 16,
    },
    statLabel: {
      fontSize: 11,
      color: colors.text.secondary,
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    statValue: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text.primary,
    },
    marginBar: {
      height: 6,
      backgroundColor: withOpacity(colors.backgroundSecondary, 0.6),
      borderRadius: 3,
      overflow: "hidden",
      marginBottom: 16,
    },
    marginBarFill: {
      height: "100%",
      borderRadius: 3,
    },
    actions: {
      flexDirection: "row",
      backgroundColor: withOpacity(colors.backgroundSecondary, 0.5),
      borderRadius: 12,
      padding: 4,
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      gap: 6,
    },
    actionDivider: {
      width: 1,
      backgroundColor: withOpacity(colors.border, 0.2),
    },
    actionText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text.primary,
    },
  };
};
