import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from '@/components/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { withOpacity } from '@/theme/utils';
import { formatPriceDisplay, formatUsdValue } from './utils';

const PERCENT_STOPS = [0, 25, 50, 75, 100];

export default function TradeActionModal({
  visible,
  asset,
  price = 0,
  availableBalance = 0,
  defaultSide = 'buy',
  onClose,
  onSubmit,
  isSubmitting,
}) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [side, setSide] = useState(defaultSide);
  const [orderType, setOrderType] = useState('MARKET');
  const [size, setSize] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setSide(defaultSide);
    setOrderType('MARKET');
    setSize('');
    setLimitPrice('');
    setPercent(0);
  }, [visible, defaultSide]);

  const effectivePrice = orderType === 'MARKET' ? price : parseFloat(limitPrice) || price;

  const orderValue = useMemo(() => {
    const amount = parseFloat(size);
    if (!Number.isFinite(amount) || !Number.isFinite(effectivePrice)) {
      return 'N/A';
    }
    const total = amount * effectivePrice;
    return formatUsdValue(total);
  }, [size, effectivePrice]);

  const estimatedSlippage = useMemo(() => {
    const slip = (percent / 100) * 8;
    return `${slip.toFixed(2)}%`;
  }, [percent]);

  const handlePercentSelect = (value) => {
    setPercent(value);
    const cap = asset?.defaultSizeCap ?? 1_000;
    const calculated = (cap * value) / 100;
    if (!calculated) {
      setSize('');
      return;
    }
    const decimals = calculated >= 1 ? 2 : 4;
    setSize(calculated.toFixed(decimals));
  };

  const handleSubmit = () => {
    const numericSize = parseFloat(size);
    if (!Number.isFinite(numericSize) || numericSize <= 0) {
      Alert.alert('Invalid size', 'Enter a valid position size.');
      return;
    }

    if (orderType === 'LIMIT' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      Alert.alert('Invalid limit price', 'Enter a valid limit price.');
      return;
    }

    const payload = {
      symbol: asset?.symbol ?? 'XPL',
      side: side === 'buy' ? 'LONG' : 'SHORT',
      type: orderType,
      amount: numericSize,
      price: orderType === 'MARKET' ? price : parseFloat(limitPrice) || price,
      leverage: parseFloat(asset?.leverage) || 1,
    };

    onSubmit?.(payload);
  };

  const isBuy = side === 'buy';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 20,
            gap: 18,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 48,
              height: 4,
              borderRadius: 2,
              backgroundColor: withOpacity(colors.text.secondary, 0.4),
            }}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              onPress={() => setOrderType((prev) => (prev === 'MARKET' ? 'LIMIT' : 'MARKET'))}
            >
              <Text style={{ color: colors.text.secondary, fontWeight: '600' }}>
                {orderType === 'MARKET' ? 'Market' : 'Limit'}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={18}
                color={colors.text.secondary}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View
            style={{
              flexDirection: 'row',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: withOpacity(colors.border, 0.3),
              overflow: 'hidden',
            }}
          >
            {['buy', 'sell'].map((option) => {
              const active = side === option;
              return (
                <TouchableOpacity
                  key={option}
                  onPress={() => setSide(option)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    alignItems: 'center',
                    backgroundColor: active
                      ? withOpacity(
                          option === 'buy'
                            ? colors.success.DEFAULT
                            : colors.error.DEFAULT,
                          0.2,
                        )
                      : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      color: active
                        ? option === 'buy'
                          ? colors.success.DEFAULT
                          : colors.error.DEFAULT
                        : colors.text.secondary,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                    }}
                  >
                    {option === 'buy' ? 'Buy' : 'Sell'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View>
            <Text style={{ color: colors.text.secondary, fontSize: 12 }}>Avail. to Trade</Text>
            <Text style={{ color: colors.text.primary, fontWeight: '700' }}>
              {formatUsdValue(availableBalance)}
            </Text>
          </View>

          <View>
            <Text style={{ color: colors.text.secondary, fontSize: 12 }}>Size ({asset?.symbol})</Text>
            <TextInput
              value={size}
              onChangeText={setSize}
              placeholder="0.00"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="decimal-pad"
              style={{
                marginTop: 6,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: withOpacity(colors.border, 0.4),
                padding: 12,
                color: colors.text.primary,
                fontSize: 18,
                fontWeight: '600',
              }}
            />
          </View>

          {orderType === 'LIMIT' && (
            <View>
              <Text style={{ color: colors.text.secondary, fontSize: 12 }}>Limit Price (USDC)</Text>
              <TextInput
                value={limitPrice}
                onChangeText={setLimitPrice}
                placeholder={formatPriceDisplay(price)}
                placeholderTextColor={colors.text.tertiary}
                keyboardType="decimal-pad"
                style={{
                  marginTop: 6,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: withOpacity(colors.border, 0.4),
                  padding: 12,
                  color: colors.text.primary,
                  fontSize: 18,
                  fontWeight: '600',
                }}
              />
            </View>
          )}

          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.text.secondary, fontSize: 12 }}>Allocation</Text>
              <Text style={{ color: colors.text.secondary, fontSize: 12 }}>{percent}%</Text>
            </View>
            <View
              style={{
                marginTop: 12,
                height: 6,
                borderRadius: 3,
                backgroundColor: withOpacity(colors.backgroundSecondary, 0.8),
              }}
            >
              <View
                style={{
                  height: '100%',
                  borderRadius: 3,
                  width: `${percent}%`,
                  backgroundColor: isBuy
                    ? withOpacity(colors.success.DEFAULT, 0.8)
                    : withOpacity(colors.error.DEFAULT, 0.8),
                }}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              {PERCENT_STOPS.map((stop) => (
                <TouchableOpacity key={stop} onPress={() => handlePercentSelect(stop)}>
                  <Text
                    style={{
                      color: percent === stop ? colors.text.primary : colors.text.secondary,
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {stop}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.text.secondary }}>Order Value</Text>
            <Text style={{ color: colors.text.primary, fontWeight: '700' }}>{orderValue}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.text.secondary }}>Slippage</Text>
            <Text style={{ color: colors.text.primary }}>
              Est: {estimatedSlippage} / Max: 8.00%
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={{
              marginTop: 8,
              paddingVertical: 16,
              borderRadius: 16,
              backgroundColor: isBuy ? colors.success.DEFAULT : colors.error.DEFAULT,
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                textAlign: 'center',
                fontWeight: '700',
                color: colors.surface,
                fontSize: 16,
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Place Order'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
