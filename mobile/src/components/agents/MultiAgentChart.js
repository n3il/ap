import { useExploreAgentsStore } from "@/stores/useExploreAgentsStore";
import { useMultiAgentSnapshots } from "@/hooks/useAgentSnapshots";
import SvgChart from "@/components/SvgChart";
import { useMemo } from "react";

export default function MultiAgentChart({ timeframe }) {
  const agentIds = []; // useExploreAgentsStore((state) => state.agents.map(agent => agent.id));
  const { data } = useMultiAgentSnapshots(agentIds, timeframe);
  console.log('agentIds', agentIds);
  const agentChartData = useMemo(() => {
    console.log({ agentChartData })
    if (!data?.length || !agentIds?.length) return [];
    return data.map((snapshot) => ({
      time: snapshot.timestamp || snapshot.created_at,
      value: snapshot.equity || snapshot.value,
    }));
  }, [data, agentIds]);
  const chartData = useMemo(() => {
    console.log({ chartData })
    const lines = [];
    if (agentChartData.length > 0) {
      lines.push({
        id: 'Agent Equity',
        name: 'Agent Equity',
        data: agentChartData,
        axisGroup: 'right',
      });
    }
    return { lines };
  }, [agentChartData]);

  return (
    <SvgChart lines={chartData.lines} timeframe={timeframe} />
  )
}
