import type { PrivyEmbeddedWalletProvider } from "@privy-io/expo";
import { useEmbeddedEthereumWallet, usePrivy } from "@privy-io/expo";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/config/supabase";

// Type definitions (maintain compatibility with existing code)
export interface ProfileData {
  id?: string;
  full_name?: string;
  phone?: string;
  email?: string;
  username?: string;
  avatar_url?: string;
  photo?: string;
  bio?: string;
  [key: string]: any;
}

export interface AuthResponse<T = any> {
  data: T | null;
  error: Error | null;
}

export interface OAuthSessionResponse {
  data: { session: boolean } | null;
  error: Error | null;
}

export interface AuthContextType {
  // User state (Privy-based)
  user: any | null;
  session: any | null; // Kept for compatibility
  privyUserId: string | null;
  loading: boolean;
  hasCompletedOnboarding: boolean;
  isReady: boolean;

  // Auth methods
  signInWithEmailOtp: (email: string) => Promise<AuthResponse>;
  signInWithPhone: (phoneNumber: string) => Promise<AuthResponse>;
  signInWithGoogle: () => Promise<OAuthSessionResponse>;
  signInWithApple: () => Promise<OAuthSessionResponse>;
  signInWithWallet: () => Promise<AuthResponse>;
  signOut: () => Promise<{ error: Error | null }>;

  // Onboarding
  completeOnboarding: (
    profileData: ProfileData,
  ) => Promise<{ error: Error | null }>;

  // Embedded wallet access
  embeddedWallet: PrivyEmbeddedWalletProvider | null;
  walletAddress: string | null;

  // Deprecated methods (for compatibility - will show warnings)
  signUp?: (
    email: string,
    password: string,
    metadata?: Record<string, any>,
  ) => Promise<AuthResponse>;
  signIn?: (email: string, password: string) => Promise<AuthResponse>;
  resetPassword?: (email: string) => Promise<AuthResponse>;
  signInWithAppleNative?: () => Promise<AuthResponse>;
  verifyPhoneCode?: (phoneNumber: string, token: string) => Promise<AuthResponse>;
  verifyEmailOtp?: (email: string, token: string) => Promise<AuthResponse>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Privy hooks
  const {
    user: privyUser,
    isReady,
    login,
    logout,
  } = usePrivy();

  const { wallet: embeddedWallet, address: walletAddress } =
    useEmbeddedEthereumWallet();

  // Local state
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Derive user ID
  const privyUserId = privyUser?.id || null;

  // Create a session-like object for compatibility
  const session = privyUser ? { user: privyUser } : null;

  // Check onboarding status from Privy metadata or Supabase
  const checkOnboardingStatus = useCallback(
    async (userId: string) => {
      try {
        // First check Privy user metadata
        const metadata = (privyUser as any)?.customMetadata;
        if (metadata?.onboarding_completed !== undefined) {
          setHasCompletedOnboarding(metadata.onboarding_completed);
          return;
        }

        // Fallback: check Supabase profiles table
        const { data, error } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("privy_user_id", userId)
          .single();

        if (!error && data) {
          setHasCompletedOnboarding(data.onboarding_completed || false);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      }
    },
    [privyUser],
  );

  // Monitor Privy user state
  useEffect(() => {
    if (!isReady) {
      setLoading(true);
      return;
    }

    if (privyUser) {
      checkOnboardingStatus(privyUser.id).finally(() => setLoading(false));
    } else {
      setHasCompletedOnboarding(false);
      setLoading(false);
    }
  }, [isReady, privyUser, checkOnboardingStatus]);

  // Auth methods implementation
  const signInWithEmailOtp = async (email: string): Promise<AuthResponse> => {
    try {
      await login({ email });
      return { data: true, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const signInWithPhone = async (
    phoneNumber: string,
  ): Promise<AuthResponse> => {
    try {
      await login({ phoneNumber });
      return { data: true, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const signInWithGoogle = async (): Promise<OAuthSessionResponse> => {
    try {
      await login({ google: {} });
      return { data: { session: true }, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const signInWithApple = async (): Promise<OAuthSessionResponse> => {
    try {
      await login({ apple: {} });
      return { data: { session: true }, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const signInWithWallet = async (): Promise<AuthResponse> => {
    try {
      await login({ wallet: {} });
      return { data: true, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const signOut = async (): Promise<{ error: Error | null }> => {
    try {
      await logout();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const completeOnboarding = async (
    profileData: ProfileData,
  ): Promise<{ error: Error | null }> => {
    try {
      if (!privyUser) throw new Error("No user logged in");

      // Update Supabase profiles table
      const { error: profileError } = await supabase.from("profiles").upsert({
        privy_user_id: privyUser.id,
        ...profileData,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      // Note: Privy custom metadata update would go here if supported in Expo SDK
      // For now, rely on Supabase as source of truth

      setHasCompletedOnboarding(true);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };


  const value: AuthContextType = {
    user: privyUser,
    session,
    privyUserId,
    loading,
    hasCompletedOnboarding,
    isReady,
    signInWithEmailOtp,
    signInWithPhone,
    signInWithGoogle,
    signInWithApple,
    signInWithWallet,
    signOut,
    completeOnboarding,
    embeddedWallet,
    walletAddress,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
