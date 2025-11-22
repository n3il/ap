import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Dimensions,
} from '@/components/ui';
import ContainerView from '@/components/ContainerView';
import { useMarketPrices } from '@/hooks/useMarketPrices';
import { useTradingData } from '@/hooks/useTradingData';
import {
  TradingViewChart,
  OrderEntry,
  TickerSelector,
  OrderBook,
} from '@/components/trading';
import { useTheme } from '@/contexts/ThemeContext';
import { withOpacity } from '@/theme/utils';
import SectionTitle from '@/components/SectionTitle';

const { width } = Dimensions.get('window');

export default function TradeScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const { assets, isLoading: pricesLoading } = useMarketPrices();
  const { placeOrder, isPlacingOrder } = useTradingData({
    ledgerType: 'paper',
    ledgerAccountId: null,
  });

  const prices = useMemo(() => {
    const priceMap = {};
    assets.forEach((asset) => {
      if (asset?.symbol && asset?.price) {
        priceMap[asset.symbol] = asset.price;
      }
    });
    return priceMap;
  }, [assets]);

  const currentPrice = prices[selectedSymbol] || 0;

  const handlePlaceOrder = (order) => {
    Alert.alert(
      'Confirm Order',
      `Place ${order.side} order for ${order.amount} ${order.symbol} at ${
        order.type === 'MARKET' ? 'market price' : `$${order.price}`
      }?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => placeOrder({ ...order, symbol: selectedSymbol }),
        },
      ],
    );
  };

  return (
    <ContainerView>
      <View sx={{ alignSelf: 'flex-start', marginBottom: 3 }}>
        <SectionTitle>Trade</SectionTitle>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <TickerSelector
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
            prices={prices}
          />
        </View>

        <View style={styles.section}>
          <TradingViewChart
            symbol={selectedSymbol}
            theme={isDark ? 'dark' : 'light'}
            height={400}
          />
        </View>

        <View style={styles.twoColumnRow}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Place Order</Text>
            <OrderEntry
              symbol={selectedSymbol}
              currentPrice={currentPrice}
              onPlaceOrder={handlePlaceOrder}
              isLoading={isPlacingOrder}
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Order Book</Text>
            <OrderBook
              currentPrice={currentPrice}
              isLoading={pricesLoading}
            />
          </View>
        </View>
      </ScrollView>
    </ContainerView>
  );
}

const createStyles = (theme) => {
  const { colors } = theme;
  const divider = withOpacity(colors.border, 0.16);
  return {
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: 100,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text.secondary,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    twoColumnRow: {
      flexDirection: width > 768 ? 'row' : 'column',
      gap: 16,
      marginBottom: 24,
    },
    column: {
      flex: 1,
    },
  };
};
