import { create } from 'zustand';
import { processHyperliquidData, computeLivePnL, type ProcessedHyperliquidData } from '@/data/utils/hyperliquid';
import { useShallow } from 'zustand/shallow';

interface AccountEntry {
  data: ProcessedHyperliquidData | null;
  isLoading: boolean;
  error: string | null;
}

interface AccountStore {
  // Store multiple accounts keyed by userId
  accounts: Record<string, AccountEntry>;

  // Action to fetch and process data
  initialize: (userId: string, infoClient: any) => Promise<void>;
  sync: (userId: string, mids: Record<string, string | number>) => void;
}

export const useAccountStore = create<AccountStore>((set, get) => ({
  accounts: {},

  initialize: async (userId, infoClient) => {
    // Check if initialization is already in progress or completed successfully
    const current = get().accounts[userId];
    if (current && !current.error && (current.isLoading || current.data)) return;

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
          [userId]: { ...state.accounts[userId], isLoading: false, error: "Error initializing" }
        }
      }));
    }
  },

  sync: (userId, mids) => {
    const account = get().accounts?.[userId];
    if (!account?.data || account.isLoading) return;

    const processed = computeLivePnL(account.data, mids);

    set((state) => ({
      accounts: {
        ...state.accounts,
        [userId]: { ...state.accounts[userId], data: processed }
      }
    }));
  }
}));

/**
 * Custom hook to select raw history for multiple addresses efficiently.
 * Only triggers re-render if the history objects themselves change.
 */
export function useAccountHistory(addresses: (string | undefined)[]) {
  const historyMap = useAccountStore(
    useShallow((state) => {
      const result: Record<string, Record<string, any[]>> = {};
      for (const addr of addresses) {
        if (!addr) continue;
        const history = state.accounts[addr]?.data?.rawHistory;
        if (history) {
          result[addr] = history;
        }
      }
      return result;
    })
  );

  return historyMap;
}