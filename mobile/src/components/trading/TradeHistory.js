import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from '@/components/ui';
import { MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '@/contexts/ThemeContext';
import { withOpacity } from '@/theme/utils';

const FILTER_OPTIONS = ['All', 'Profitable', 'Loss', 'Open', 'Closed'];

export default function TradeHistory({ trades = [], isLoading = false }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [filter, setFilter] = useState('All');

  const filteredTrades = useMemo(() => {
    if (filter === 'All') return trades;
    if (filter === 'Profitable') {
      return trades.filter(
        (t) => t.status === 'CLOSED' && parseFloat(t.realized_pnl || 0) > 0,
      );
    }
    if (filter === 'Loss') {
      return trades.filter(
        (t) => t.status === 'CLOSED' && parseFloat(t.realized_pnl || 0) < 0,
      );
    }
    if (filter === 'Open') return trades.filter((t) => t.status === 'OPEN');
    if (filter === 'Closed') return trades.filter((t) => t.status === 'CLOSED');
    return trades;
  }, [trades, filter]);

  const stats = useMemo(() => {
    const closedTrades = trades.filter((t) => t.status === 'CLOSED');
    const profitable = closedTrades.filter(
      (t) => parseFloat(t.realized_pnl || 0) > 0,
    );
    const totalPnl = closedTrades.reduce(
      (sum, t) => sum + parseFloat(t.realized_pnl || 0),
      0,
    );
    const winRate =
      closedTrades.length > 0
        ? (profitable.length / closedTrades.length) * 100
        : 0;

    return {
      totalPnl,
      winRate,
      total: trades.length,
      profitable: profitable.length,
    };
  }, [trades]);

  const renderTrade = ({ item }) => {
    const isLong = item.side === 'LONG';
    const isClosed = item.status === 'CLOSED';
    const pnl = isClosed
      ? parseFloat(item.realized_pnl || 0)
      : parseFloat(item.unrealized_pnl || 0);
    const isProfitable = pnl >= 0;

    const entryDate = item.entry_timestamp
      ? new Date(item.entry_timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

    return (
      <View style={styles.tradeCard}>
        <View style={styles.tradeHeader}>
          <View style={styles.symbolRow}>
            <Text style={styles.symbol}>{item.asset}</Text>
            <View
              style={[
                styles.sideBadge,
                {
                  backgroundColor: withOpacity(
                    isLong ? theme.colors.success.DEFAULT : theme.colors.error.DEFAULT,
                    0.15,
                  ),
                },
              ]}
            >
              <Text
                style={[
                  styles.sideText,
                  {
                    color: isLong
                      ? theme.colors.success.DEFAULT
                      : theme.colors.error.DEFAULT,
                  },
                ]}
              >
                {item.side}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: withOpacity(
                    isClosed
                      ? theme.colors.text.tertiary
                      : theme.colors.primary.DEFAULT,
                    0.18,
                  ),
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: isClosed
                      ? theme.colors.text.secondary
                      : theme.colors.primary.DEFAULT,
                  },
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>
          <Text style={styles.dateText}>{entryDate}</Text>
        </View>

        <View style={styles.tradeDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Size</Text>
            <Text style={styles.detailValue}>{item.size || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Entry</Text>
            <Text style={styles.detailValue}>
              ${parseFloat(item.entry_price || 0).toLocaleString()}
            </Text>
          </View>
          {isClosed && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Exit</Text>
              <Text style={styles.detailValue}>
                ${parseFloat(item.exit_price || 0).toLocaleString()}
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {isClosed ? 'Realized' : 'Unrealized'} P&L
            </Text>
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
              {isProfitable ? '+' : '-'}${Math.abs(pnl).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Trade History</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.info.DEFAULT} />
          <Text style={styles.loadingText}>Loading trades...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trade History</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Win Rate</Text>
            <Text
              style={[
                styles.statValue,
                {
                  color:
                    stats.winRate >= 50
                      ? theme.colors.success.DEFAULT
                      : theme.colors.error.DEFAULT,
                },
              ]}
            >
              {stats.winRate.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total P&L</Text>
            <Text
              style={[
                styles.statValue,
                {
                  color:
                    stats.totalPnl >= 0
                      ? theme.colors.success.DEFAULT
                      : theme.colors.error.DEFAULT,
                },
              ]}
            >
              {stats.totalPnl >= 0 ? '+' : '-'}$
              {Math.abs(stats.totalPnl).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.filterContainer}>
        {FILTER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => setFilter(option)}
            style={[
              styles.filterButton,
              filter === option && styles.filterButtonActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === option && styles.filterTextActive,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredTrades.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons
            name="history"
            size={48}
            color={withOpacity(theme.colors.text.tertiary, 0.9)}
          />
          <Text style={styles.emptyText}>No trades found</Text>
          <Text style={styles.emptySubtext}>
            {filter !== 'All'
              ? `No ${filter.toLowerCase()} trades`
              : 'Your trade history will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTrades}
          renderItem={renderTrade}
          keyExtractor={(item) => item.id || `${item.asset}-${item.entry_timestamp}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const createStyles = (theme) => {
  const { colors } = theme;
  return {
    container: {
      flex: 1,
      backgroundColor: withOpacity(colors.card.DEFAULT, 0.92),
      borderRadius: 20,
      borderWidth: 1,
      borderColor: withOpacity(colors.border, 0.2),
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: withOpacity(colors.border, 0.2),
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.primary,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 12,
    },
    statItem: {
      flex: 1,
    },
    statLabel: {
      fontSize: 11,
      color: colors.text.secondary,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.primary,
    },
    filterContainer: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: withOpacity(colors.border, 0.15),
    },
    filterButton: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 999,
      backgroundColor: withOpacity(colors.backgroundSecondary, 0.6),
    },
    filterButtonActive: {
      backgroundColor: withOpacity(colors.primary.DEFAULT, 0.18),
    },
    filterText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    filterTextActive: {
      color: colors.primary.DEFAULT,
    },
    listContent: {
      padding: 16,
      gap: 12,
    },
    tradeCard: {
      backgroundColor: withOpacity(colors.backgroundSecondary, 0.6),
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: withOpacity(colors.border, 0.18),
    },
    tradeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    symbolRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    symbol: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text.primary,
    },
    sideBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    sideText: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    dateText: {
      fontSize: 12,
      color: colors.text.secondary,
    },
    tradeDetails: {
      gap: 8,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    detailLabel: {
      fontSize: 12,
      color: colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text.primary,
    },
    pnlValue: {
      fontSize: 14,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
      padding: 24,
    },
    loadingText: {
      fontSize: 13,
      color: colors.text.secondary,
    },
    emptyState: {
      alignItems: 'center',
      gap: 12,
      paddingVertical: 40,
      paddingHorizontal: 24,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.primary,
    },
    emptySubtext: {
      fontSize: 13,
      color: colors.text.secondary,
      textAlign: 'center',
    },
  };
};
