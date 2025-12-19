import { createContext, useContext, useEffect, useState } from "react";
import { usePrivy } from "@privy-io/expo";
import { supabase } from "@/config/supabase";

interface SupabaseContextType {
  isReady: boolean;
  userId: string | null;
}

const SupabaseContext = createContext<SupabaseContextType>({
  isReady: false,
  userId: null,
});

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { user, isReady: privyReady, getAccessToken } = usePrivy();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function updateSupabaseAuth() {
      try {
        if (!privyReady) {
          setIsReady(false);
          return;
        }

        if (user) {
          // Get the Privy access token
          const token = await getAccessToken();

          if (token) {
            // Set the auth token on Supabase client
            await supabase.auth.setSession({
              access_token: token,
              refresh_token: "", // Privy handles refresh
            });
          }
        } else {
          // Clear session if no user
          await supabase.auth.signOut();
        }

        setIsReady(true);
      } catch (error) {
        console.error("Error setting Supabase auth:", error);
        setIsReady(true); // Still mark as ready even if there's an error
      }
    }

    updateSupabaseAuth();
  }, [user, privyReady, getAccessToken]);

  const contextValue: SupabaseContextType = {
    isReady,
    userId: user?.id || null,
  };

  return (
    <SupabaseContext.Provider value={contextValue}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabaseContext() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabaseContext must be used within SupabaseProvider");
  }
  return context;
}
