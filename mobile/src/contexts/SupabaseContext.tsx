import { createContext, useContext, useEffect, useState } from "react";
import { usePrivy } from "@privy-io/expo";
import { supabase } from "@/config/supabase";
import Constants from "expo-constants";

interface SupabaseContextType {
  isReady: boolean;
  userId: string | null;
}

const SupabaseContext = createContext<SupabaseContextType>({
  isReady: false,
  userId: null,
});

const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl;

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { user, isReady: privyReady, getAccessToken } = usePrivy();
  const [isReady, setIsReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function updateSupabaseAuth() {
      try {
        if (!privyReady) {
          setIsReady(false);
          return;
        }

        if (user) {
          // Get the Privy access token
          const privyToken = await getAccessToken();

          if (privyToken) {
            // Call our edge function to sync Privy user with Supabase
            const response = await fetch(`${SUPABASE_URL}/functions/v1/privy_auth`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${privyToken}`,
                "Content-Type": "application/json",
              },
            });

            if (!response.ok) {
              console.log("Error setting Supabase auth", response.status, response.statusText);
              console.log(response)
            }

            const { session, user: profileUser } = await response.json();

            if (session) {
              // Set the Supabase session
              await supabase.auth.setSession({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
              });

              setUserId(profileUser.id);
            }
          }
        } else {
          // Clear session if no user
          await supabase.auth.signOut();
          setUserId(null);
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
    userId,
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
