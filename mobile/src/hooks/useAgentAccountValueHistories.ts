import { useEffect, useMemo, useState } from "react";
import { calcPnLByTimeframe } from "@/hooks/useAccountBalance";
import { useHyperliquidRequests } from "@/hooks/useHyperliquid";
import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";

type HistoryPoint = {
  timestamp: number;
  value: number;
};

type HistorySeriesMap = Record<string, HistoryPoint[]>;

type AgentHistoryState = {
  histories: HistorySeriesMap;
  accountValueHistory: ReturnType<typeof calcPnLByTimeframe>;
  totalPnl: number | null;
  totalPnlPercent: number | null;
  isLoading: boolean;
};

const createEmptyHistoryState = (): AgentHistoryState => ({
  histories: {},
  accountValueHistory: {},
  totalPnl: null,
  totalPnlPercent: null,
  isLoading: true,
});

const normalizeSeries = (
  series?: Array<[number | string, number | string]>,
): HistoryPoint[] => {
  if (!Array.isArray(series)) return [];

  return series
    .map((entry) => {
      if (!Array.isArray(entry) || entry.length < 2) return null;
      const [timestampRaw, valueRaw] = entry;
      const timestamp = Number(timestampRaw);
      const value = Number(valueRaw);

      if (!Number.isFinite(timestamp) || !Number.isFinite(value)) return null;
      return { timestamp, value };
    })
    .filter(
      (point): point is HistoryPoint =>
        point !== null && Number.isFinite(point.timestamp),
    );
};

const deriveTotals = (histories: HistorySeriesMap) => {
  const allSeries = Object.values(histories).filter(
    (series) => Array.isArray(series) && series.length > 1,
  );

  if (allSeries.length === 0) {
    return { totalPnl: null, totalPnlPercent: null };
  }

  const primarySeries = allSeries[0];
  const firstValue = primarySeries[0]?.value;
  const lastValue = primarySeries[primarySeries.length - 1]?.value;

  if (
    !Number.isFinite(firstValue) ||
    !Number.isFinite(lastValue) ||
    firstValue == null ||
    lastValue == null
  ) {
    return { totalPnl: null, totalPnlPercent: null };
  }

  const totalPnl = lastValue - firstValue;
  const totalPnlPercent =
    firstValue !== 0 ? (totalPnl / firstValue) * 100 : null;

  return { totalPnl, totalPnlPercent };
};

export function useAgentAccountValueHistories() {
  const agents = useExploreAgentsStore((state) => state.agents);
  const { sendRequest } = useHyperliquidRequests();
  const [histories, setHistories] = useState<Record<string, AgentHistoryState>>(
    {},
  );

  const agentAddresses = useMemo(() => {
    return agents.reduce<Record<string, string>>((acc, agent) => {
      const tradingAccountType = agent.simulate ? "paper" : "real";
      const tradingAccount = agent.trading_accounts?.find(
        (ta) => ta.type === tradingAccountType,
      );
      const address = tradingAccount?.hyperliquid_address;
      if (address) {
        acc[agent.id] = address;
      }
      return acc;
    }, {});
  }, [agents]);

  const addressToAgents = useMemo(() => {
    return Object.entries(agentAddresses).reduce<Record<string, string[]>>(
      (acc, [agentId, address]) => {
        if (!address) return acc;
        if (!acc[address]) {
          acc[address] = [];
        }
        acc[address].push(agentId);
        return acc;
      },
      {},
    );
  }, [agentAddresses]);

  useEffect(() => {
    setHistories((prev) => {
      const next: Record<string, AgentHistoryState> = {};
      Object.keys(agentAddresses).forEach((agentId) => {
        next[agentId] = prev[agentId] ?? createEmptyHistoryState();
      });
      return next;
    });
  }, [agentAddresses]);

  useEffect(() => {
    let isCancelled = false;

    const entries = Object.entries(addressToAgents);
    if (entries.length === 0) {
      setHistories({});
      return () => {
        isCancelled = true;
      };
    }

    entries.forEach(([address, agentIds]) => {
      if (!address || agentIds.length === 0) return;

      agentIds.forEach((agentId) => {
        setHistories((prev) => ({
          ...prev,
          [agentId]: prev[agentId] ?? createEmptyHistoryState(),
        }));
      });

      (async () => {
        try {
          const response = await sendRequest({
            type: "info",
            payload: { type: "portfolio", user: address },
          });
          if (isCancelled) return;

          const payloadData: Array<[string, any]> =
            response?.payload?.data ?? [];
          const accountValueHistory = calcPnLByTimeframe(payloadData);
          const seriesMap: HistorySeriesMap = payloadData.reduce(
            (acc, [timeframeKey, summary]) => {
              acc[timeframeKey] = normalizeSeries(
                summary?.accountValueHistory ?? [],
              );
              return acc;
            },
            {} as HistorySeriesMap,
          );

          const { totalPnl, totalPnlPercent } = deriveTotals(seriesMap);

          agentIds.forEach((agentId) => {
            setHistories((prev) => ({
              ...prev,
              [agentId]: {
                histories: seriesMap,
                accountValueHistory,
                totalPnl,
                totalPnlPercent,
                isLoading: false,
              },
            }));
          });
        } catch (error) {
          if (isCancelled) return;
          agentIds.forEach((agentId) => {
            setHistories((prev) => ({
              ...prev,
              [agentId]: {
                ...(prev[agentId] ?? createEmptyHistoryState()),
                isLoading: false,
              },
            }));
          });
        }
      })();
    });

    return () => {
      isCancelled = true;
    };
  }, [addressToAgents, sendRequest]);

  const isLoading = useMemo(() => {
    return Object.keys(agentAddresses).some((agentId) => {
      const state = histories[agentId];
      return !state || state.isLoading;
    });
  }, [agentAddresses, histories]);

  return {
    histories,
    isLoading: false,
  };
}
