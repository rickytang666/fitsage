-- FitSage Database Schema
-- Complete setup for FitSage fitness tracking app
-- Run this in your Supabase SQL editor to set up the database

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  height_cm INTEGER,
  weight_kg INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles - users can only see their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- ============================================================================
-- 2. DIARY LOGS TABLE
-- ============================================================================
CREATE TABLE public.diary_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  diary_entry TEXT,
  workouts JSONB, -- Store array of workouts as JSON (includes sets/reps/weight)
  injuries TEXT[], -- PostgreSQL text array for injuries
  suggestions JSONB, -- Store array of suggestion strings as JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 3. FEATURED WORKOUTS CACHE TABLE
-- ============================================================================
CREATE TABLE public.featured_workouts_cache (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  suggestions JSONB, -- Cached AI suggestions
  featured_workouts JSONB, -- Cached featured workouts array
  last_generated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  diary_entries_hash TEXT, -- Hash of diary entries used to detect changes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================================================
-- Diary logs indexes
CREATE INDEX idx_diary_logs_user_id ON public.diary_logs(user_id);
CREATE INDEX idx_diary_logs_date ON public.diary_logs(log_date);
CREATE UNIQUE INDEX idx_diary_logs_user_date ON public.diary_logs(user_id, log_date);

-- Featured workouts cache indexes
CREATE INDEX idx_featured_workouts_cache_user_id ON public.featured_workouts_cache(user_id);
CREATE INDEX idx_featured_workouts_cache_last_generated ON public.featured_workouts_cache(last_generated);

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE public.diary_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_workouts_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for diary_logs - users can only see their own logs
CREATE POLICY "Users can view own logs" ON public.diary_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON public.diary_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs" ON public.diary_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs" ON public.diary_logs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for featured_workouts_cache
CREATE POLICY "Users can view own featured workouts cache" ON public.featured_workouts_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own featured workouts cache" ON public.featured_workouts_cache
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own featured workouts cache" ON public.featured_workouts_cache
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own featured workouts cache" ON public.featured_workouts_cache
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Your FitSage database is now ready with:
-- • User profiles with height/weight tracking
-- • Daily diary logs with AI-processed workout data
-- • Cached featured workouts for better performance
-- • Full Row Level Security for data privacy
-- • Optimized indexes for fast queries 