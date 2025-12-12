import AgentDetailsChart from "@/components/chart/AgentDetailsChart";
import type { AgentType } from "@/types/agent";

export default function ChartsTab({ agent }: { agent: AgentType }) {
  return <AgentDetailsChart agent={agent} />;
}
