import { create } from 'zustand';

/**
 * Store for managing the currently displayed agents in the Explore tab
 * This allows the SvgChart to access the agents based on which tab is selected
 * (Top, Popular, or New)
 */
export const useExploreAgentsStore = create((set) => ({
  // The current list of agents based on selected tab
  agents: [],

  // Set the agents list (called from AgentList when data changes)
  setAgents: (agents) => set({ agents }),

  // Clear the agents list
  clearAgents: () => set({ agents: [] }),
}));
