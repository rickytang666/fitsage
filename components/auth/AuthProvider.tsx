'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { createSupabaseClient } from '@/utils/supabase-client';

// Create Supabase client instance
const supabase = createSupabaseClient();

// Improved auth context with proper Supabase integration
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{
    error: Error | null;
  }>;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({ error: null, success: false }),
  signUp: async () => ({ error: null, success: false }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
});

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state and set up auth listener
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      
      setIsLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔑 AuthProvider: Attempting sign in with Supabase...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ AuthProvider: Sign in error:', error);
        
        // Handle specific error types without retry to prevent loops
        if (error.message?.includes('rate limit') || error.message?.includes('Request rate limit reached')) {
          const rateLimitError = new Error('Too many requests. Please wait a few minutes and try again.');
          return { error: rateLimitError, success: false };
        }
        
        if (error.message?.includes('Invalid login credentials')) {
          const credentialsError = new Error('Invalid email or password. Please check your credentials and try again.');
          return { error: credentialsError, success: false };
        }
        
        return { error, success: false };
      }
      
      console.log('✅ AuthProvider: Sign in successful, session:', data.session?.user?.email);
      
      // Session will be updated automatically by the auth state listener
      return { error: null, success: true };
    } catch (error) {
      console.error('💥 AuthProvider: Error signing in:', error);
      return { error: error as Error, success: false };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
          data: {
            signupSource: 'web',
          }
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        
        // Handle specific error types
        if (error.message?.includes('rate limit') || error.message?.includes('Request rate limit reached')) {
          const rateLimitError = new Error('Too many sign-up attempts. Please wait a moment and try again.');
          return { error: rateLimitError, success: false };
        }
        
        if (error.message?.includes('already registered')) {
          const existingUserError = new Error('This email is already registered. Please try signing in instead.');
          return { error: existingUserError, success: false };
        }
        
        return { error, success: false };
      }

      // For email confirmation flow, user needs to check email
      return { error: null, success: true };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error: error as Error, success: false };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
      
      // Clear any remaining session data
      setUser(null);
      setSession(null);
      
      // Wait a brief moment to ensure session is cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force navigation to intro page with a query parameter to bypass any caching
      window.location.href = '/?signedOut=true';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Reset password (sends password reset email)
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      });
      
      return { error };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { error: error as Error };
    }
  };

  // Auth context value
  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

