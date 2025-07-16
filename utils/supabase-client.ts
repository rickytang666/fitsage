import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

/**
 * Create Supabase client for client components
 * This client can share sessions with server components and middleware
 */
export const createSupabaseClient = () => {
  return createClientComponentClient<Database>();
};
