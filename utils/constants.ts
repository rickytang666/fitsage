/**
 * Application constants and configuration values
 * Centralizes hardcoded values for easier maintenance
 */

// API Configuration
export const API_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  BASE_DELAY: 1000,
  MAX_DELAY: 10000,
  CACHE_DURATION_HOURS: 24,
  CONTEXT_DAYS: 3,
} as const;

// Workout Configuration
export const WORKOUT_CONFIG = {
  DEFAULT_CALORIES: 200,
  DEFAULT_DURATION_MINUTES: 30,
  MAX_INTENSITY: 4.0,
  INTENSITY_WEIGHT_BONUS: 0.5,
} as const;

// Date Configuration
export const DATE_CONFIG = {
  MAX_DAYS_BACK: 365,
  WEEK_DAYS: 7,
  CONTEXT_DAYS: 3,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  RATE_LIMIT: 'Too many requests. Please wait a few minutes and try again.',
  INVALID_CREDENTIALS: 'Invalid email or password. Please check your credentials and try again.',
  USER_EXISTS: 'An account with this email already exists. Please try signing in instead.',
  AI_PROCESSING_FAILED: 'AI processing failed. Your diary has been saved as-is.',
  AI_RATE_LIMITED: 'AI is taking a break due to high usage. Your diary has been saved, but AI analysis is temporarily unavailable.',
  AI_SERVICE_UNAVAILABLE: 'AI service is temporarily unavailable. Your diary has been saved, but analysis will be added later.',
  AI_CONFIG_ISSUE: 'AI configuration issue. Your diary has been saved without AI analysis.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  DIARY_SAVED: '✅ Saved! Processing with AI...',
  DIARY_SAVED_AI: '✅ Saved with AI insights!',
  DIARY_SAVED_AI_DELAYED: '✅ Saved! (AI analysis delayed due to rate limits)',
  CACHE_REGENERATED: '✅ Featured workouts cache regenerated after diary update',
  CACHE_CLEARED: '✅ Cache cleared',
} as const;

// UI Configuration
export const UI_CONFIG = {
  STATUS_MESSAGE_TIMEOUT: 4000,
  DEBOUNCE_DELAY: 200,
  SCROLL_DELAY: 200,
  FOCUS_DELAY: 200,
} as const;

// Database Configuration
export const DB_CONFIG = {
  MAX_ENTRIES_PER_USER: 1000,
  BATCH_SIZE: 50,
} as const;
