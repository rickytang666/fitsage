'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';

// Simplified auth context with minimal state
type AuthContextType = {
  isAuthenticated: boolean;
  email: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  signOut: () => void;
  resetPassword: (email: string) => Promise<{
    error: Error | null;
  }>;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  email: null,
  isLoading: true,
  signIn: async () => ({ error: null, success: false }),
  signUp: async () => ({ error: null, success: false }),
  signOut: () => {},
  resetPassword: async () => ({ error: null }),
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Local storage keys
const AUTH_KEY = 'fitsage_auth';
const EMAIL_KEY = 'fitsage_email';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state on component mount - only once
  useEffect(() => {
    // Check localStorage for auth state
    const storedAuth = localStorage.getItem(AUTH_KEY);
    const storedEmail = localStorage.getItem(EMAIL_KEY);
    
    if (storedAuth === 'true' && storedEmail) {
      setIsAuthenticated(true);
      setEmail(storedEmail);
    }
    
    // Always mark loading as complete
    setIsLoading(false);
  }, []);

  // Simplified sign in - verify credentials once and set localStorage
  const signIn = async (email: string, password: string) => {
    try {
      console.log(`Attempting to sign in with email: ${email}`);
      
      // Still use Supabase to verify credentials - but only once
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        return { error, success: false };
      }
      
      // Store auth state in localStorage
      localStorage.setItem(AUTH_KEY, 'true');
      localStorage.setItem(EMAIL_KEY, email);
      
      // Update state
      setIsAuthenticated(true);
      setEmail(email);
      
      return { error: null, success: true };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error: error as Error, success: false };
    }
  };

  // Simplified sign up and immediate login
  const signUp = async (email: string, password: string) => {
    try {
      // Sign up with auto-confirm enabled
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            signupSource: 'web',
          }
        }
      });

      if (error) {
        return { error, success: false };
      }

      // Store auth state in localStorage
      localStorage.setItem(AUTH_KEY, 'true');
      localStorage.setItem(EMAIL_KEY, email);
      
      // Update state
      setIsAuthenticated(true);
      setEmail(email);
      
      return { error: null, success: true };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error: error as Error, success: false };
    }
  };

  // Simplified sign out - just clear localStorage
  const signOut = () => {
    // Remove auth state from localStorage
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(EMAIL_KEY);
    
    // Update state
    setIsAuthenticated(false);
    setEmail(null);
    
    // Optionally notify Supabase (but don't wait for response)
    supabase.auth.signOut().catch(error => {
      console.error('Error notifying Supabase of signout:', error);
    });
    
    // Force reload to clear any cached state
    window.location.href = '/auth/login';
  };

  // Reset password (sends password reset email)
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      });
      
      return { error };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { error: error as Error };
    }
  };

  // Auth context value
  const value = {
    isAuthenticated,
    email,
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

