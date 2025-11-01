import React from 'react';
import { View, Text, TouchableOpacity, Stack, StatusBadge, LabelValue, Divider, Card } from '@/components/ui';
import { LLM_PROVIDERS } from './CreateAgentModal';
import ActiveDurationBadge from './ActiveDurationBadge';
import WalletAddressCard from './WalletAddressCard';

export default function AgentCard({
  agent,
  latestAssessment,
  isOwnAgent = false,
  onPress,
  shortView = false,
  ...props
}) {
  const calculatePnL = () => {
    // This would be calculated from trades data
    return 0;
  };
  const pnl = calculatePnL();
  const pnlColor = pnl > 0 ? 'success' : pnl < 0 ? 'error' : 'foreground';
  const pnlSign = pnl > 0 ? '+' : '';
  const providerLabel = LLM_PROVIDERS[agent.llm_provider] || 'Unknown';
  const initialCapital = parseFloat(agent.initial_capital) || 0;
  const isPublished = Boolean(agent.published_at);


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

  const formatPublishedOn = () => {
    if (!agent.published_at) return 'Not published';
    const publishedDate = new Date(agent.published_at);
    return publishedDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isActive = Boolean(agent.is_active);

  return (
    <Card
      variant="glass"
      glassIntensity={100}
      glassTintColor="rgba(0, 0, 0, 0.9)"
      {...props}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View sx={{ marginBottom: 3, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <View sx={{ flex: 1 }}>
            <View sx={{ justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
              <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text variant="lg" sx={{ fontWeight: '700' }}>
                  {agent.name}
                </Text>
                <ActiveDurationBadge isActive={agent.is_active} variant="small" />
             </View>
               <StatusBadge size="small" variant={isPublished ? 'info' : 'muted'}>
                {isPublished ? 'PUBLIC' : 'PRIVATE'}
              </StatusBadge>
            </View>
            <Text variant="sm" tone="subtle" sx={{ flex: 1 }}>
              {providerLabel} ({agent.model_name})
            </Text>
          </View>
        </View>

        <Stack direction="row" justify="space-between" align="center">
          <LabelValue
            label="Capital"
            value={`$${initialCapital.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          />
          <View sx={{ alignItems: 'flex-end' }}>
            <LabelValue
              label="P&L"
              value={`${pnlSign}${'$'}${Math.abs(pnl).toLocaleString()}`}
              sx={{ color: pnlColor }}
            />
          </View>
        </Stack>

        {!shortView && (
          <>
            <Divider sx={{ marginTop: 3, opacity: 1 }} />

            <View sx={{  }}>
              {isOwnAgent ? (
                latestAssessment ? (
                  <>
                    <Stack direction="row" justify="space-between" align="flex-start">
                      <View sx={{ flex: 1, paddingRight: 3 }}>
                        <Text variant="xs" tone="muted" sx={{ marginBottom: 1 }}>
                          Last Assessment
                        </Text>
                        <Text variant="sm" sx={{ fontWeight: '600' }}>
                          {latestTypeLabel}
                        </Text>
                        <Text variant="xs" tone="subtle" sx={{ marginTop: 1 }}>
                          {formatRelativeTime(latestAssessment.timestamp)}
                        </Text>
                      </View>
                      <View sx={{ alignItems: 'flex-end', flex: 1 }}>
                        <Text variant="xs" tone="muted" sx={{ marginBottom: 1 }}>
                          Action
                        </Text>
                        <Text variant="xs" sx={{ fontWeight: '600', color: actionColor, textAlign: 'right' }}>
                          {actionLabel}
                        </Text>
                      </View>
                    </Stack>
                    <Text variant="xs" tone="subtle" sx={{ marginTop: 2 }}>
                      {getNextRunLabel(latestAssessment.timestamp)}
                    </Text>
                  </>
                ) : (
                  <View>
                    <Text variant="xs" tone="muted" sx={{ marginBottom: 1 }}>
                      Assessments
                    </Text>
                    <Text variant="xs" tone="subtle">
                      Awaiting first MARKET_SCAN loop from the scheduler.
                    </Text>
                  </View>
                )
              ) : (
                <View>
                  <Text variant="xs" tone="muted" sx={{ marginBottom: 1 }}>
                    Published
                  </Text>
                  <Text variant="xs" tone="subtle">
                    {isPublished ? formatPublishedOn() : 'Creator has not shared this agent yet.'}
                  </Text>
                  <Text variant="xs" tone="subtle" sx={{ marginTop: 2 }}>
                    Inspect the detail view to clone this agent into your own desk.
                  </Text>
                </View>
              )}

              <View sx={{ marginTop: 3, alignItems: 'flex-end' }}>
                <WalletAddressCard address={agent.hyperliquid_address} variant="short" />
              </View>
            </View>
          </>
        )}
        {shortView &&
          <View sx={{ marginTop: 3, alignItems: 'flex-end' }}>
            <WalletAddressCard address={agent.hyperliquid_address} variant="short" />
          </View>
        }
      </TouchableOpacity>
    </Card>
  );
}
