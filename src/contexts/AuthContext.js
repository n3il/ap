import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/config/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Check if user has completed onboarding
      if (session?.user) {
        checkOnboardingStatus(session.user.id);
      }

      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkOnboardingStatus(session.user.id);
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
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking onboarding status:', error);
        return;
      }

      setHasCompletedOnboarding(data?.onboarding_completed || false);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const signUp = async (email, password, metadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
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
      console.error('Error signing in:', error);
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
      console.error('Error signing out:', error);
      return { error };
    }
  };

  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { data: null, error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = makeRedirectUri({ scheme: 'ap' });

      console.log('🔗 Redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      console.log('📱 OAuth response:', { url: data?.url, error });

      if (error) throw error;

      if (data?.url) {
        console.log('🌐 Opening browser...');
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        console.log('✅ Browser result:', result);

        // Extract tokens from the result URL
        if (result.type === 'success' && result.url) {
          console.log('🔓 Extracting tokens from result...');

          // Parse tokens from URL hash
          const url = result.url;
          let access_token, refresh_token;

          if (url.includes('#')) {
            const hashPart = url.split('#')[1];
            const hashParams = new URLSearchParams(hashPart);
            access_token = hashParams.get('access_token');
            refresh_token = hashParams.get('refresh_token');
          }

          if (access_token && refresh_token) {
            console.log('✅ Tokens found, setting session...');
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (sessionError) {
              console.error('❌ Session error:', sessionError);
              throw sessionError;
            }

            console.log('✅ Session established successfully!');
            return { data: { session: true }, error: null };
          } else {
            console.log('⚠️  No tokens in result URL');
            return { data: null, error: new Error('No tokens received') };
          }
        }

        return { data: null, error: new Error('Browser session cancelled') };
      }

      return { data: null, error: new Error('No OAuth URL generated') };
    } catch (error) {
      console.error('❌ Error signing in with Google:', error);
      return { data: null, error };
    }
  };

  const signInWithApple = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'ap://',
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error signing in with Apple:', error);
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
      console.error('Error sending phone verification:', error);
      return { data: null, error };
    }
  };

  const verifyPhoneCode = async (phoneNumber, token) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: token,
        type: 'sms',
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error verifying phone code:', error);
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
      console.error('Error sending email OTP:', error);
      return { data: null, error };
    }
  };

  const verifyEmailOtp = async (email, token) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: token,
        type: 'email',
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error verifying email OTP:', error);
      return { data: null, error };
    }
  };

  const completeOnboarding = async (profileData) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profileData,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      console.log('Profile updated successfully');
      setHasCompletedOnboarding(true);
      return { error: null };
    } catch (error) {
      console.error('Error completing onboarding:', error);
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
