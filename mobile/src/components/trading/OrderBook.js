import React, { useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { withOpacity } from '@/theme/utils';

// Mock order book data generator for demo
const generateMockOrderBook = (currentPrice, depth = 15) => {
  const bids = [];
  const asks = [];
  let bidPrice = currentPrice * 0.999;
  let askPrice = currentPrice * 1.001;

  for (let i = 0; i < depth; i++) {
    bids.push({
      price: bidPrice,
      amount: Math.random() * 10 + 0.1,
      total: (Math.random() * 10 + 0.1) * bidPrice,
    });
    asks.push({
      price: askPrice,
      amount: Math.random() * 10 + 0.1,
      total: (Math.random() * 10 + 0.1) * askPrice,
    });
    bidPrice *= 0.9995;
    askPrice *= 1.0005;
  }

  return { bids, asks };
};

export default function OrderBook({ currentPrice = 0, isLoading = false }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { bids, asks } = useMemo(
    () => generateMockOrderBook(currentPrice),
    [currentPrice],
  );

  if (isLoading || currentPrice === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Order Book</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.info.DEFAULT} />
          <Text style={styles.loadingText}>Loading order book...</Text>
        </View>
      </View>
    );
  }

  const spread = asks[0]?.price - bids[0]?.price;
  const spreadPercent = ((spread / currentPrice) * 100).toFixed(3);

  const maxBidTotal = Math.max(...bids.map((b) => b.total));
  const maxAskTotal = Math.max(...asks.map((a) => a.total));
  const maxTotal = Math.max(maxBidTotal, maxAskTotal);

  const renderBid = ({ item }) => {
    const widthPercent = (item.total / maxTotal) * 100;
    return (
      <View style={styles.orderRow}>
        <View
          style={[
            styles.backgroundBar,
            styles.backgroundBarBid,
            { width: `${widthPercent}%` },
          ]}
        />
        <Text style={[styles.orderPrice, styles.bidPrice]}>
          {item.price.toFixed(2)}
        </Text>
        <Text style={styles.orderAmount}>{item.amount.toFixed(4)}</Text>
        <Text style={styles.orderTotal}>{item.total.toFixed(2)}</Text>
      </View>
    );
  };

  const renderAsk = ({ item }) => {
    const widthPercent = (item.total / maxTotal) * 100;
    return (
      <View style={styles.orderRow}>
        <View
          style={[
            styles.backgroundBar,
            styles.backgroundBarAsk,
            { width: `${widthPercent}%` },
          ]}
        />
        <Text style={[styles.orderPrice, styles.askPrice]}>
          {item.price.toFixed(2)}
        </Text>
        <Text style={styles.orderAmount}>{item.amount.toFixed(4)}</Text>
        <Text style={styles.orderTotal}>{item.total.toFixed(2)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Book</Text>
        <Text style={styles.subtitle}>Real-time depth</Text>
      </View>

      <View style={styles.columnHeaders}>
        <Text style={styles.columnHeader}>Price (USD)</Text>
        <Text style={styles.columnHeader}>Amount</Text>
        <Text style={styles.columnHeader}>Total</Text>
      </View>

      <View style={styles.bookContent}>
        <FlatList
          data={asks.slice().reverse()}
          renderItem={renderAsk}
          keyExtractor={(_, index) => `ask-${index}`}
          style={styles.asksList}
          scrollEnabled={false}
        />

        <View style={styles.spreadRow}>
          <View style={styles.spreadContainer}>
            <Text style={styles.currentPrice}>
              ${currentPrice.toLocaleString()}
            </Text>
            <View style={styles.spreadBadge}>
              <Text style={styles.spreadText}>
                Spread: ${spread.toFixed(2)} ({spreadPercent}%)
              </Text>
            </View>
          </View>
        </View>

        <FlatList
          data={bids}
          renderItem={renderBid}
          keyExtractor={(_, index) => `bid-${index}`}
          style={styles.bidsList}
          scrollEnabled={false}
        />
      </View>
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
      overflow: 'hidden',
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
    subtitle: {
      fontSize: 11,
      color: colors.text.tertiary,
      marginTop: 2,
    },
    columnHeaders: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: withOpacity(colors.backgroundSecondary, 0.6),
    },
    columnHeader: {
      flex: 1,
      fontSize: 10,
      fontWeight: '600',
      color: colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      textAlign: 'right',
    },
    bookContent: {
      flex: 1,
    },
    asksList: {
      maxHeight: 200,
    },
    bidsList: {
      maxHeight: 200,
    },
    orderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 4,
      position: 'relative',
    },
    backgroundBar: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
    },
    backgroundBarBid: {
      backgroundColor: withOpacity(colors.success.DEFAULT, 0.15),
    },
    backgroundBarAsk: {
      backgroundColor: withOpacity(colors.error.DEFAULT, 0.15),
    },
    orderPrice: {
      flex: 1,
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'right',
      color: colors.text.primary,
    },
    bidPrice: {
      color: colors.success.DEFAULT,
    },
    askPrice: {
      color: colors.error.DEFAULT,
    },
    orderAmount: {
      flex: 1,
      fontSize: 12,
      color: colors.text.secondary,
      textAlign: 'right',
    },
    orderTotal: {
      flex: 1,
      fontSize: 12,
      color: colors.text.tertiary,
      textAlign: 'right',
    },
    spreadRow: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: withOpacity(colors.backgroundSecondary, 0.55),
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: withOpacity(colors.border, 0.15),
    },
    spreadContainer: {
      alignItems: 'center',
      gap: 6,
    },
    currentPrice: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text.primary,
    },
    spreadBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      backgroundColor: withOpacity(colors.primary.DEFAULT, 0.12),
      borderRadius: 8,
    },
    spreadText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary.DEFAULT,
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
  };
};
