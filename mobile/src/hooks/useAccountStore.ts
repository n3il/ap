import { create } from 'zustand';
import { processHyperliquidData } from '@/data/utils/hyperliquid';

interface AccountEntry {
  data: ReturnType<typeof processHyperliquidData> | null;
  isLoading: boolean;
  error: string | null;
}

interface AccountStore {
  // Store multiple accounts keyed by userId
  accounts: Record<string, AccountEntry>;

  // Action to fetch and process data
  initialize: (userId: string, infoClient: any) => Promise<void>;
  sync: (userId: string, mids: any) => Promise<void>;
}

export const useAccountStore = create<AccountStore>((set, get) => ({
  accounts: {},

  initialize: async (userId, infoClient) => {
    // Check if initialization is already in progress or completed successfully
    const current = get().accounts[userId];
    if (current && !current.error) return;

    // Set loading state for this specific user
    set((state) => ({
      accounts: {
        ...state.accounts,
        [userId]: { ...state.accounts[userId], isLoading: true, error: null }
      }
    }));

    try {
      const [history, state] = await Promise.all([
        infoClient.portfolio({ user: userId }),
        infoClient.clearinghouseState({ user: userId })
      ]);
      const processed = processHyperliquidData(history, state, {});

      set((state) => ({
        accounts: {
          ...state.accounts,
          [userId]: { data: processed, isLoading: false, error: null }
        }
      }));
    } catch (err) {
      set((state) => ({
        accounts: {
          ...state.accounts,
          [userId]: { ...state.accounts[userId], isLoading: false, error: "Initialize failed" }
        }
      }));
    }
  },

  sync: async (userId, mids) => {
    try {
      const {
        data,
        isLoading,
      } = get().accounts?.[userId] || {};
      if (isLoading || !data?.historyDataSnapshot || !data?.chDataSnapshot) return;

      const { historyDataSnapshot, chDataSnapshot } = data;

      const processed = processHyperliquidData(historyDataSnapshot, chDataSnapshot, mids);

      set((state) => ({
        accounts: {
          ...state.accounts,
          [userId]: { data: processed, isLoading: false, error: null }
        }
      }));
    } catch (err) {
      set((state) => ({
        accounts: {
          ...state.accounts,
          [userId]: { ...state.accounts[userId], isLoading: false, error: "Sync failed" }
        }
      }));
    }
  }
}));