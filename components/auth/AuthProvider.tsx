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
  isSigningOut: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  signOut: () => Promise<void>;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isSigningOut: false,
  signIn: async () => ({ error: null, success: false }),
  signUp: async () => ({ error: null, success: false }),
  signOut: async () => {},
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
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

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
        
        // Don't update state if we're in the middle of signing out
        if (isSigningOut) return;
        
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
        
        if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
          const existingUserError = new Error('This email is already registered. Please try signing in instead.');
          return { error: existingUserError, success: false };
        }
        
        return { error, success: false };
      }

      // Check if user was created or if they already exist
      if (data.user && !data.user.email_confirmed_at && data.user.identities?.length === 0) {
        // User already exists - identities array is empty for existing users
        const existingUserError = new Error('An account with this email already exists. Please try signing in instead.');
        return { error: existingUserError, success: false };
      }

      console.log('✅ AuthProvider: Sign up successful, user:', data.user?.email);
      console.log('User confirmation status:', data.user?.email_confirmed_at);
      console.log('User identities:', data.user?.identities?.length);
      
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
      // Set signing out state to prevent UI updates
      setIsSigningOut(true);
      
      // Immediately redirect to avoid showing the current page without auth
      // This prevents the flash of unauthenticated content
      window.location.replace('/?signedOut=true');
      
      // Then clean up in the background
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
      
      // Clear any remaining session data
      setUser(null);
      setSession(null);
      
      // Forcefully clear all browser storage (especially for Chrome)
      try {
        // Clear localStorage
        localStorage.clear();
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear specific Supabase keys (in case localStorage.clear() doesn't work)
        const supabaseKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('supabase') || key.startsWith('sb-')
        );
        supabaseKeys.forEach(key => localStorage.removeItem(key));
        
        // Clear cookies - iterate through all cookies and remove Supabase-related ones
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.includes('supabase') || name.includes('sb-') || name.includes('auth')) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
            // For Chrome, also try with dot domain
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
          }
        });
        
        // Chrome-specific: Clear IndexedDB if available
        if (typeof window !== 'undefined' && /Chrome/.test(navigator.userAgent) && 'indexedDB' in window) {
          try {
            const databases = await indexedDB.databases();
            await Promise.all(databases.map(db => {
              if (db.name && db.name.includes('supabase')) {
                return new Promise((resolve, reject) => {
                  const deleteReq = indexedDB.deleteDatabase(db.name!);
                  deleteReq.onsuccess = () => resolve(void 0);
                  deleteReq.onerror = () => reject(deleteReq.error);
                });
              }
            }));
          } catch (idbError) {
            console.warn('Could not clear IndexedDB:', idbError);
          }
        }
        
        console.log('✅ All browser storage cleared');
      } catch (storageError) {
        console.error('Error clearing browser storage:', storageError);
      }
    } catch (error) {
      console.error('Error signing out:', error);
      // If there's an error, still try to redirect to clean up the UI
      window.location.replace('/?signedOut=true');
    }
  };

  // Auth context value
  const value = {
    user,
    session,
    isLoading,
    isSigningOut,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

