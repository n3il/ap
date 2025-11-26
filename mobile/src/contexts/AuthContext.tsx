import { makeRedirectUri } from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { createContext, useContext, useEffect, useState } from "react";
import { isRouteAccessible, ROUTES } from "@/config/routes";
import { supabase } from "@/config/supabase";

// import useRouteAuth from '@/hooks/useRouteAuth';
// import { useRouter } from 'expo-router';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // const router = useRouter();

  // useEffect(() => {
  //   console.log(router.pathname)
  //   if (!isRouteAccessible(router.pathname)) {
  //     return router.push(ROUTES.AUTH_INDEX.path);
  //   }
  // }, [router])

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
  }, []);

  const checkOnboardingStatus = async (userId) => {
    try {
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
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email, password, metadata = {}) => {
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
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setHasCompletedOnboarding(false);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = makeRedirectUri({ scheme: "ap" });

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
          let access_token, refresh_token;

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
      return { data: null, error };
    }
  };

  const signInWithApple = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: "ap://",
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signInWithPhone = async (phoneNumber) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const verifyPhoneCode = async (phoneNumber, token) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: token,
        type: "sms",
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signInWithEmailOtp = async (email) => {
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
      return { data: null, error };
    }
  };

  const verifyEmailOtp = async (email, token) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: token,
        type: "email",
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const completeOnboarding = async (profileData) => {
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
      return { error };
    }
  };

  const value = {
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
    signInWithPhone,
    verifyPhoneCode,
    signInWithEmailOtp,
    verifyEmailOtp,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
