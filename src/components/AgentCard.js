import React from 'react';
import { View, Text, TouchableOpacity, StatusBadge, LabelValue } from '@/components/ui';
import { LLM_PROVIDERS } from './CreateAgentModal';
import WalletAddressCard from './WalletAddressCard';
import { GlassView } from 'expo-glass-effect';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { useAccountBalance } from '@/hooks/useAccountBalance';
import PositionList from './PositionList';

export default function AgentCard({
  agent,
  latestAssessment,
  isOwnAgent = false,
  onPress,
  shortView = false,
  hideOpenPositions = false,
  showPositions = true,
  extraContent = null,
  tintColor = 'rgba(0, 0, 0, .1)',
  ...props
}) {
  const {
    equity,
    unrealizedPnl,
    realizedPnl,
    enrichedPositions,
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

  // Calculate total PnL (realized + unrealized)
  const totalPnl = (realizedPnl || 0) + (unrealizedPnl || 0);
  const providerLabel = LLM_PROVIDERS[agent.llm_provider] || 'Unknown';
  const isPublished = Boolean(agent.published_at);

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

  const providerMeta = `${agent.llm_provider} ${agent.model_name}`;

  return (
    <GlassView
      variant="glass"
      glassEffectStyle="regular"
      tintColor={tintColor}
      isInteractive
      style={{
        paddingVertical: 18,
        paddingHorizontal: 18,
        borderRadius: 16,
      }}
      {...props}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View sx={{ marginBottom: 3, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <View sx={{ flex: 1 }}>
            <View sx={{ justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }}>
              <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text variant="md" sx={{ fontWeight: '500', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                  {agent.name}
                </Text>
             </View>
               <StatusBadge size="small" variant={isPublished ? 'info' : 'muted'} sx={{ fontFamily: 'monospace', borderWidth: 0 }}>
                {isPublished ? 'PUBLIC' : 'PRIVATE'}
              </StatusBadge>
            </View>
            <Text variant="sm" tone="muted" sx={{ flex: 1, fontFamily: 'monospace' }}>
              {providerMeta}
            </Text>
          </View>
        </View>

        <View sx={{ flexDirection: 'row', justifyContent: 'space-between', gap: 2 }}>
          <View sx={{ alignItems: 'flex-start' }}>
            <LabelValue
              label="Balance"
              value={balanceLabel}
            />
          </View>
          <View sx={{ alignItems: 'center' }}>
            <LabelValue
              label="Positions"
              value={positionsCountLabel}
            />
          </View>
          <View sx={{ alignItems: 'center' }}>
            <LabelValue
              label="Trades"
              value={tradesCountLabel}
            />
          </View>
          <View sx={{ alignItems: 'flex-end' }}>
            <LabelValue
              label="P&L"
              value={pnlValueLabel}
              sx={{ color: pnlColor }}
            />
          </View>
        </View>
        {showPositions && (
          <View sx={{ marginTop: 6, borderTopColor: 'muted', borderTopWidth: 1 }}>
            <PositionList positions={enrichedPositions} />
          </View>
        )}

        {/* <View sx={{ marginTop: 3, alignItems: 'flex-end' }}>
          <WalletAddressCard address={safeHyperliquidAddress} variant="short" />
        </View> */}
      </TouchableOpacity>
      {extraContent}
    </GlassView>
  );
}
