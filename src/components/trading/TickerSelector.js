import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
} from '@/components/ui';
import { MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '@/contexts/ThemeContext';
import { withOpacity } from '@/theme/utils';

const POPULAR_TICKERS = [
  { symbol: 'BTC', name: 'Bitcoin', category: 'Layer 1' },
  { symbol: 'ETH', name: 'Ethereum', category: 'Layer 1' },
  { symbol: 'SOL', name: 'Solana', category: 'Layer 1' },
  { symbol: 'AVAX', name: 'Avalanche', category: 'Layer 1' },
  { symbol: 'ARB', name: 'Arbitrum', category: 'Layer 2' },
  { symbol: 'OP', name: 'Optimism', category: 'Layer 2' },
  { symbol: 'MATIC', name: 'Polygon', category: 'Layer 2' },
  { symbol: 'DOGE', name: 'Dogecoin', category: 'Meme' },
  { symbol: 'SUI', name: 'Sui', category: 'Layer 1' },
  { symbol: 'LINK', name: 'Chainlink', category: 'Oracle' },
  { symbol: 'UNI', name: 'Uniswap', category: 'DeFi' },
  { symbol: 'AAVE', name: 'Aave', category: 'DeFi' },
  { symbol: 'ADA', name: 'Cardano', category: 'Layer 1' },
  { symbol: 'DOT', name: 'Polkadot', category: 'Layer 0' },
  { symbol: 'ATOM', name: 'Cosmos', category: 'Layer 0' },
];

export default function TickerSelector({ selectedSymbol, onSelectSymbol, prices = {} }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTickers = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_TICKERS;

    const query = searchQuery.toLowerCase();
    return POPULAR_TICKERS.filter(
      (ticker) =>
        ticker.symbol.toLowerCase().includes(query) ||
        ticker.name.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const selectedTicker = POPULAR_TICKERS.find((t) => t.symbol === selectedSymbol);
  const currentPrice = prices[selectedSymbol];

  const handleSelect = (symbol) => {
    onSelectSymbol?.(symbol);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <View style={styles.triggerLeft}>
          <Text style={styles.symbol}>{selectedSymbol || 'BTC'}</Text>
          <Text style={styles.name}>
            {selectedTicker?.name || 'Bitcoin'} / PERP
          </Text>
        </View>
        <View style={styles.triggerRight}>
          {currentPrice && (
            <Text style={styles.price}>${currentPrice.toLocaleString()}</Text>
          )}
          <MaterialIcons
            name="arrow-drop-down"
            size={24}
            color={theme.colors.text.secondary}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Market</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <MaterialIcons
                name="search"
                size={20}
                color={theme.colors.text.tertiary}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search ticker..."
                placeholderTextColor={theme.colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="characters"
              />
            </View>

            <FlatList
              data={filteredTickers}
              keyExtractor={(item) => item.symbol}
              renderItem={({ item }) => {
                const price = prices[item.symbol];
                const isSelected = item.symbol === selectedSymbol;

                return (
                  <TouchableOpacity
                    style={[
                      styles.tickerItem,
                      isSelected && styles.tickerItemActive,
                    ]}
                    onPress={() => handleSelect(item.symbol)}
                  >
                    <View style={styles.tickerLeft}>
                      <Text style={styles.tickerSymbol}>{item.symbol}</Text>
                      <Text style={styles.tickerName}>{item.name}</Text>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{item.category}</Text>
                      </View>
                    </View>
                    <View style={styles.tickerRight}>
                      {price && (
                        <Text style={styles.tickerPrice}>
                          ${price.toLocaleString()}
                        </Text>
                      )}
                      {isSelected && (
                        <MaterialIcons
                          name="check-circle"
                          size={20}
                          color={theme.colors.success.DEFAULT}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.listContent}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (theme) => {
  const { colors } = theme;
  return {
    trigger: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: withOpacity(colors.card.DEFAULT, 0.92),
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: withOpacity(colors.border, 0.2),
    },
    triggerLeft: {
      flex: 1,
    },
    symbol: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text.primary,
    },
    name: {
      fontSize: 13,
      color: colors.text.secondary,
      marginTop: 2,
    },
    triggerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    price: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.success.DEFAULT,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '85%',
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: withOpacity(colors.border, 0.2),
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: withOpacity(colors.border, 0.2),
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text.primary,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: withOpacity(colors.backgroundSecondary, 0.7),
      borderRadius: 12,
      margin: 16,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: withOpacity(colors.border, 0.2),
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      paddingLeft: 8,
      fontSize: 15,
      color: colors.text.primary,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    tickerItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      backgroundColor: withOpacity(colors.backgroundSecondary, 0.45),
      marginBottom: 8,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    tickerItemActive: {
      borderColor: colors.primary.DEFAULT,
      backgroundColor: withOpacity(colors.primary.DEFAULT, 0.18),
    },
    tickerLeft: {
      flex: 1,
    },
    tickerSymbol: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text.primary,
    },
    tickerName: {
      fontSize: 13,
      color: colors.text.secondary,
    },
    categoryBadge: {
      alignSelf: 'flex-start',
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: withOpacity(colors.muted.DEFAULT, 0.2),
    },
    categoryText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.muted.foreground,
    },
    tickerRight: {
      alignItems: 'flex-end',
      gap: 4,
      marginLeft: 12,
    },
    tickerPrice: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
    },
  };
};
