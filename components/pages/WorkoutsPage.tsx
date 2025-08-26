"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth/AuthProvider";
import DatabaseService from "../../services/DatabaseService";
import { Workout } from "../../models/User";
import logger from "@/utils/logger";
import styles from "./WorkoutsPage.module.css";

export default function WorkoutsPage() {
  const { user: authUser } = useAuth();
  // Centralized diary entries state - shared across all components
  const [allDiaryEntries, setAllDiaryEntries] = useState<
    Array<{
      id: string;
      date: Date;
      workouts: Workout[];
      diaryEntry: string;
      injuries: string[];
      suggestions: string[];
    }>
  >([]);
  const [isLoadingDiary, setIsLoadingDiary] = useState(true);
  // Removed unused diaryError state

  const [weekStats, setWeekStats] = useState({
    totalWorkouts: 0,
    totalMinutes: 0,
    totalCalories: 0,
    isLoading: true,
  });

  // Load all diary entries once when component mounts (optimized)
  useEffect(() => {
    const loadAllDiaryEntries = async () => {
      if (!authUser?.id) return;

      logger.debug("Loading all diary entries for WorkoutsPage...");
      setIsLoadingDiary(true);
      // Removed unused diaryError state

      try {
        // Add a small delay to prevent rapid consecutive calls
        await new Promise((resolve) => setTimeout(resolve, 100));

        const entries = await DatabaseService.loadDiaryEntries(authUser.id);
        logger.debug(
          "Loaded",
          entries.length,
          "diary entries for sharing across components"
        );
        setAllDiaryEntries(entries);
      } catch (error) {
        logger.error("Error loading diary entries:", error);
        // Removed unused diaryError state
        setAllDiaryEntries([]);
      } finally {
        setIsLoadingDiary(false);
      }
    };

    // Debounce the load function to prevent multiple rapid calls
    const timeoutId = setTimeout(loadAllDiaryEntries, 200);
    return () => clearTimeout(timeoutId);
  }, [authUser?.id]);

  // Calculate this week's statistics using shared diary entries
  const calculateWeekStats = useCallback(async () => {
    if (!authUser?.id || allDiaryEntries.length === 0) return;

    try {
      // Get start of this week (Sunday)
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Go to Sunday
      startOfWeek.setHours(0, 0, 0, 0); // Start of day

      // Get end of this week (Saturday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Go to Saturday
      endOfWeek.setHours(23, 59, 59, 999); // End of day

      logger.debug("Calculating week stats from shared diary entries...");

      // Filter workouts from this week using shared data
      const thisWeekWorkouts: Workout[] = [];
      allDiaryEntries.forEach((entry) => {
        if (entry.date >= startOfWeek && entry.date <= endOfWeek) {
          thisWeekWorkouts.push(...entry.workouts);
        }
      });

      // Calculate stats
      const totalWorkouts = thisWeekWorkouts.length;
      const totalMinutes = thisWeekWorkouts.reduce(
        (sum, workout) => sum + (workout.durationMinutes || 0),
        0
      );
      const totalCalories = thisWeekWorkouts.reduce(
        (sum, workout) => sum + (workout.calories || 0),
        0
      );

      setWeekStats({
        totalWorkouts,
        totalMinutes,
        totalCalories,
        isLoading: false,
      });
    } catch (error) {
      logger.error("Error calculating week stats:", error);
      setWeekStats({
        totalWorkouts: 0,
        totalMinutes: 0,
        totalCalories: 0,
        isLoading: false,
      });
    }
  }, [authUser?.id, allDiaryEntries]);

  // Load stats when component mounts
  useEffect(() => {
    if (authUser?.id && allDiaryEntries.length > 0) {
      calculateWeekStats();
    }
  }, [authUser?.id, allDiaryEntries, calculateWeekStats]);

  // Format duration for display
  const formatDuration = (totalMinutes: number): string => {
    if (totalMinutes === 0) return "0h";

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };

  if (!authUser) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>💪 Workouts</h1>
          <p className={styles.subtitle}>Please log in to view your workouts</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>💪 Workouts</h1>
        <p className={styles.subtitle}>Plan out your fitness journey</p>
      </div>

      <div className={styles.statsCard}>
        <h2 className={styles.statsTitle}>This Week&apos;s Progress</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {weekStats.isLoading ? "..." : weekStats.totalWorkouts}
            </div>
            <div className={styles.statLabel}>Workouts</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {weekStats.isLoading
                ? "..."
                : formatDuration(weekStats.totalMinutes)}
            </div>
            <div className={styles.statLabel}>Total Time</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {weekStats.isLoading
                ? "..."
                : weekStats.totalCalories.toLocaleString()}
            </div>
            <div className={styles.statLabel}>Calories</div>
          </div>
        </div>
      </div>

      {/* Split Panels - Past 7 days and Featured workouts */}
      <div className={styles.splitPanelsContainer}>
        {/* Past 7 Days Panel */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>📅 Past 7 Days Workouts</h2>
          <div className={styles.panelContent}>
            <PastSevenDaysWorkouts
              diaryEntries={allDiaryEntries}
              isLoading={isLoadingDiary}
            />
          </div>
        </div>

        {/* Featured Workouts Panel */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>⭐ Featured Workouts</h2>
          <div className={styles.panelContent}>
            <FeaturedWorkouts
              userId={authUser.id}
              diaryEntries={allDiaryEntries}
              isLoading={isLoadingDiary}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for Past 7 Days Workouts - now uses shared diary entries
function PastSevenDaysWorkouts({
  diaryEntries,
  isLoading,
}: {
  diaryEntries: Array<{
    id: string;
    date: Date;
    workouts: Workout[];
    diaryEntry: string;
    injuries: string[];
    suggestions: string[];
  }>;
  isLoading: boolean;
}) {
  const [workouts, setWorkouts] = useState<
    Array<{
      workout: Workout;
      date: Date;
    }>
  >([]);

  useEffect(() => {
    const loadPastWeekWorkouts = async () => {
      logger.debug(
        "PastSevenDaysWorkouts processing shared diary entries:",
        diaryEntries.length
      );

      if (isLoading || diaryEntries.length === 0) {
        logger.debug("Still loading diary entries or no entries available");
        return;
      }

      try {
        // Get past 7 days (including today)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 6); // Past 7 days including today
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        // Use shared diary entries instead of loading again
        logger.debug(
          "PastSevenDaysWorkouts processing",
          diaryEntries.length,
          "shared diary entries"
        );

        // Filter and collect workouts from past 7 days
        const pastWeekWorkouts: Array<{ workout: Workout; date: Date }> = [];
        diaryEntries.forEach((entry) => {
          if (entry.date >= startDate && entry.date <= endDate) {
            entry.workouts.forEach((workout: Workout) => {
              pastWeekWorkouts.push({ workout, date: entry.date });
            });
          }
        });

        // Sort by date (most recent first)
        pastWeekWorkouts.sort((a, b) => b.date.getTime() - a.date.getTime());

        setWorkouts(pastWeekWorkouts);
      } catch (error) {
        logger.error("Error processing past week workouts:", error);
        setWorkouts([]);
      }
    };

    if (!isLoading) {
      loadPastWeekWorkouts();
    }
  }, [diaryEntries, isLoading]);

  if (isLoading) {
    return <div className={styles.loading}>Loading past workouts...</div>;
  }

  if (workouts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>💭 No workouts in the past 7 days.</p>
        <p>Start by adding a diary entry!</p>
      </div>
    );
  }

  return (
    <div className={styles.workoutsList}>
      {workouts.map((item, index) => (
        <div
          key={`${item.workout.id}-${index}`}
          className={styles.pastWorkoutCard}
        >
          <div className={styles.workoutDate}>
            {item.date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
          <div className={styles.workoutInfo}>
            <h3 className={styles.workoutName}>{item.workout.name}</h3>
            <div className={styles.workoutStats}>
              {item.workout.durationMinutes && (
                <span className={styles.workoutStat}>
                  ⏱️ {item.workout.durationMinutes}m
                </span>
              )}
              {item.workout.sets && (
                <span className={styles.workoutStat}>
                  🔄 {item.workout.sets} sets
                </span>
              )}
              {item.workout.reps && (
                <span className={styles.workoutStat}>
                  ↗️ {item.workout.reps} reps
                </span>
              )}
              {item.workout.weight && (
                <span className={styles.workoutStat}>
                  🏋️ {item.workout.weight}kg
                </span>
              )}
              {item.workout.calories && (
                <span className={styles.workoutStat}>
                  🔥 {item.workout.calories} cal
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Component for Featured Workouts (AI-powered recommendations) - now uses shared diary entries
function FeaturedWorkouts({
  userId,
  diaryEntries,
  isLoading,
}: {
  userId: string;
  diaryEntries: Array<{
    id: string;
    date: Date;
    workouts: Workout[];
    diaryEntry: string;
    injuries: string[];
    suggestions: string[];
  }>;
  isLoading: boolean;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [featuredWorkouts, setFeaturedWorkouts] = useState<
    Array<{
      id: string;
      name: string;
      durationMinutes?: number;
      sets?: number;
      reps?: number;
      weight?: number;
      estimatedCalories?: number;
      difficultyLevel: string;
      description?: string;
    }>
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingFromCache, setIsLoadingFromCache] = useState(false);
  // Removed unused error and isRateLimited state
  const [errorType, setErrorType] = useState<
    "rate_limit" | "service_error" | null
  >(null);

  const loadFeaturedWorkouts = useCallback(async () => {
    logger.debug("FeaturedWorkouts: Starting load process...");

    if (isLoading) {
      return;
    }

    // Handle case with no diary entries - still check cache and provide fallback
    if (diaryEntries.length === 0) {
      try {
        setIsLoadingFromCache(true);
        // Try to get any existing cache first
        const cachedResults = await DatabaseService.getCachedFeaturedWorkouts(
          userId
        );

        if (cachedResults && cachedResults.isValid) {
          setSuggestions(cachedResults.suggestions);
          setFeaturedWorkouts(cachedResults.featuredWorkouts);
          setIsLoadingFromCache(false);
          setIsProcessing(false);
          return;
        }

        // No cache and no diary entries - provide static fallback (no API call needed)
        setSuggestions([
          "🌟 Welcome to your fitness journey!",
          "💪 Start by adding your first diary entry to get personalized recommendations.",
          "🏃‍♂️ Try some basic exercises below to get started!",
        ]);
        setFeaturedWorkouts([
          {
            id: "starter_1",
            name: "Morning Walk",
            durationMinutes: 20,
            estimatedCalories: 100,
            difficultyLevel: "all level",
            description: "A gentle way to start your fitness journey",
          },
          {
            id: "starter_2",
            name: "Basic Stretching",
            durationMinutes: 10,
            estimatedCalories: 30,
            difficultyLevel: "all level",
            description: "Improve flexibility and reduce stiffness",
          },
          {
            id: "starter_3",
            name: "Wall Push-ups",
            sets: 2,
            reps: 8,
            estimatedCalories: 40,
            difficultyLevel: "beginner",
            description: "Perfect for building upper body strength",
          },
          {
            id: "starter_4",
            name: "Bodyweight Squats",
            sets: 2,
            reps: 10,
            estimatedCalories: 50,
            difficultyLevel: "beginner",
            description: "Strengthen your legs and glutes",
          },
        ]);
        setIsLoadingFromCache(false);
        setIsProcessing(false);
        return;
      } catch (cacheError) {
        logger.error("Cache check failed for empty diary:", cacheError);
        setIsLoadingFromCache(false);
        setIsProcessing(false);
        return;
      }
    }

    try {
      // 🚀 FIRST: Try to get cached results
      setIsLoadingFromCache(true);
      const cachedResults = await DatabaseService.getCachedFeaturedWorkouts(
        userId
      );

      if (cachedResults && cachedResults.isValid) {
        setSuggestions(cachedResults.suggestions);
        setFeaturedWorkouts(cachedResults.featuredWorkouts);
        setIsLoadingFromCache(false);
        setIsProcessing(false);
        return;
      }

      // 🔄 Cache invalid or doesn't exist - generate new results
      setIsLoadingFromCache(false);
      setIsProcessing(true);

      const response = await fetch("/api/featured-workouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          diaryEntries: diaryEntries, // Pass shared diary entries to API
          regenerateCache: true, // Force generation since cache was invalid
        }),
      });

      const data = await response.json();

      if (response.status === 429) {
        // Handle rate limiting - show normal suggestions with error banner
        setErrorType("rate_limit");

        // Show helpful suggestions instead of error-focused ones
        setSuggestions([
          "🌟 Here are some great workout ideas for you!",
          "💪 Focus on consistency - even 15 minutes of exercise makes a difference.",
          "🏃‍♂️ Try the curated workouts below while our AI takes a quick break.",
        ]);

        // Show quality fallback workouts
        setFeaturedWorkouts([
          {
            id: "fallback_cardio_1",
            name: "Brisk Walking",
            durationMinutes: 30,
            estimatedCalories: 150,
            difficultyLevel: "all level",
            description: "Perfect cardio for any fitness level",
          },
          {
            id: "fallback_strength_1",
            name: "Push-ups",
            sets: 3,
            reps: 10,
            estimatedCalories: 75,
            difficultyLevel: "beginner",
            description: "Build upper body strength",
          },
          {
            id: "fallback_strength_2",
            name: "Bodyweight Squats",
            sets: 3,
            reps: 15,
            estimatedCalories: 90,
            difficultyLevel: "beginner",
            description: "Strengthen legs and glutes",
          },
          {
            id: "fallback_cardio_2",
            name: "Jumping Jacks",
            durationMinutes: 10,
            estimatedCalories: 80,
            difficultyLevel: "all level",
            description: "Quick cardio boost",
          },
          {
            id: "fallback_flexibility_1",
            name: "Basic Stretching",
            durationMinutes: 15,
            estimatedCalories: 30,
            difficultyLevel: "all level",
            description: "Improve flexibility and reduce tension",
          },
          {
            id: "fallback_strength_3",
            name: "Plank Hold",
            durationMinutes: 2,
            estimatedCalories: 20,
            difficultyLevel: "intermediate",
            description: "Core strengthening exercise",
          },
        ]);
        return;
      }

      if (!response.ok) {
        const errorMsg = `API returned ${response.status}: ${response.statusText}`;
        throw new Error(errorMsg);
      }

      if (data.success) {
        setSuggestions(data.suggestions || []);
        setFeaturedWorkouts(data.featuredWorkouts || []);

        // 💾 Save to cache for future use
        await DatabaseService.saveFeaturedWorkoutsCache(
          userId,
          data.suggestions || [],
          data.featuredWorkouts || [],
          diaryEntries
        );
        logger.debug("New featured workouts cached for future use");
      } else {
        setSuggestions(
          data.suggestions || ["Unable to generate recommendations"]
        );
        setFeaturedWorkouts(data.featuredWorkouts || []);
        if (data.meta?.error) {
          setErrorType("service_error");
        } else if (data.meta?.rateLimited) {
          setErrorType("rate_limit");
        }
      }
    } catch (err) {
      logger.error("Failed to load featured workouts:", err);
      setErrorType("service_error");

      // Show quality fallback suggestions and workouts even on service errors
      setSuggestions([
        "🌟 Here are some reliable workout recommendations for you!",
        "🔥 These exercises are proven to be effective for building fitness.",
        "💪 Start with what feels comfortable and gradually increase intensity.",
      ]);

      setFeaturedWorkouts([
        {
          id: "fallback_cardio_1",
          name: "Brisk Walking",
          durationMinutes: 30,
          estimatedCalories: 150,
          difficultyLevel: "all level",
          description: "Perfect cardio for any fitness level",
        },
        {
          id: "fallback_strength_1",
          name: "Push-ups",
          sets: 3,
          reps: 10,
          estimatedCalories: 75,
          difficultyLevel: "beginner",
          description: "Build upper body strength",
        },
        {
          id: "fallback_strength_2",
          name: "Bodyweight Squats",
          sets: 3,
          reps: 15,
          estimatedCalories: 90,
          difficultyLevel: "beginner",
          description: "Strengthen legs and glutes",
        },
        {
          id: "fallback_cardio_2",
          name: "Jumping Jacks",
          durationMinutes: 10,
          estimatedCalories: 80,
          difficultyLevel: "all level",
          description: "Quick cardio boost",
        },
      ]);
    } finally {
      setIsProcessing(false);
      setIsLoadingFromCache(false);
    }
  }, [userId, diaryEntries, isLoading]);

  useEffect(() => {
    if (!isLoading && diaryEntries.length > 0) {
      loadFeaturedWorkouts();
    }
  }, [loadFeaturedWorkouts, isLoading, diaryEntries]);

  // Manual retry function
  const retryFeaturedWorkouts = async () => {
    if (!isLoading && diaryEntries.length > 0) {
      await loadFeaturedWorkouts();
    }
  };

  if (isLoading) {
    return (
      <div className={styles.featuredLoading}>
        <div className={styles.loadingSpinner}>📚</div>
        <p>Loading diary entries...</p>
      </div>
    );
  }

  if (isLoadingFromCache) {
    return (
      <div className={styles.featuredLoading}>
        <div className={styles.loadingSpinner}>💾</div>
        <p>Loading your suggestions...</p>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className={styles.featuredLoading}>
        <div className={styles.loadingSpinner}>🤖</div>
        <p>AI is generating recommendations...</p>
      </div>
    );
  }

  return (
    <div className={styles.featuredWorkouts}>
      {/* Error Banner - Red banner for AI errors */}
      {errorType && (
        <div className={styles.errorBanner}>
          <div className={styles.errorBannerContent}>
            <span className={styles.errorIcon}>
              {errorType === "rate_limit" ? "🚫" : "⚠️"}
            </span>
            <div className={styles.errorText}>
              <div className={styles.errorTitle}>
                {errorType === "rate_limit"
                  ? "AI Quota Limit Reached"
                  : "AI Service Unavailable"}
              </div>
              <div className={styles.errorDescription}>
                {errorType === "rate_limit"
                  ? "AI recommendations are temporarily limited. Using quality fallback suggestions below."
                  : "Unable to connect to AI service. Showing curated workout recommendations instead."}
              </div>
            </div>
            {errorType === "rate_limit" && (
              <button
                onClick={retryFeaturedWorkouts}
                className={styles.retryButtonSmall}
                disabled={isProcessing}
              >
                {isProcessing ? "⏳" : "🔄 Retry"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* AI Suggestions Section */}
      <div className={styles.suggestionsSection}>
        <div className={styles.suggestionsHeader}>
          <h3 className={styles.suggestionsTitle}>
            💡 {errorType ? "Curated Suggestions" : "AI Suggestions"}
          </h3>
        </div>
        <ul className={styles.suggestionsList}>
          {suggestions.map((suggestion, index) => (
            <li key={index} className={styles.suggestion}>
              {suggestion}
            </li>
          ))}
        </ul>
      </div>

      {/* Featured Workouts Section */}
      <div className={styles.workoutsSection}>
        <h3 className="text-white">
          ⭐ Recommended Workouts ({featuredWorkouts.length})
        </h3>
        <div className={styles.featuredWorkoutsList}>
          {featuredWorkouts.map((workout) => (
            <div key={workout.id} className={styles.featuredWorkoutCard}>
              <div className={styles.featuredWorkoutHeader}>
                <h4 className={styles.featuredWorkoutName}>{workout.name}</h4>
                <span
                  className={styles.featuredWorkoutLevel}
                  data-level={workout.difficultyLevel}
                >
                  {workout.difficultyLevel}
                </span>
              </div>

              <div className={styles.featuredWorkoutStats}>
                {workout.durationMinutes && (
                  <span className={styles.workoutStat}>
                    ⏱️ {workout.durationMinutes}m
                  </span>
                )}
                {workout.sets && (
                  <span className={styles.workoutStat}>
                    🔄 {workout.sets} sets
                  </span>
                )}
                {workout.reps && (
                  <span className={styles.workoutStat}>
                    ↗️ {workout.reps} reps
                  </span>
                )}
                {workout.weight && workout.weight > 0 && (
                  <span className={styles.workoutStat}>
                    🏋️ {workout.weight}kg
                  </span>
                )}
                {workout.estimatedCalories && (
                  <span className={styles.workoutStat}>
                    🔥 ~{workout.estimatedCalories} cal
                  </span>
                )}
              </div>

              {workout.description && (
                <p className={styles.featuredWorkoutDescription}>
                  {workout.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
