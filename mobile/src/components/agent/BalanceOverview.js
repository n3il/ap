import React from 'react';
import { View, Text } from '@/components/ui';
import LabelValue, { FormattedValueLabel } from '@/components/ui/LabelValue';
import { useAccountBalance } from '@/hooks/useAccountBalance';
import { formatCurrency } from '@/utils/marketFormatting';
import { formatAmount, formatPercent } from '@/utils/currency';

export default function BalanceOverview({ agentId, hideOpenPositions = false, variant = 'compact' }) {
  const accountData = useAccountBalance(agentId, hideOpenPositions);

  if (true) {
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

  // Full detailed view for crypto perpetual futures trading
  const totalPnl = (accountData.realizedPnl || 0) + (accountData.unrealizedPnl || 0);
  const totalPnlPercent = accountData.wallet ? (totalPnl / accountData.wallet) * 100 : 0;
  const unrealizedPnlPercent = accountData.equity ? ((accountData.unrealizedPnl || 0) / accountData.equity) * 100 : 0;

  // Calculate position value (total notional value of all positions)
  const positionValue = accountData.enrichedPositions?.reduce((sum, position) => {
    const size = parseFloat(position.size) || 0;
    const currentPrice = position.currentPrice || parseFloat(position.entry_price) || 0;
    return sum + (size * currentPrice);
  }, 0) || 0;

  // Calculate leverage ratio
  const leverageRatio = accountData.equity ? (positionValue / accountData.equity) : 0;

  return (
    <View sx={{ gap: 4 }}>
      {/* Header: Account Equity */}
      <View sx={{ gap: 2 }}>
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text variant="xs" tone="muted" sx={{ textTransform: 'uppercase' }}>
            Account Equity
          </Text>
        </View>
        <Text variant="xl" sx={{ fontWeight: '600', fontFamily: 'monospace' }}>
          {formatCurrency(accountData.equity)}
        </Text>

        {/* Total P&L */}
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text variant="xs" tone="muted">Total P&L</Text>
          <Text variant="sm" sx={{ fontFamily: 'monospace', color: totalPnl >= 0 ? 'success' : 'error' }}>
            {`${formatAmount(totalPnl)} (${formatAmount(totalPnlPercent, { showSign: true })}%)`}
          </Text>
        </View>
      </View>

      {/* Row 1: Unrealized P&L and Realized P&L */}
      <View sx={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}>
        <View sx={{ flex: 1 }}>
          <LabelValue
            label="Initial Capital"
            value={accountData.wallet || 0}
          />
        </View>
        <View sx={{ flex: 1 }}>
          <LabelValue
            label="Realized P&L"
            value={accountData.realizedPnl || 0}
            alignRight
          />
        </View>
        <View sx={{ flex: 1,  }}>

          <LabelValue
            label="Unrealized P&L"
            value={accountData.unrealizedPnl || 0}
            alignRight
          >
          <Text variant="sm" sx={{ fontFamily: 'monospace', color: accountData.unrealizedPnl > 0 ? 'success' : (accountData.unrealizedPnl < 0 ? 'error' : 'foreground') }}>
            {`${formatAmount(accountData.unrealizedPnl)} (${formatPercent(unrealizedPnlPercent)})`}
          </Text>
          </LabelValue>
        </View>
      </View>

      {/* Row 2: Initial Capital, Margin Used, Free Collateral */}
      <View sx={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}>
        <View sx={{ flex: 1 }}>
          <LabelValue
            label="Initial Capital"
            value={accountData.wallet || 0}
          />
        </View>
        <View sx={{ flex: 1 }}>
          <LabelValue
            label="Free Capital"
            value={accountData.availableMargin || 0}
          />
        </View>
        <View sx={{ flex: 1,  }}>
          <LabelValue
            label="Margin Ratio"
            value={(parseFloat(accountData.margin) / accountData.availableMargin) * 100 || 0}
            alignRight
          />
        </View>
      </View>
    </View>
  );
}
