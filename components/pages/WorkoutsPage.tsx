'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import DatabaseService from '../../services/DatabaseService';
import { Workout } from '../../models/User';
import styles from './WorkoutsPage.module.css';

export default function WorkoutsPage() {
  const { user: authUser } = useAuth();
  // Centralized diary entries state - shared across all components
  const [allDiaryEntries, setAllDiaryEntries] = useState<any[]>([]);
  const [isLoadingDiary, setIsLoadingDiary] = useState(true);
  const [diaryError, setDiaryError] = useState<string>('');
  
  const [weekStats, setWeekStats] = useState({
    totalWorkouts: 0,
    totalMinutes: 0,
    totalCalories: 0,
    isLoading: true
  });

  // Load all diary entries once when component mounts
  useEffect(() => {
    const loadAllDiaryEntries = async () => {
      if (!authUser?.id) return;

      console.log('📚 Loading all diary entries for WorkoutsPage...');
      setIsLoadingDiary(true);
      setDiaryError('');

      try {
        const entries = await DatabaseService.loadDiaryEntries(authUser.id);
        console.log('📚 Loaded', entries.length, 'diary entries for sharing across components');
        setAllDiaryEntries(entries);
      } catch (error) {
        console.error('❌ Error loading diary entries:', error);
        setDiaryError('Failed to load diary entries');
        setAllDiaryEntries([]);
      } finally {
        setIsLoadingDiary(false);
      }
    };

    loadAllDiaryEntries();
  }, [authUser?.id]);

  // Calculate this week's statistics using shared diary entries
  // Calculate this week's statistics using shared diary entries
  const calculateWeekStats = async () => {
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

      console.log('📊 Calculating week stats from shared diary entries...');
      
      // Filter workouts from this week using shared data
      const thisWeekWorkouts: Workout[] = [];
      allDiaryEntries.forEach(entry => {
        if (entry.date >= startOfWeek && entry.date <= endOfWeek) {
          thisWeekWorkouts.push(...entry.workouts);
        }
      });

      // Calculate stats
      const totalWorkouts = thisWeekWorkouts.length;
      const totalMinutes = thisWeekWorkouts.reduce((sum, workout) => 
        sum + (workout.durationMinutes || 0), 0
      );
      const totalCalories = thisWeekWorkouts.reduce((sum, workout) => 
        sum + (workout.calories || 0), 0
      );

      setWeekStats({
        totalWorkouts,
        totalMinutes,
        totalCalories,
        isLoading: false
      });

    } catch (error) {
      console.error('Error calculating week stats:', error);
      setWeekStats({
        totalWorkouts: 0,
        totalMinutes: 0,
        totalCalories: 0,
        isLoading: false
      });
    }
  };

  // Load stats when component mounts
  useEffect(() => {
    if (authUser?.id && allDiaryEntries.length > 0) {
      calculateWeekStats();
    }
  }, [authUser?.id, allDiaryEntries]); // Recalculate when diary entries change

  // Format duration for display
  const formatDuration = (totalMinutes: number): string => {
    if (totalMinutes === 0) return '0h';
    
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
        <p className={styles.subtitle}>Choose your fitness journey</p>
      </div>

      <div className={styles.statsCard}>
        <h2 className={styles.statsTitle}>This Week's Progress</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {weekStats.isLoading ? '...' : weekStats.totalWorkouts}
            </div>
            <div className={styles.statLabel}>Workouts</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {weekStats.isLoading ? '...' : formatDuration(weekStats.totalMinutes)}
            </div>
            <div className={styles.statLabel}>Total Time</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {weekStats.isLoading ? '...' : weekStats.totalCalories.toLocaleString()}
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
            <PastSevenDaysWorkouts diaryEntries={allDiaryEntries} isLoading={isLoadingDiary} />
          </div>
        </div>

        {/* Featured Workouts Panel */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>⭐ Featured Workouts</h2>
          <div className={styles.panelContent}>
            <FeaturedWorkouts userId={authUser.id} diaryEntries={allDiaryEntries} isLoading={isLoadingDiary} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for Past 7 Days Workouts - now uses shared diary entries
function PastSevenDaysWorkouts({ diaryEntries, isLoading }: { diaryEntries: any[], isLoading: boolean }) {
  const [workouts, setWorkouts] = useState<Array<{
    workout: Workout;
    date: Date;
  }>>([]);

  useEffect(() => {
    const loadPastWeekWorkouts = async () => {
      console.log('📅 PastSevenDaysWorkouts processing shared diary entries:', diaryEntries.length);
      
      if (isLoading || diaryEntries.length === 0) {
        console.log('📅 Still loading diary entries or no entries available');
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
        console.log('📅 PastSevenDaysWorkouts processing', diaryEntries.length, 'shared diary entries');
        
        // Filter and collect workouts from past 7 days
        const pastWeekWorkouts: Array<{ workout: Workout; date: Date }> = [];
        diaryEntries.forEach((entry: any) => {
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
        console.error('Error processing past week workouts:', error);
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
        <div key={`${item.workout.id}-${index}`} className={styles.pastWorkoutCard}>
          <div className={styles.workoutDate}>
            {item.date.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
          <div className={styles.workoutInfo}>
            <h3 className={styles.workoutName}>{item.workout.name}</h3>
            <div className={styles.workoutStats}>
              {item.workout.durationMinutes && (
                <span className={styles.workoutStat}>⏱️ {item.workout.durationMinutes}m</span>
              )}
              {item.workout.sets && (
                <span className={styles.workoutStat}>🔄 {item.workout.sets} sets</span>
              )}
              {item.workout.reps && (
                <span className={styles.workoutStat}>↗️ {item.workout.reps} reps</span>
              )}
              {item.workout.weight && (
                <span className={styles.workoutStat}>🏋️ {item.workout.weight}kg</span>
              )}
              {item.workout.calories && (
                <span className={styles.workoutStat}>🔥 {item.workout.calories} cal</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Component for Featured Workouts (AI-powered recommendations) - now uses shared diary entries
function FeaturedWorkouts({ userId, diaryEntries, isLoading }: { 
  userId: string, 
  diaryEntries: any[], 
  isLoading: boolean
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [featuredWorkouts, setFeaturedWorkouts] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const loadFeaturedWorkouts = async () => {
      console.log('🎯 FeaturedWorkouts processing shared diary entries:', diaryEntries.length);
      
      if (isLoading || diaryEntries.length === 0) {
        console.log('❌ Still loading diary entries or no entries available');
        return;
      }
      
      setIsProcessing(true);
      setError('');
      
      try {
        const response = await fetch('/api/featured-workouts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userId,
            diaryEntries: diaryEntries // Pass shared diary entries to API
          }),
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setSuggestions(data.suggestions || []);
          setFeaturedWorkouts(data.featuredWorkouts || []);
          setDebugInfo(data.debug || null);
        } else {
          setSuggestions(data.suggestions || ['Unable to generate recommendations']);
          setFeaturedWorkouts(data.featuredWorkouts || []);
          setDebugInfo(data.debug || null);
          if (data.meta?.error) {
            setError(data.meta.error);
          }
        }
      } catch (err) {
        console.error('Failed to load featured workouts:', err);
        setError('Failed to load AI recommendations');
        setSuggestions(['Unable to connect to AI service']);
        setFeaturedWorkouts([]);
      } finally {
        setIsProcessing(false);
      }
    };

    if (!isLoading && diaryEntries.length > 0) {
      loadFeaturedWorkouts();
    }
  }, [userId, diaryEntries, isLoading]);

  if (isLoading) {
    return (
      <div className={styles.featuredLoading}>
        <div className={styles.loadingSpinner}>📚</div>
        <p>Loading diary entries...</p>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className={styles.featuredLoading}>
        <div className={styles.loadingSpinner}>🤖</div>
        <p>AI is analyzing your workout patterns...</p>
      </div>
    );
  }

  return (
    <div className={styles.featuredWorkouts}>
      {/* AI Suggestions Section */}
      <div className={styles.suggestionsSection}>
        <h3 className={styles.suggestionsTitle}>💡 AI Suggestions</h3>
        {error && (
          <div className={styles.errorMessage}>⚠️ {error}</div>
        )}
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
        <h3 className={styles.workoutsTitle}>⭐ Recommended Workouts ({featuredWorkouts.length})</h3>
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
                  <span className={styles.workoutStat}>⏱️ {workout.durationMinutes}m</span>
                )}
                {workout.sets && (
                  <span className={styles.workoutStat}>🔄 {workout.sets} sets</span>
                )}
                {workout.reps && (
                  <span className={styles.workoutStat}>↗️ {workout.reps} reps</span>
                )}
                {workout.weight && workout.weight > 0 && (
                  <span className={styles.workoutStat}>🏋️ {workout.weight}kg</span>
                )}
                {workout.estimatedCalories && (
                  <span className={styles.workoutStat}>🔥 ~{workout.estimatedCalories} cal</span>
                )}
              </div>

              {workout.description && (
                <p className={styles.featuredWorkoutDescription}>{workout.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
