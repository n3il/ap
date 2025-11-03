import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';

export function useAccountBalance(agentId) {
  // Fetch agent data for initial capital
  const { data: agent } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!agentId,
  });

  // Fetch closed trades for realized PnL
  const { data: closedTrades = [] } = useQuery({
    queryKey: ['closed-trades', agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('realized_pnl')
        .eq('agent_id', agentId)
        .eq('status', 'CLOSED');
      if (error) throw error;
      return data || [];
    },
    enabled: !!agentId,
  });

  // Fetch open positions
  const { data: openPositions = [] } = useQuery({
    queryKey: ['open-positions', agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('agent_id', agentId)
        .eq('status', 'OPEN');
      if (error) throw error;
      return data || [];
    },
    enabled: !!agentId,
  });

  // Calculate all balance metrics (matching run_agent_assessment logic)
  const balanceMetrics = useMemo(() => {
    if (!agent) {
      return {
        initialCapital: 0,
        realizedPnl: 0,
        unrealizedPnl: 0,
        accountValue: 0,
        marginUsed: 0,
        remainingCash: 0,
      };
    }

    const initialCapital = parseFloat(agent.initial_capital) || 0;

    // Calculate realized PnL from closed trades
    const realizedPnl = closedTrades.reduce((sum, t) => sum + (parseFloat(t.realized_pnl) || 0), 0);

    // Calculate unrealized PnL from open positions
    // Note: This calculation requires current market prices
    // For now, we'll use the unrealized_pnl field if available
    const unrealizedPnl = openPositions.reduce((sum, p) => {
      return sum + (parseFloat(p.unrealized_pnl) || 0);
    }, 0);

    // Calculate account value
    const accountValue = initialCapital + realizedPnl + unrealizedPnl;

    // Calculate margin used
    const marginUsed = openPositions.reduce((sum, p) => {
      const size = parseFloat(p.size) || 0;
      const entryPrice = parseFloat(p.entry_price) || 0;
      return sum + (size * entryPrice);
    }, 0);

    // Calculate remaining cash
    const remainingCash = accountValue - marginUsed;

    return {
      initialCapital,
      realizedPnl,
      unrealizedPnl,
      accountValue,
      marginUsed,
      remainingCash,
    };
  }, [agent, closedTrades, openPositions]);

  return {
    wallet: balanceMetrics.initialCapital,
    equity: balanceMetrics.accountValue,
    margin: balanceMetrics.marginUsed,
    availableMargin: balanceMetrics.remainingCash,
    unrealizedPnl: balanceMetrics.unrealizedPnl,
    realizedPnl: balanceMetrics.realizedPnl,
    isLoading: !agent,
  };
}
