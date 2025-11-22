import React from 'react';
import { View, Text } from '@/components/ui';
import LabelValue, { FormattedValueLabel } from '@/components/ui/LabelValue';
import { useAccountBalance } from '@/hooks/useAccountBalance';
import { formatAmount } from '@/utils/currency';
import { formatCurrency } from '@/utils/marketFormatting';

export default function BalanceOverview({ agentId, hideOpenPositions = false, variant = 'compact' }) {
  const accountData = useAccountBalance(agentId, hideOpenPositions);

  if (variant === 'compact') {
    return (
      <View sx={{ flexDirection: 'row', justifyContent: 'space-between', gap: 2 }}>
        <View sx={{ alignItems: 'flex-start' }}>
          <LabelValue
            label="Balance"
            value={accountData.equity}
          />
        </View>
        <View sx={{ alignItems: 'flex-end' }}>
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <LabelValue
              label="All P&L"
              value={(accountData.realizedPnl || 0) + (accountData.unrealizedPnl || 0)}
            />
            <LabelValue
              label="Open P&L"
              value={accountData.unrealizedPnl}
              colorize
            />
          </View>
        </View>
      </View>
    );
  }

  // Full detailed view matching the image
  const openPnlPercent = accountData.equity ? ((accountData.unrealizedPnl || 0) / accountData.equity) * 100 : 0;
  const marketValue = accountData.margin || 0;

  return (
    <View sx={{ gap: 4 }}>
      {/* Header: Net Account Value */}
      <View sx={{ gap: 2 }}>
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text variant="xs" tone="muted" sx={{ textTransform: 'uppercase' }}>
            Net Account Value
          </Text>
        </View>
        <Text variant="2xl" sx={{ fontWeight: '600', fontFamily: 'monospace' }}>
          {formatCurrency(accountData.equity)}
        </Text>
      </View>

      {/* Row 1: Open P&L and Market Value */}
      <View sx={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}>
        <View sx={{ flex: 1, flexDirection: 'row'}}>
          <LabelValue
            label="Open P&L"
            value={accountData.unrealizedPnl || 0}
          >
            <FormattedValueLabel value={openPnlPercent} colorize />
          </LabelValue>
        </View>
        <View sx={{ flex: 1, alignItems: 'flex-end' }}>
          <LabelValue
            label="Market Value"
            value={marketValue}
            alignRight
          />
        </View>
      </View>

      {/* Row 2: Cash Balance, Settled Cash, Unsettled Cash */}
      <View sx={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}>
        <View sx={{ flex: 1 }}>
          <LabelValue
            label="Cash Balance"
            value={accountData.availableMargin || 0}
          />
        </View>
        <View sx={{ flex: 1 }}>
          <LabelValue
            label="Settled Cash"
            value={0}
          />
        </View>
        <View sx={{ flex: 1, alignItems: 'flex-end' }}>
          <LabelValue
            label="Unsettled Cash"
            value={accountData.availableMargin || 0}
            alignRight
          />
        </View>
      </View>

      {/* Row 3: Buying Power, Options BP, Event BP */}
      <View sx={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}>
        <View sx={{ flex: 1 }}>
          <LabelValue
            label="Buying Power"
            value={accountData.availableMargin || 0}
          />
        </View>
        <View sx={{ flex: 1 }}>
          <LabelValue
            label="Options BP"
            value={accountData.availableMargin || 0}
          />
        </View>
        <View sx={{ flex: 1, alignItems: 'flex-end' }}>
          <LabelValue
            label="Event BP"
            value={0}
          />
        </View>
      </View>
    </View>
  );
}
