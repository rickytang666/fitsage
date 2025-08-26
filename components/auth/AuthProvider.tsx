"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { createSupabaseClient } from "@/utils/supabase-client";
import logger from "@/utils/logger";

// Create Supabase client instance INSIDE the provider to prevent multiple instances
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;
const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient();
  }
  return supabaseInstance;
};

// Improved auth context with proper Supabase integration
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isSigningOut: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

  // Get supabase client instance
  const supabase = getSupabaseClient();

  // Track initialization to prevent multiple getSession calls
  const initRef = useRef(false);

  // Client-side route protection since we removed middleware auth
  useEffect(() => {
    if (!isLoading && typeof window !== "undefined") {
      const path = window.location.pathname;
      const protectedPaths = ["/profile", "/workouts", "/diary"];
      const authPaths = ["/auth/login", "/auth/signup"];

      // Redirect to login if accessing protected path without session
      if (!session && protectedPaths.includes(path)) {
        window.location.href = "/auth/login";
        return;
      }

      // Redirect to profile if accessing auth pages with session
      if (session && authPaths.includes(path)) {
        window.location.href = "/profile";
        return;
      }

      // Redirect to profile if on root with session
      if (
        session &&
        path === "/" &&
        !window.location.search.includes("signedOut=true")
      ) {
        window.location.href = "/profile";
        return;
      }
    }
  }, [session, isLoading]);

  // Initialize auth state and set up auth listener
  useEffect(() => {
    let mounted = true;

    // Prevent multiple initializations
    if (initRef.current) return;
    initRef.current = true;

    // Get initial session ONLY ONCE with minimal API usage
    const getInitialSession = async () => {
      logger.auth("Getting initial session (once only)...");

      try {
        // Longer delay to prevent any rapid calls during app startup
        await new Promise((resolve) => setTimeout(resolve, 300));

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return; // Prevent state updates if component unmounted

        if (error && !error.message?.includes("refresh_token_not_found")) {
          // Only log actual errors, not expected refresh token issues
          logger.error("Error getting session:", error);
        }

        // Set session state regardless of error (null is valid)
        logger.auth(
          "Initial session check complete:",
          session?.user?.email || "No active session"
        );
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        logger.error("Session initialization error:", error);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Only get session on first load, not on every render
    getInitialSession();

    // Listen for auth changes - but ONLY for actual auth events, not all state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        if (!mounted) return; // Prevent state updates if component unmounted

        logger.auth("Auth event received:", event);

        // Only respond to these specific events to reduce unnecessary updates
        if (["SIGNED_IN", "SIGNED_OUT"].includes(event)) {
          logger.auth(
            "Processing auth state change:",
            event,
            session?.user?.email || "No session"
          );

          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);

          // 🚀 Preload featured workouts cache on first login (background task)
          if (event === "SIGNED_IN" && session?.user?.id) {
            setTimeout(async () => {
              try {
                logger.debug(
                  "Background: Checking featured workouts cache for new session..."
                );

                // Dynamic import to avoid circular dependencies
                const { default: DatabaseService } = await import(
                  "@/services/DatabaseService"
                );

                const cachedResults =
                  await DatabaseService.getCachedFeaturedWorkouts(
                    session.user.id
                  );
                if (!cachedResults || !cachedResults.isValid) {
                  logger.debug(
                    "Background: No valid cache found, will populate on first WorkoutsPage visit"
                  );
                  // Don't pre-generate here, let WorkoutsPage handle it when user actually visits
                } else {
                  logger.debug(
                    "Background: Valid cache exists, ready for instant loading"
                  );
                }
              } catch (error) {
                logger.warn(
                  "Background cache check failed (non-critical):",
                  error
                );
              }
            }, 2000); // Wait 2 seconds after login to avoid interfering with main flow
          }
        }
        // Ignore TOKEN_REFRESHED and other events to reduce API calls
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]); // Depend on supabase instance (singleton) to satisfy exhaustive-deps

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    const supabase = getSupabaseClient(); // Get client instance

    try {
      logger.auth("Attempting sign in with Supabase...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error("AuthProvider: Sign in error:", error);

        // Handle specific error types without retry to prevent loops
        if (
          error.message?.includes("rate limit") ||
          error.message?.includes("Request rate limit reached")
        ) {
          const rateLimitError = new Error(
            "Too many requests. Please wait a few minutes and try again."
          );
          return { error: rateLimitError, success: false };
        }

        if (error.message?.includes("Invalid login credentials")) {
          const credentialsError = new Error(
            "Invalid email or password. Please check your credentials and try again."
          );
          return { error: credentialsError, success: false };
        }

        return { error, success: false };
      }

      logger.auth(
        "AuthProvider: Sign in successful, session:",
        data.session?.user?.email
      );

      // Session will be updated automatically by the auth state listener
      return { error: null, success: true };
    } catch (error) {
      logger.error("AuthProvider: Error signing in:", error);
      return { error: error as Error, success: false };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    const supabase = getSupabaseClient(); // Get client instance

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
          data: {
            signupSource: "web",
          },
        },
      });

      if (error) {
        logger.error("Sign up error:", error);

        // Handle specific error types
        if (
          error.message?.includes("rate limit") ||
          error.message?.includes("Request rate limit reached")
        ) {
          const rateLimitError = new Error(
            "Too many sign-up attempts. Please wait a moment and try again."
          );
          return { error: rateLimitError, success: false };
        }

        if (
          error.message?.includes("already registered") ||
          error.message?.includes("User already registered")
        ) {
          const existingUserError = new Error(
            "This email is already registered. Please try signing in instead."
          );
          return { error: existingUserError, success: false };
        }

        return { error, success: false };
      }

      // Check if user was created or if they already exist
      if (
        data.user &&
        !data.user.email_confirmed_at &&
        data.user.identities?.length === 0
      ) {
        // User already exists - identities array is empty for existing users
        const existingUserError = new Error(
          "An account with this email already exists. Please try signing in instead."
        );
        return { error: existingUserError, success: false };
      }

      logger.auth("AuthProvider: Sign up successful, user:", data.user?.email);
      logger.debug("User confirmation status:", data.user?.email_confirmed_at);
      logger.debug("User identities:", data.user?.identities?.length);

      // For email confirmation flow, user needs to check email
      return { error: null, success: true };
    } catch (error) {
      logger.error("Error signing up:", error);
      return { error: error as Error, success: false };
    }
  };

  // Sign out
  const signOut = async () => {
    const supabase = getSupabaseClient(); // Get client instance

    try {
      // Immediately redirect BEFORE any state changes or async operations
      // This prevents any UI flashing
      window.location.replace("/?signedOut=true");

      // Everything below happens after redirect is initiated
      // Set signing out state (though user won't see this due to immediate redirect)
      setIsSigningOut(true);

      // Clean up in the background after redirect
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error("Error signing out:", error);
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
        const supabaseKeys = Object.keys(localStorage).filter(
          (key) => key.startsWith("supabase") || key.startsWith("sb-")
        );
        supabaseKeys.forEach((key) => localStorage.removeItem(key));

        // Clear cookies - iterate through all cookies and remove Supabase-related ones
        document.cookie.split(";").forEach((cookie) => {
          const eqPos = cookie.indexOf("=");
          const name =
            eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (
            name.includes("supabase") ||
            name.includes("sb-") ||
            name.includes("auth")
          ) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
            // For Chrome, also try with dot domain
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
          }
        });

        // Chrome-specific: Clear IndexedDB if available
        if (
          typeof window !== "undefined" &&
          /Chrome/.test(navigator.userAgent) &&
          "indexedDB" in window
        ) {
          try {
            const databases = await indexedDB.databases();
            await Promise.all(
              databases.map((db) => {
                if (db.name && db.name.includes("supabase")) {
                  return new Promise((resolve, reject) => {
                    const deleteReq = indexedDB.deleteDatabase(db.name!);
                    deleteReq.onsuccess = () => resolve(void 0);
                    deleteReq.onerror = () => reject(deleteReq.error);
                  });
                }
              })
            );
          } catch (idbError) {
            console.warn("Could not clear IndexedDB:", idbError);
          }
        }

        logger.debug("All browser storage cleared");
      } catch (storageError) {
        logger.error("Error clearing browser storage:", storageError);
      }
    } catch (error) {
      logger.error("Error signing out:", error);
      // If there's an error, still try to redirect to clean up the UI
      window.location.replace("/?signedOut=true");
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
