import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Environment variables for Supabase connection
 * These should be defined in .env.local file:
 * NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are defined
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

/**
 * Create Supabase client with environment variables
 * This client can be imported and used throughout the application
 */
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  }
);

// Export common types
export type { Session } from '@supabase/supabase-js';

/**
 * Helper function to check if user is authenticated
 * @returns {Promise<boolean>} True if user is authenticated, false otherwise
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error checking authentication:', error.message);
    return false;
  }
  
  return !!data.session;
};

/**
 * Helper function to handle errors when using Supabase client
 * @param error Error object from Supabase operation
 * @param customMessage Optional custom error message
 * @returns The original error object for further handling
 */
export const handleSupabaseError = (error: any, customMessage = 'An error occurred with the database operation') => {
  console.error(customMessage, error);
  // You can implement additional error handling logic here
  // Such as logging to a service or displaying notifications
  return error;
};

/**
 * Export typed selectors for easier data access
 */
export const supabaseSelectors = {
  auth: supabase.auth,
  from: supabase.from,
  storage: supabase.storage,
};

/**
 * Example typed function using the Supabase client to get a user profile
 * @param userId The user ID to fetch the profile for
 * @returns Object containing data and error properties
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Failed to fetch user profile') };
  }
}
