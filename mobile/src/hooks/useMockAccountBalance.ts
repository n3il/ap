import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';

// Mock balance for demo - used in Markets demo page
export function useMockAccountBalance() {
  const [wallet, setWallet] = useState(10000);

  const { data: positions = [] } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('trades')
        .select('*')
        .eq('status', 'OPEN');
      return data || [];
    },
  });

  const { unrealizedPnl, usedMargin } = useMemo(() => {
    const unrealized = positions.reduce((sum, pos) => {
      return sum + parseFloat(pos.unrealized_pnl || 0);
    }, 0);

    const margin = positions.reduce((sum, pos) => {
      const size = parseFloat(pos.size || 0);
      const entryPrice = parseFloat(pos.entry_price || 0);
      const leverage = parseFloat(pos.leverage || 1);
      return sum + (size * entryPrice) / leverage;
    }, 0);

    return { unrealizedPnl: unrealized, usedMargin: margin };
  }, [positions]);

  const equity = wallet + unrealizedPnl;
  const availableMargin = wallet - usedMargin;

  const deposit = async (amount) => {
    setWallet((prev) => prev + amount);
  };

  const withdraw = async (amount) => {
    if (amount > availableMargin) {
      throw new Error('Insufficient available margin');
    }
    setWallet((prev) => prev - amount);
  };

  return {
    wallet,
    equity,
    margin: usedMargin,
    availableMargin,
    unrealizedPnl,
    deposit,
    withdraw,
  };
}
