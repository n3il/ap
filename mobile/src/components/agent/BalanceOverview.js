import React from 'react';
import { View, Text } from '@/components/ui';
import LabelValue, { FormattedValueLabel } from '@/components/ui/LabelValue';
import { useAccountBalance } from '@/hooks/useAccountBalance';
import { formatCurrency } from '@/utils/marketFormatting';
import { formatAmount, formatPercent } from '@/utils/currency';

export default function BalanceOverview({ agentId, hideOpenPositions = false, variant = 'compact' }) {
  const accountData = useAccountBalance(agentId, hideOpenPositions);

  if (variant === 'compact') {
    return (
      <View sx={{ flexDirection: 'row', justifyContent: 'space-between', gap: 2 }}>
        <View sx={{ gap: 2 }}>
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 0 }}>
            <Text variant="xs" tone="muted">
              AUM
            </Text>
          </View>
          <Text variant="md" sx={{ fontWeight: '600', fontFamily: 'monospace' }}>
            {formatAmount(accountData.equity)}
          </Text>
        </View>

        <View sx={{ alignItems: 'flex-end' }}>
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            {/* <LabelValue
              label="All P&L"
              value={(accountData.realizedPnl || 0) + (accountData.unrealizedPnl || 0)}
            /> */}
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
          <Text variant="xs" tone="muted" sx={{  }}>
            AUM
          </Text>
        </View>
        <Text variant="xl" sx={{ fontWeight: '600', fontFamily: 'monospace' }}>
          {formatAmount(accountData.equity)}
        </Text>

        {/* Total P&L */}
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text variant="xs" tone="muted">All-Time P&L</Text>
          <Text variant="sm" sx={{ color: totalPnl > 0 ? 'success' : (totalPnl < 0 ? 'error' : 'foreground') }}>
            {`${formatAmount(totalPnl)} (${formatAmount(totalPnlPercent, { showSign: true })}%)`}
          </Text>
        </View>
      </View>

      {/* Row 1: Unrealized P&L and Realized P&L */}
      <View sx={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}>
        <View sx={{ flex: 1 }}>
          <LabelValue
            label="Init. Capital"
            value={accountData.wallet || 0}
          />
        </View>

        <View sx={{ flex: 1,  }}>

          <LabelValue
            label="Open P&L"
            value={accountData.unrealizedPnl || 0}
            alignRight
            colorize
          >
          <Text variant="sm" sx={{ color: accountData.unrealizedPnl > 0 ? 'success' : (accountData.unrealizedPnl < 0 ? 'error' : 'foreground') }}>
            {`(${formatPercent(unrealizedPnlPercent)})`}
          </Text>
          </LabelValue>
        </View>
      </View>

      {/* Row 2: Initial Capital, Margin Used, Free Collateral */}
      <View sx={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}>
        <View sx={{ flex: 1 }}>
          <LabelValue
            label="Trades"
            value={null}
          />
        </View>
        <View sx={{ flex: 1 }}>
          <LabelValue
            label="Free Capital"
            value={accountData.availableMargin || 0}
            alignRight
          />
        </View>
        <View sx={{ flex: 1,  }}>
          <LabelValue
            label="Margin Ratio"
            value={leverageRatio?.toFixed(2) || '-'}
            alignRight
            formatter={l => l}
          />
        </View>
      </View>
    </View>
  );
}
