import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from '@/components/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { withOpacity } from '@/theme/utils';

const LEVERAGE_OPTIONS = [1, 2, 5, 10, 20, 50];

export default function OrderEntry({
  symbol = 'BTC',
  currentPrice = 0,
  onPlaceOrder,
  isLoading = false,
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [orderType, setOrderType] = useState('LIMIT'); // LIMIT or MARKET
  const [side, setSide] = useState('BUY'); // BUY or SELL
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [reduceOnly, setReduceOnly] = useState(false);

  const effectivePrice = useMemo(() => {
    if (orderType === 'MARKET') return currentPrice;
    return price ? parseFloat(price) : currentPrice;
  }, [orderType, price, currentPrice]);

  const totalValue = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    return amt * effectivePrice;
  }, [amount, effectivePrice]);

  const handlePlaceOrder = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (orderType === 'LIMIT' && (!price || parseFloat(price) <= 0)) {
      Alert.alert('Invalid Price', 'Please enter a valid price');
      return;
    }

    const order = {
      symbol,
      side: side === 'BUY' ? 'LONG' : 'SHORT',
      type: orderType,
      amount: parseFloat(amount),
      price: orderType === 'LIMIT' ? parseFloat(price) : currentPrice,
      leverage,
      reduceOnly,
    };

    onPlaceOrder?.(order);
  };

  const isBuy = side === 'BUY';
  const gradientColors = isBuy
    ? [
        withOpacity(theme.colors.success.light ?? theme.colors.success.DEFAULT, 0.85),
        theme.colors.success.DEFAULT,
      ]
    : [
        withOpacity(theme.colors.error.light ?? theme.colors.error.DEFAULT, 0.85),
        theme.colors.error.DEFAULT,
      ];

  return (
    <View style={styles.container}>
      {/* Order Type Selector */}
      <View style={styles.section}>
        <Text style={styles.label}>Order Type</Text>
        <View style={styles.buttonGroup}>
          {['LIMIT', 'MARKET'].map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setOrderType(type)}
              style={[
                styles.typeButton,
                orderType === type && styles.typeButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  orderType === type && styles.typeButtonTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Buy/Sell Tabs */}
      <View style={styles.sideSelector}>
        <TouchableOpacity
          onPress={() => setSide('BUY')}
          style={[styles.sideButton, isBuy && styles.sideBuyActive]}
        >
          <Text style={[styles.sideText, isBuy && styles.sideTextActive]}>
            Buy / Long
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSide('SELL')}
          style={[styles.sideButton, !isBuy && styles.sideSellActive]}
        >
          <Text style={[styles.sideText, !isBuy && styles.sideTextActive]}>
            Sell / Short
          </Text>
        </TouchableOpacity>
      </View>

      {/* Price Input (for limit orders) */}
      {orderType === 'LIMIT' && (
        <View style={styles.section}>
          <Text style={styles.label}>Price (USD)</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder={currentPrice.toFixed(2)}
            placeholderTextColor={theme.colors.text.tertiary}
            keyboardType="decimal-pad"
          />
        </View>
      )}

      {/* Amount Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Amount ({symbol})</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={theme.colors.text.tertiary}
          keyboardType="decimal-pad"
        />
        <View style={styles.percentButtons}>
          {[25, 50, 75, 100].map((percent) => (
            <TouchableOpacity
              key={percent}
              style={styles.percentButton}
              onPress={() => {
                // This would calculate based on available balance
                // For now just a placeholder
                setAmount((0.01 * (percent / 100)).toFixed(4));
              }}
            >
              <Text style={styles.percentText}>{percent}%</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Leverage Selector */}
      <View style={styles.section}>
        <Text style={styles.label}>Leverage: {leverage}x</Text>
        <View style={styles.leverageButtons}>
          {LEVERAGE_OPTIONS.map((lev) => (
            <TouchableOpacity
              key={lev}
              onPress={() => setLeverage(lev)}
              style={[
                styles.leverageButton,
                leverage === lev && styles.leverageButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.leverageText,
                  leverage === lev && styles.leverageTextActive,
                ]}
              >
                {lev}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Reduce Only Toggle */}
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setReduceOnly(!reduceOnly)}
      >
        <View style={[styles.checkbox, reduceOnly && styles.checkboxActive]}>
          {reduceOnly && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>Reduce Only</Text>
      </TouchableOpacity>

      {/* Order Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Value</Text>
          <Text style={styles.summaryValue}>${totalValue.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Estimated Fee</Text>
          <Text style={styles.summaryValue}>~${(totalValue * 0.0005).toFixed(2)}</Text>
        </View>
      </View>

      {/* Place Order Button */}
      <TouchableOpacity
        onPress={handlePlaceOrder}
        disabled={isLoading}
        style={styles.placeOrderButton}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.placeOrderGradient}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.foreground} />
          ) : (
            <Text style={styles.placeOrderText}>
              {side} {symbol} {orderType}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme) => {
  const { colors } = theme;
  return {
    container: {
      backgroundColor: withOpacity(colors.card.DEFAULT, 0.9),
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: withOpacity(colors.border, 0.25),
    },
    section: {
      marginBottom: 16,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.secondary,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    buttonGroup: {
      flexDirection: 'row',
      gap: 8,
    },
    typeButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: withOpacity(colors.border, 0.2),
      backgroundColor: withOpacity(colors.backgroundSecondary, 0.8),
    },
    typeButtonActive: {
      borderColor: colors.primary.DEFAULT,
      backgroundColor: withOpacity(colors.primary.DEFAULT, 0.15),
    },
    typeButtonText: {
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    typeButtonTextActive: {
      color: colors.primary.DEFAULT,
    },
    sideSelector: {
      flexDirection: 'row',
      marginBottom: 16,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: withOpacity(colors.border, 0.2),
    },
    sideButton: {
      flex: 1,
      paddingVertical: 16,
      backgroundColor: withOpacity(colors.backgroundSecondary, 0.7),
    },
    sideBuyActive: {
      backgroundColor: withOpacity(colors.success.DEFAULT, 0.2),
    },
    sideSellActive: {
      backgroundColor: withOpacity(colors.error.DEFAULT, 0.2),
    },
    sideText: {
      textAlign: 'center',
      fontSize: 15,
      fontWeight: '700',
      color: colors.text.secondary,
    },
    sideTextActive: {
      color: colors.foreground,
    },
    input: {
      backgroundColor: withOpacity(colors.backgroundSecondary, 0.85),
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.foreground,
      borderWidth: 1,
      borderColor: withOpacity(colors.border, 0.25),
    },
    percentButtons: {
      flexDirection: 'row',
      marginTop: 8,
      gap: 6,
    },
    percentButton: {
      flex: 1,
      paddingVertical: 6,
      backgroundColor: withOpacity(colors.backgroundSecondary, 0.7),
      borderRadius: 6,
      borderWidth: 1,
      borderColor: withOpacity(colors.border, 0.2),
    },
    percentText: {
      textAlign: 'center',
      fontSize: 11,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    leverageButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    leverageButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: withOpacity(colors.border, 0.2),
      backgroundColor: withOpacity(colors.backgroundSecondary, 0.7),
    },
    leverageButtonActive: {
      borderColor: colors.primary.DEFAULT,
      backgroundColor: withOpacity(colors.primary.DEFAULT, 0.15),
    },
    leverageText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    leverageTextActive: {
      color: colors.primary.DEFAULT,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: withOpacity(colors.text.tertiary, 0.6),
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxActive: {
      backgroundColor: colors.primary.DEFAULT,
      borderColor: colors.primary.DEFAULT,
    },
    checkmark: {
      color: colors.foreground,
      fontSize: 12,
      fontWeight: '700',
    },
    checkboxLabel: {
      fontSize: 14,
      color: colors.text.secondary,
    },
    summary: {
      backgroundColor: withOpacity(colors.backgroundSecondary, 0.6),
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    summaryLabel: {
      fontSize: 13,
      color: colors.text.secondary,
    },
    summaryValue: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text.primary,
    },
    placeOrderButton: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    placeOrderGradient: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    placeOrderText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.foreground,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
  };
};
