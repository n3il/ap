import * as AppleAuthentication from "expo-apple-authentication";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/config/supabase";

// Re-export commonly used types from Supabase
export type { User, Session, AuthError } from "@supabase/supabase-js";

// Type definitions
export interface ProfileData {
  id?: string;
  full_name?: string;
  phone?: string;
  email?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  [key: string]: any;
}

export interface AuthResponse<T = any> {
  data: T | null;
  error: AuthError | Error | null;
}

export interface OAuthSessionResponse {
  data: { session: boolean } | null;
  error: AuthError | Error | null;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  hasCompletedOnboarding: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: AuthError | Error | null }>;
  resetPassword: (email: string) => Promise<AuthResponse>;
  signInWithGoogle: () => Promise<OAuthSessionResponse>;
  signInWithApple: () => Promise<OAuthSessionResponse>;
  signInWithAppleNative: () => Promise<AuthResponse>;
  signInWithPhone: (phoneNumber: string) => Promise<AuthResponse>;
  verifyPhoneCode: (phoneNumber: string, token: string) => Promise<AuthResponse>;
  signInWithEmailOtp: (email: string) => Promise<AuthResponse>;
  verifyEmailOtp: (email: string, token: string) => Promise<AuthResponse>;
  completeOnboarding: (profileData: ProfileData) => Promise<{ error: AuthError | Error | null }>;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const redirectUrl = makeRedirectUri({ scheme: process.env.EXPO_PUBLIC_REDIRECT_URL });

  const checkOnboardingStatus = useCallback(async (userId: string): Promise<void> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      return;
    }

    const onboardingCompleted = data?.onboarding_completed || false;
    setHasCompletedOnboarding(onboardingCompleted);

    // Sync to user metadata for future sessions
    await supabase.auth.updateUser({
      data: { onboarding_completed: onboardingCompleted },
    });
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Check onboarding status from user metadata or fallback to database query
      if (session?.user) {
        const onboardingFromMetadata =
          session.user.user_metadata?.onboarding_completed;
        if (onboardingFromMetadata !== undefined) {
          setHasCompletedOnboarding(onboardingFromMetadata);
          setLoading(false);
        } else {
          // Fallback: query profiles table and sync to metadata
          checkOnboardingStatus(session.user.id).finally(() =>
            setLoading(false),
          );
        }
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const onboardingFromMetadata =
          session.user.user_metadata?.onboarding_completed;
        if (onboardingFromMetadata !== undefined) {
          setHasCompletedOnboarding(onboardingFromMetadata);
        } else {
          // Fallback: query profiles table
          checkOnboardingStatus(session.user.id);
        }
      } else {
        setHasCompletedOnboarding(false);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkOnboardingStatus]);

  const signUp = async (email: string, password: string, metadata: Record<string, any> = {}): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...metadata,
            onboarding_completed: false,
          },
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as AuthError | Error };
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as AuthError | Error };
    }
  };

  const signOut = async (): Promise<{ error: AuthError | Error | null }> => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as AuthError | Error };
    }
  };

  const resetPassword = async (email: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as AuthError | Error };
    }
  };

  const signInWithGoogle = async (): Promise<OAuthSessionResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl,
        );

        // Extract tokens from the result URL
        if (result.type === "success" && result.url) {
          // Parse tokens from URL hash
          const url = result.url;
          let access_token: string | null = null;
          let refresh_token: string | null = null;

          if (url.includes("#")) {
            const hashPart = url.split("#")[1];
            const hashParams = new URLSearchParams(hashPart);
            access_token = hashParams.get("access_token");
            refresh_token = hashParams.get("refresh_token");
          }

          if (access_token && refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (sessionError) {
              throw sessionError;
            }

            return { data: { session: true }, error: null };
          } else {
            return { data: null, error: new Error("No tokens received") };
          }
        }

        return { data: null, error: new Error("Browser session cancelled") };
      }

      return { data: null, error: new Error("No OAuth URL generated") };
    } catch (error) {
      return { data: null, error: error as AuthError | Error };
    }
  };

  const signInWithApple = async (): Promise<OAuthSessionResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No OAuth URL generated");

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl,
      );

      if (result.type !== "success" || !result.url)
        return { data: null, error: new Error("Browser session cancelled") };

      const url = result.url;
      let access_token: string | null = null;
      let refresh_token: string | null = null;

      if (url.includes("#")) {
        const hash = url.split("#")[1];
        const params = new URLSearchParams(hash);
        access_token = params.get("access_token");
        refresh_token = params.get("refresh_token");
      }

      if (!access_token || !refresh_token)
        return { data: null, error: new Error("No tokens received") };

      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (sessionError) throw sessionError;
      return { data: { session: true }, error: null };
    } catch (error) {
      return { data: null, error: error as AuthError | Error };
    }
  };

  const signInWithAppleNative = async (): Promise<AuthResponse> => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      // Sign in via Supabase Auth.
      if (credential.identityToken) {
        const { error, data } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: credential.identityToken,
        });
        if (!error) {
          // Apple only provides the user's full name on the first sign-in
          // Save it to user metadata if available
          if (credential.fullName) {
            const nameParts: string[] = [];
            if (credential.fullName.givenName)
              nameParts.push(credential.fullName.givenName);
            if (credential.fullName.middleName)
              nameParts.push(credential.fullName.middleName);
            if (credential.fullName.familyName)
              nameParts.push(credential.fullName.familyName);
            const fullName = nameParts.join(" ");
            await supabase.auth.updateUser({
              data: {
                full_name: fullName,
                given_name: credential.fullName.givenName,
                family_name: credential.fullName.familyName,
              },
            });
          }
          return { data, error };
        }
      } else {
        throw new Error("No identityToken.");
      }
    } catch (error) {
      // if (error.code === 'ERR_REQUEST_CANCELED') {
      // return { data: null, error };
      // } else {
      return { data: null, error: error as AuthError | Error };
      // }
    }
  };

  const signInWithPhone = async (phoneNumber: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as AuthError | Error };
    }
  };

  const verifyPhoneCode = async (phoneNumber: string, token: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: token,
        type: "sms",
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as AuthError | Error };
    }
  };

  const signInWithEmailOtp = async (email: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as AuthError | Error };
    }
  };

  const verifyEmailOtp = async (email: string, token: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: token,
        type: "email",
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as AuthError | Error };
    }
  };

  const completeOnboarding = async (profileData: ProfileData): Promise<{ error: AuthError | Error | null }> => {
    try {
      if (!user) throw new Error("No user logged in");

      // Update profiles table
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        ...profileData,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      // Update user metadata to sync with session
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { onboarding_completed: true },
      });

      if (metadataError) throw metadataError;

      setHasCompletedOnboarding(true);
      return { error: null };
    } catch (error) {
      return { error: error as AuthError | Error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    hasCompletedOnboarding,
    signUp,
    signIn,
    signOut,
    resetPassword,
    signInWithGoogle,
    signInWithApple,
    signInWithAppleNative,
    signInWithPhone,
    verifyPhoneCode,
    signInWithEmailOtp,
    verifyEmailOtp,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
