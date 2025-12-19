import { useEmbeddedEthereumWallet } from "@privy-io/expo";
import { createContext, useContext } from "react";
import type { Address } from "viem";

// Compatibility wrapper for Privy's embedded wallet
// This maintains the old WalletContext API for backwards compatibility
// while using Privy's embedded wallet under the hood

interface Wallet {
  address: Address;
  label: string;
  createdAt: string;
}

interface WalletContextType {
  wallets: Wallet[];
  selectedWallet: Wallet | null;
  isLoading: boolean;
  // Deprecated methods - wallets are now managed by Privy
  createWallet: (label: string) => Promise<Wallet>;
  importWallet: (privateKey: string, label: string) => Promise<Wallet>;
  deleteWallet: (address: Address) => Promise<void>;
  selectWallet: (address: Address) => void;
  getPrivateKey: (address: Address) => Promise<string | null>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { wallet, address, exportWallet, isLoading } = useEmbeddedEthereumWallet();

  // Create compatibility wallet object
  const compatibilityWallet: Wallet | null = wallet && address
    ? {
        address: address as Address,
        label: "Privy Embedded Wallet",
        createdAt: new Date().toISOString(),
      }
    : null;

  const wallets = compatibilityWallet ? [compatibilityWallet] : [];

  // Deprecated methods - show warnings
  const createWallet = async (label: string): Promise<Wallet> => {
    console.warn(
      "createWallet is deprecated. Privy creates embedded wallets automatically on login.",
    );
    if (compatibilityWallet) {
      return compatibilityWallet;
    }
    throw new Error("No embedded wallet available. Please log in first.");
  };

  const importWallet = async (
    privateKey: string,
    label: string,
  ): Promise<Wallet> => {
    console.warn(
      "importWallet is deprecated. Privy manages embedded wallets automatically.",
    );
    throw new Error("Wallet import not supported with Privy embedded wallets");
  };

  const deleteWallet = async (address: Address): Promise<void> => {
    console.warn(
      "deleteWallet is deprecated. Privy wallets cannot be deleted, only exported.",
    );
    throw new Error("Wallet deletion not supported with Privy embedded wallets");
  };

  const selectWallet = (address: Address): void => {
    console.warn(
      "selectWallet is deprecated. Privy provides a single embedded wallet per user.",
    );
  };

  const getPrivateKey = async (address: Address): Promise<string | null> => {
    console.warn(
      "getPrivateKey is deprecated. Use exportWallet from useEmbeddedEthereumWallet hook instead.",
    );
    try {
      return await exportWallet();
    } catch (error) {
      console.error("Failed to export wallet:", error);
      return null;
    }
  };

  const value: WalletContextType = {
    wallets,
    selectedWallet: compatibilityWallet,
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
