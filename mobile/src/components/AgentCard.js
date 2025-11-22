import React from 'react';
import { View, Text, TouchableOpacity, StatusBadge, Card } from '@/components/ui';
import { LLM_PROVIDERS } from './CreateAgentModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { useAccountBalance } from '@/hooks/useAccountBalance';
import PositionList from './PositionList';
import { formatAmount, formatCompact } from '@/utils/currency';
import BalanceOverview from './agent/BalanceOverview';

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
  const accountData = useAccountBalance(agent.id, hideOpenPositions)

  // Calculate total PnL (realized + unrealized)
  const isPublished = Boolean(agent.published_at);

  console.log({ latestAssessment })
  return (
    <Card
      style={{
        paddingVertical: 18,
        paddingHorizontal: 18,
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
              {shortView ? (
                <StatusBadge size="small" variant={isPublished ? 'info' : 'muted'} sx={{ fontFamily: 'monospace', borderWidth: 0 }}>
                  {isPublished ? 'PUBLIC' : 'PRIVATE'}
                </StatusBadge>
              ) : null}
              <Text variant="xxs" tone="muted" sx={{ textAlign: 'left', fontStyle: 'italic' }}>
                {accountData.enrichedPositions.length > 3 ? `+ ${accountData.enrichedPositions.length - 3} more positions` : null}
              </Text>
            </View>
          </View>
        </View>

        <BalanceOverview agentId={agent.id} hideOpenPositions={hideOpenPositions} variant="full" />
        {!hideOpenPositions && (
          <View sx={{ marginTop: 6, borderTopColor: 'muted', borderTopWidth: 1 }}>
            <PositionList positions={accountData.enrichedPositions} top={3} />
            <Text variant="xxs" tone="muted" sx={{ textAlign: 'left', fontStyle: 'italic' }}>
              {accountData.enrichedPositions.length > 3 ? `+ ${accountData.enrichedPositions.length - 3} more positions` : null}
            </Text>
          </View>
        )}

        {/* <View sx={{ marginTop: 3, alignItems: 'flex-end' }}>
          <WalletAddressCard address={safeHyperliquidAddress} variant="short" />
        </View> */}
      </TouchableOpacity>
      {extraContent}
    </Card>
  );
}
