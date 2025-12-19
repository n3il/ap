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
  sync: (userId: string, infoClient: any, mids: any) => Promise<void>;
}

export const useAccountStore = create<AccountStore>((set) => ({
  accounts: {},

  sync: async (userId, infoClient, mids) => {
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

      const processed = processHyperliquidData(history, state, mids);

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