import { create } from "zustand";
import type { AgentType } from "@/types/agent";

type ViewMode = "list" | "table";

interface ExploreAgentsState {
  // The current list of agents based on selected tab
  agents: AgentType[];
  // Set the agents list (called from AgentList when data changes)
  setAgents: (agents: AgentType[]) => void;

  // Clear the agents list
  clearAgents: () => void;

  // Track which agent is active per query key for shared UI like charts
  activeAgentsByQueryKey: Record<string, string>;
  setActiveAgentForQueryKey: (queryKey: string, agentId: string) => void;
  clearActiveAgentForQueryKey: (queryKey: string) => void;

  viewMode: ViewMode;
  setViewMode: (viewMode: ViewMode) => void;
}

/**
 * Store for managing the currently displayed agents in the Explore tab
 * This allows the SvgChart to access the agents based on which tab is selected
 * (Top, Popular, or New)
 */
export const useExploreAgentsStore = create<ExploreAgentsState>((set, get) => ({
  // The current list of agents based on selected tab
  agents: [],
  // Set the agents list (called from AgentList when data changes)
  setAgents: (agents) => set({ agents }),

  // Clear the agents list
  clearAgents: () => set({ agents: [] }),

  // Track which agent is active per query key for shared UI like charts
  activeAgentsByQueryKey: {},
  setActiveAgentForQueryKey: (queryKey, agentId) =>
    set((state) => ({
      activeAgentsByQueryKey: {
        ...state.activeAgentsByQueryKey,
        [queryKey]: agentId,
      },
    })),
  clearActiveAgentForQueryKey: (queryKey) => {
    const { [queryKey]: _removed, ...rest } = get().activeAgentsByQueryKey;
    set({ activeAgentsByQueryKey: rest });
  },

  viewMode: "list",
  setViewMode: (viewMode) => set({ viewMode }),
}));
