import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

// Supabase client with Privy authentication integration
// Auth sessions are managed by SupabaseProvider using Privy tokens
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Allow session management
    autoRefreshToken: false, // Privy handles token refresh
    detectSessionInUrl: false,
    storage: undefined, // Don't persist to storage, managed in memory
  },
});
