-- Super Simple FitSage Database Schema
-- Only 2 tables needed!

-- 1. Create profiles table (simple version from scratch)
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

-- 2. diary_logs table (NEW - this is what we need)
CREATE TABLE public.diary_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  diary_entry TEXT,
  workouts JSONB, -- Store array of workouts as JSON (now includes sets/reps/weight)
  injuries TEXT[], -- PostgreSQL text array for injuries
  suggestions JSONB, -- Store array of suggestion strings as JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 3. Add cached featured workouts table to eliminate unnecessary Gemini API calls
CREATE TABLE public.featured_workouts_cache (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  suggestions JSONB, -- Cached AI suggestions
  featured_workouts JSONB, -- Cached featured workouts array
  last_generated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  diary_entries_hash TEXT, -- Hash of diary entries used to detect changes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX idx_diary_logs_user_id ON public.diary_logs(user_id);
CREATE INDEX idx_diary_logs_date ON public.diary_logs(log_date);
CREATE UNIQUE INDEX idx_diary_logs_user_date ON public.diary_logs(user_id, log_date);

-- Indexes for featured workouts cache
CREATE INDEX idx_featured_workouts_cache_user_id ON public.featured_workouts_cache(user_id);
CREATE INDEX idx_featured_workouts_cache_last_generated ON public.featured_workouts_cache(last_generated);

-- Enable Row Level Security
ALTER TABLE public.diary_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_workouts_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only see their own logs
CREATE POLICY "Users can view own logs" ON public.diary_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON public.diary_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs" ON public.diary_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs" ON public.diary_logs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for featured workouts cache
CREATE POLICY "Users can view own featured workouts cache" ON public.featured_workouts_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own featured workouts cache" ON public.featured_workouts_cache
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own featured workouts cache" ON public.featured_workouts_cache
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own featured workouts cache" ON public.featured_workouts_cache
  FOR DELETE USING (auth.uid() = user_id);

-- THAT'S IT! Super simple structure:
-- User -> has many diary_logs (one per day)
-- Each diary_log contains: date, diary text, workouts JSON, injuries array
