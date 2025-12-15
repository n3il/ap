import 'react-native-get-random-values';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Address } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

interface Wallet {
  address: Address;
  label: string;
  createdAt: string;
}

interface WalletContextType {
  wallets: Wallet[];
  selectedWallet: Wallet | null;
  isLoading: boolean;
  createWallet: (label: string) => Promise<Wallet>;
  importWallet: (privateKey: string, label: string) => Promise<Wallet>;
  deleteWallet: (address: Address) => Promise<void>;
  selectWallet: (address: Address) => void;
  getPrivateKey: (address: Address) => Promise<string | null>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const WALLETS_STORAGE_KEY = "wallets";
const SELECTED_WALLET_KEY = "selected_wallet";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load wallets from storage
  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      setIsLoading(true);
      const walletsJson = await AsyncStorage.getItem(WALLETS_STORAGE_KEY);
      const selectedAddress = await AsyncStorage.getItem(SELECTED_WALLET_KEY);

      if (walletsJson) {
        const loadedWallets = JSON.parse(walletsJson);
        setWallets(loadedWallets);

        if (selectedAddress) {
          const selected = loadedWallets.find(
            (w: Wallet) => w.address === selectedAddress,
          );
          setSelectedWallet(selected || null);
        } else if (loadedWallets.length > 0) {
          setSelectedWallet(loadedWallets[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load wallets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveWallets = async (newWallets: Wallet[]) => {
    try {
      await AsyncStorage.setItem(WALLETS_STORAGE_KEY, JSON.stringify(newWallets));
      setWallets(newWallets);
    } catch (error) {
      console.error("Failed to save wallets:", error);
      throw new Error("Failed to save wallet");
    }
  };

  const createWallet = useCallback(
    async (label: string): Promise<Wallet> => {
      try {
        // Generate a new private key
        const privateKey = generatePrivateKey();
        const account = privateKeyToAccount(privateKey);

        // Store private key securely
        await SecureStore.setItemAsync(
          `wallet_pk_${account.address}`,
          privateKey,
        );

        // Create wallet object
        const newWallet: Wallet = {
          address: account.address,
          label,
          createdAt: new Date().toISOString(),
        };

        // Save to storage
        const updatedWallets = [...wallets, newWallet];
        await saveWallets(updatedWallets);

        // Set as selected if it's the first wallet
        if (wallets.length === 0) {
          setSelectedWallet(newWallet);
          await AsyncStorage.setItem(SELECTED_WALLET_KEY, newWallet.address);
        }

        return newWallet;
      } catch (error) {
        console.error("Failed to create wallet:", error);
        throw new Error("Failed to create wallet");
      }
    },
    [wallets],
  );

  const importWallet = useCallback(
    async (privateKey: string, label: string): Promise<Wallet> => {
      try {
        // Ensure private key has 0x prefix
        const normalizedKey = privateKey.startsWith("0x")
          ? privateKey
          : `0x${privateKey}`;

        const account = privateKeyToAccount(normalizedKey as `0x${string}`);

        // Check if wallet already exists
        if (wallets.some((w) => w.address === account.address)) {
          throw new Error("Wallet already exists");
        }

        // Store private key securely
        await SecureStore.setItemAsync(
          `wallet_pk_${account.address}`,
          normalizedKey,
        );

        // Create wallet object
        const newWallet: Wallet = {
          address: account.address,
          label,
          createdAt: new Date().toISOString(),
        };

        // Save to storage
        const updatedWallets = [...wallets, newWallet];
        await saveWallets(updatedWallets);

        // Set as selected if it's the first wallet
        if (wallets.length === 0) {
          setSelectedWallet(newWallet);
          await AsyncStorage.setItem(SELECTED_WALLET_KEY, newWallet.address);
        }

        return newWallet;
      } catch (error) {
        console.error("Failed to import wallet:", error);
        throw new Error("Failed to import wallet");
      }
    },
    [wallets],
  );

  const deleteWallet = useCallback(
    async (address: Address) => {
      try {
        // Delete private key from secure storage
        await SecureStore.deleteItemAsync(`wallet_pk_${address}`);

        // Remove from wallets list
        const updatedWallets = wallets.filter((w) => w.address !== address);
        await saveWallets(updatedWallets);

        // Update selected wallet if needed
        if (selectedWallet?.address === address) {
          const newSelected = updatedWallets[0] || null;
          setSelectedWallet(newSelected);
          if (newSelected) {
            await AsyncStorage.setItem(SELECTED_WALLET_KEY, newSelected.address);
          } else {
            await AsyncStorage.removeItem(SELECTED_WALLET_KEY);
          }
        }
      } catch (error) {
        console.error("Failed to delete wallet:", error);
        throw new Error("Failed to delete wallet");
      }
    },
    [wallets, selectedWallet],
  );

  const selectWallet = useCallback(async (address: Address) => {
    const wallet = wallets.find((w) => w.address === address);
    if (wallet) {
      setSelectedWallet(wallet);
      await AsyncStorage.setItem(SELECTED_WALLET_KEY, address);
    }
  }, [wallets]);

  const getPrivateKey = useCallback(async (address: Address) => {
    try {
      return await SecureStore.getItemAsync(`wallet_pk_${address}`);
    } catch (error) {
      console.error("Failed to get private key:", error);
      return null;
    }
  }, []);

  const value: WalletContextType = {
    wallets,
    selectedWallet,
    isLoading,
    createWallet,
    importWallet,
    deleteWallet,
    selectWallet,
    getPrivateKey,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
