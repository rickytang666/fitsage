import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

// Create a singleton instance to prevent multiple client creations
let supabaseClientInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null;

/**
 * Create Supabase client for client components
 * This client can share sessions with server components and middleware
 * Uses singleton pattern to prevent multiple instances
 * Optimized to reduce unnecessary API calls
 */
export const createSupabaseClient = () => {
  if (!supabaseClientInstance) {
    supabaseClientInstance = createClientComponentClient<Database>();
    console.log('🔧 Supabase client created with optimized settings');
  }
  return supabaseClientInstance;
};
