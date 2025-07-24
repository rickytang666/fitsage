import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

// Create a singleton instance to prevent multiple client creations
let supabaseClientInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null;

/**
 * Create Supabase client for client components
 * This client can share sessions with server components and middleware
 * Uses singleton pattern to prevent multiple instances
 */
export const createSupabaseClient = () => {
  if (!supabaseClientInstance) {
    supabaseClientInstance = createClientComponentClient<Database>({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      options: {
        auth: {
          autoRefreshToken: false, // Disable automatic token refresh
          persistSession: true,
          detectSessionInUrl: false, // Disable automatic URL session detection
        }
      }
    });
  }
  return supabaseClientInstance;
};
