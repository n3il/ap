import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { tradeService } from "@/services/tradeService";

// Mock balance for demo - used in Markets demo page
export function useMockAccountBalance() {
  const [wallet, setWallet] = useState(10000);

  const { data: trades = [] } = useQuery({
    queryKey: ["mock-ledger-trades"],
    queryFn: () => tradeService.getAllTrades(),
  });

  const positions = useMemo(
    () => trades.filter((trade) => trade.status === "OPEN"),
    [trades],
  );

  const { unrealizedPnl, usedMargin } = useMemo(() => {
    const unrealized = positions.reduce((sum, pos) => {
      return sum + parseFloat(pos.unrealized_pnl || 0);
    }, 0);

    const margin = positions.reduce((sum, pos) => {
      const collateral = parseFloat(pos.size || 0);
      return sum + (Number.isFinite(collateral) ? collateral : 0);
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
      throw new Error("Insufficient available margin");
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
