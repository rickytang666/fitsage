-- Migration: Add Featured Workouts Cache Table
-- Run this ONCE on your existing Supabase database to add caching functionality

-- 1. Add cached featured workouts table to eliminate unnecessary Gemini API calls
CREATE TABLE public.featured_workouts_cache (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  suggestions JSONB, -- Cached AI suggestions
  featured_workouts JSONB, -- Cached featured workouts array
  last_generated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  diary_entries_hash TEXT, -- Hash of diary entries used to detect changes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 2. Add indexes for performance
CREATE INDEX idx_featured_workouts_cache_user_id ON public.featured_workouts_cache(user_id);
CREATE INDEX idx_featured_workouts_cache_last_generated ON public.featured_workouts_cache(last_generated);

-- 3. Enable Row Level Security
ALTER TABLE public.featured_workouts_cache ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for featured workouts cache
CREATE POLICY "Users can view own featured workouts cache" ON public.featured_workouts_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own featured workouts cache" ON public.featured_workouts_cache
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own featured workouts cache" ON public.featured_workouts_cache
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own featured workouts cache" ON public.featured_workouts_cache
  FOR DELETE USING (auth.uid() = user_id);

-- Migration complete! The caching system is now ready to eliminate Gemini API spam. 