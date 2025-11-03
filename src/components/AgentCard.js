import React from 'react';
import { View, Text, TouchableOpacity, Stack, StatusBadge, LabelValue, Divider } from '@/components/ui';
import { LLM_PROVIDERS } from './CreateAgentModal';
import ActiveDurationBadge from './ActiveDurationBadge';
import WalletAddressCard from './WalletAddressCard';
import { GlassView } from 'expo-glass-effect';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { useAccountBalance } from '@/hooks/useAccountBalance';

export default function AgentCard({
  agent,
  latestAssessment,
  isOwnAgent = false,
  onPress,
  shortView = false,
  hideOpenPositions = false,
  ...props
}) {
  const {
    // wallet,
    equity,
    // margin: usedMargin,
    // availableMargin,
    unrealizedPnl,
    realizedPnl,
    enrichedPositions,
    // deposit,
    // withdraw,
  } = useAccountBalance(agent.id, hideOpenPositions)

  // Fetch total trades count
  const { data: tradesCount = 0 } = useQuery({
    queryKey: ['agent-trades-count', agent.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id);

      if (error) throw error;
      return count || 0;
    },
  });

  const formatPublishedOn = () => {
    if (!agent.published_at) return 'Not published';
    const publishedDate = new Date(agent.published_at);
    return publishedDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      // hour: '2-digit',
      // minute: '2-digit',
    });
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Awaiting first loop';
    const assessmentDate = new Date(timestamp);
    const diffMs = Date.now() - assessmentDate.getTime();

    if (diffMs < 60 * 1000) {
      return 'Just ran';
    }

    const diffMinutes = Math.floor(diffMs / (60 * 1000));
    if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }

    return assessmentDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNextRunLabel = (timestamp) => {
    if (!timestamp) {
      return 'First cron run queued';
    }

    const lastRun = new Date(timestamp).getTime();
    const diffMinutes = Math.max(0, Math.floor((Date.now() - lastRun) / (60 * 1000)));

    if (diffMinutes < 15) {
      const minutesRemaining = 15 - diffMinutes;
      return `Next loop in ~${minutesRemaining} min`;
    }

    const overdue = diffMinutes - 15;
    if (overdue <= 0) {
      return 'Next loop imminent';
    }

    return `Awaiting scheduler (+${overdue} min)`;
  };

  // Calculate total PnL (realized + unrealized)
  const totalPnl = (realizedPnl || 0) + (unrealizedPnl || 0);
  const providerLabel = LLM_PROVIDERS[agent.llm_provider] || 'Unknown';
  const isPublished = Boolean(agent.published_at);

  const safeAgentName = agent?.name || '';
  const safeModelName = agent?.model_name || '';
  const safeProviderLabel = providerLabel || '';
  const safeHyperliquidAddress = agent?.hyperliquid_address || '';
  const safeTradesCount = typeof tradesCount === 'number' ? tradesCount : 0;
  const safeEnrichedPositions = Array.isArray(enrichedPositions) ? enrichedPositions : [];
  const safeEquity = Number.isFinite(equity) ? equity : 0;
  const safeTotalPnl = Number.isFinite(totalPnl) ? totalPnl : 0;
  const pnlColor = safeTotalPnl > 0 ? 'success' : safeTotalPnl < 0 ? 'error' : 'foreground';
  const pnlSign = safeTotalPnl > 0 ? '+' : '';
  const balanceLabel = `$${safeEquity.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  const positionsCountLabel = safeEnrichedPositions.length > 0 ? String(safeEnrichedPositions.length) : '-';
  const tradesCountLabel = String(safeTradesCount);
  const pnlValueLabel = safeTotalPnl !== 0
    ? `${pnlSign}$${Math.abs(safeTotalPnl).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : '-';
  const safeActionLabel = actionLabel || '';
  const safeLatestTypeLabel = latestTypeLabel || '';
  const publishedLabel = isPublished ? (formatPublishedOn() || '') : '';
  const nextRunLabel = latestAssessment ? (getNextRunLabel(latestAssessment.timestamp) || '') : '';
  const providerMeta = safeModelName ? `${safeProviderLabel} (${safeModelName})` : safeProviderLabel;

  const latestTypeLabel =
    latestAssessment?.type === 'POSITION_REVIEW' ? 'Position Review' : 'Market Scan';

  const actionLabel =
    !latestAssessment?.trade_action_taken || latestAssessment.trade_action_taken === 'NO_ACTION'
      ? 'No action'
      : latestAssessment.trade_action_taken;

  const actionColor =
    !latestAssessment?.trade_action_taken || latestAssessment.trade_action_taken === 'NO_ACTION'
      ? 'textSecondary'
      : 'success';

  const isActive = Boolean(agent.is_active);

  return (
    <GlassView
      variant="glass"
      glassEffectStyle="regular"
      tintColor="rgba(0, 0, 0, 1)"
      isInteractive
      style={{
        paddingVertical: 18,
        paddingHorizontal: 18,
        borderRadius: 16,
      }}
      {...props}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flex: 1 }}>
        <View sx={{ marginBottom: 3, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <View sx={{ flex: 1 }}>
            <View sx={{ justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }}>
              <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text variant="lg" sx={{ fontWeight: '500' }}>
                  {safeAgentName}
                </Text>
                <ActiveDurationBadge isActive={isActive} variant="small" />
             </View>
               <StatusBadge size="small" variant={isPublished ? 'info' : 'muted'}>
                {isPublished ? 'PUBLIC' : 'PRIVATE'}
              </StatusBadge>
            </View>
            <Text variant="sm" tone="subtle" sx={{ flex: 1 }}>
              {providerMeta}
            </Text>
          </View>
        </View>

        <View sx={{ flexDirection: 'row', justifyContent: 'space-between', gap: 2 }}>
          <View sx={{ flex: 1, alignItems: 'flex-start' }}>
            <LabelValue
              label="Balance"
              value={balanceLabel}
            />
          </View>
          <View sx={{ flex: 1, alignItems: 'center' }}>
            <LabelValue
              label="Positions"
              value={positionsCountLabel}
            />
          </View>
          <View sx={{ flex: 1, alignItems: 'center' }}>
            <LabelValue
              label="Trades"
              value={tradesCountLabel}
            />
          </View>
          <View sx={{ flex: 1, alignItems: 'flex-end' }}>
            <LabelValue
              label="P&L"
              value={pnlValueLabel}
              sx={{ color: pnlColor }}
            />
          </View>
        </View>

        {safeEnrichedPositions.length > 0 && (
          <View sx={{ marginTop: 3, flex: 1 }}>
            {safeEnrichedPositions.map((position) => {
              const assetLabel = position.asset || position.symbol || position.coin || '';
              const sizeLabel = position.size || position.szi || 'N/A';
              const entryPriceValue = position.entry_price ? parseFloat(position.entry_price) : null;
              const currentPriceValue =
                typeof position.currentPrice === 'number'
                  ? position.currentPrice
                  : position.currentPrice
                    ? parseFloat(position.currentPrice)
                    : null;
              const hasEntryPrice = Number.isFinite(entryPriceValue);
              const hasCurrentPrice = Number.isFinite(currentPriceValue);
              const entryPriceLabel = hasEntryPrice
                ? `$${entryPriceValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
                : '';
              const currentPriceLabel = hasCurrentPrice
                ? `$${currentPriceValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
                : '';
              const unrealizedPnlValue = typeof position.unrealizedPnl === 'number'
                ? position.unrealizedPnl
                : parseFloat(position.unrealizedPnl) || 0;
              const pnlPercentValue = typeof position.pnlPercent === 'number'
                ? position.pnlPercent
                : position.pnlPercent
                  ? parseFloat(position.pnlPercent)
                  : null;
              const positionPnlColor = unrealizedPnlValue > 0 ? 'success' : unrealizedPnlValue < 0 ? 'error' : 'foreground';
              const positionPnlSign = unrealizedPnlValue > 0 ? '+' : '';
              const unrealizedPnlLabel = unrealizedPnlValue !== 0
                ? `${positionPnlSign}$${Math.abs(unrealizedPnlValue).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
                : '';
              const pnlPercentLabel = typeof pnlPercentValue === 'number'
                ? `${positionPnlSign}${Math.abs(pnlPercentValue).toFixed(2)}%`
                : '';

              return (
                <View
                  key={position.id || position.symbol}
                  sx={{
                    flexDirection: 'column',
                    paddingVertical: 2,
                    paddingHorizontal: 3,
                    borderRadius: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  }}
                  >
                  <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View sx={{ flex: 1 }}>
                      <View sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text variant="sm" sx={{ fontWeight: '600' }}>
                          {assetLabel}
                        </Text>
                        {position.side && (
                          <StatusBadge size="small" variant={position.side === 'LONG' ? 'success' : 'error'}>
                            {position.side}
                          </StatusBadge>
                        )}
                      </View>
                      <Text variant="xs" tone="muted">
                        Size: {sizeLabel}
                      </Text>
                    </View>
                    <View sx={{ alignItems: 'flex-end' }}>
                      {unrealizedPnlLabel && (
                        <>
                          <Text variant="xs" sx={{ fontWeight: '600', color: positionPnlColor }}>
                            {unrealizedPnlLabel}
                          </Text>
                          {pnlPercentLabel && (
                            <Text variant="xs" tone="subtle" sx={{ color: positionPnlColor }}>
                              {pnlPercentLabel}
                            </Text>
                          )}
                        </>
                      )}
                    </View>
                  </View>

                  <View sx={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 1 }}>
                    {entryPriceLabel && (
                      <View>
                        <Text variant="xs" tone="muted">
                          Entry: {entryPriceLabel}
                        </Text>
                      </View>
                    )}
                    {currentPriceLabel && (
                      <View>
                        <Text variant="xs" tone="muted">
                          Current: {currentPriceLabel}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <View sx={{ marginTop: 3, alignItems: 'flex-end' }}>
          <WalletAddressCard address={safeHyperliquidAddress} variant="short" />
        </View>
      </TouchableOpacity>
    </GlassView>
  );
}
