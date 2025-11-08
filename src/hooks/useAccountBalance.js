import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';

export function useAccountBalance(agentId, hideOpenPositions) {
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
    enabled: !!agentId && !hideOpenPositions,
  });

  // Fetch current market prices for open positions
  const positionSymbols = useMemo(() => {
    return openPositions.map(p => p.asset).filter(Boolean);
  }, [openPositions]);

  const { data: marketPrices = {} } = useQuery({
    queryKey: ['market-prices-for-positions', positionSymbols.join(',')],
    queryFn: async () => {
      if (positionSymbols.length === 0) return {};

      // Fetch from Hyperliquid market data
      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'allMids' }),
      });

      if (!response.ok) throw new Error('Failed to fetch market prices');
      const allMids = await response.json();

      // Create a map of symbol -> price
      const priceMap = {};
      positionSymbols.forEach(symbol => {
        if (allMids[symbol]) {
          priceMap[symbol] = parseFloat(allMids[symbol]);
        }
      });

      return priceMap;
    },
    enabled: positionSymbols.length > 0,
    refetchInterval: 5000, // Refresh prices every 5 seconds
  });

  // Calculate enriched positions with current prices and P&L
  const enrichedPositions = useMemo(() => {
    return openPositions.map(position => {
      const symbol = position.asset;
      const currentPrice = marketPrices[symbol];
      const entryPrice = parseFloat(position.entry_price) || 0;
      const size = parseFloat(position.size) || 0;
      const side = position.side;

      let unrealizedPnl = 0;
      let pnlPercent = 0;

      if (currentPrice && entryPrice && size) {
        const leverage = parseFloat(position.leverage) || 1;
        const priceChange = currentPrice - entryPrice;
        const priceChangePercent = priceChange / entryPrice;
        const positionValue = size * entryPrice;

        // Calculate P&L based on position side (matching backend logic)
        if (side === 'LONG') {
          unrealizedPnl = positionValue * priceChangePercent * leverage;
        } else if (side === 'SHORT') {
          unrealizedPnl = -positionValue * priceChangePercent * leverage;
        }

        // Calculate percentage
        pnlPercent = entryPrice !== 0 ? (unrealizedPnl / positionValue) * 100 : 0;
      } else if (position.unrealized_pnl) {
        // Fallback to stored unrealized_pnl if available
        unrealizedPnl = parseFloat(position.unrealized_pnl) || 0;
      }

      return {
        ...position,
        currentPrice,
        unrealizedPnl,
        pnlPercent,
      };
    });
  }, [openPositions, marketPrices]);

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

    // Calculate unrealized PnL from enriched positions
    const unrealizedPnl = enrichedPositions.reduce((sum, p) => {
      return sum + (p.unrealizedPnl || 0);
    }, 0);

    // Calculate account value
    const accountValue = initialCapital + realizedPnl + unrealizedPnl;

    // Calculate margin used (position value / leverage)
    const marginUsed = enrichedPositions.reduce((sum, p) => {
      const size = parseFloat(p.size) || 0;
      const currentPrice = p.currentPrice || parseFloat(p.entry_price) || 0;
      const leverage = parseFloat(p.leverage) || 1;
      const positionValue = size * currentPrice;
      return sum + (positionValue / leverage);
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
  }, [agent, closedTrades, enrichedPositions]);

  return {
    wallet: balanceMetrics.initialCapital,
    equity: balanceMetrics.accountValue,
    margin: balanceMetrics.marginUsed,
    availableMargin: balanceMetrics.remainingCash,
    unrealizedPnl: balanceMetrics.unrealizedPnl,
    realizedPnl: balanceMetrics.realizedPnl,
    enrichedPositions,
    isLoading: !agent,
  };
}
