'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import DatabaseService from '../../services/DatabaseService';
import { Workout } from '../../models/User';
import styles from './WorkoutsPage.module.css';

export default function WorkoutsPage() {
  const { user: authUser } = useAuth();
  const [weekStats, setWeekStats] = useState({
    totalWorkouts: 0,
    totalMinutes: 0,
    totalCalories: 0,
    isLoading: true
  });

  // Calculate this week's statistics
  const calculateWeekStats = async () => {
    if (!authUser?.id) return;

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

      // Load all diary entries
      const diaryEntries = await DatabaseService.loadDiaryEntries(authUser.id);
      
      // Filter workouts from this week
      const thisWeekWorkouts: Workout[] = [];
      diaryEntries.forEach(entry => {
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
    if (authUser?.id) {
      calculateWeekStats();
    }
  }, [authUser?.id]);

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
            <PastSevenDaysWorkouts userId={authUser.id} />
          </div>
        </div>

        {/* Featured Workouts Panel */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>⭐ Featured Workouts</h2>
          <div className={styles.panelContent}>
            <FeaturedWorkouts userId={authUser.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for Past 7 Days Workouts
function PastSevenDaysWorkouts({ userId }: { userId: string }) {
  const [workouts, setWorkouts] = useState<Array<{
    workout: Workout;
    date: Date;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPastWeekWorkouts = async () => {
      try {
        // Get past 7 days (including today)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 6); // Past 7 days including today
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        // Load all diary entries
        const diaryEntries = await DatabaseService.loadDiaryEntries(userId);
        
        // Filter and collect workouts from past 7 days
        const pastWeekWorkouts: Array<{ workout: Workout; date: Date }> = [];
        diaryEntries.forEach(entry => {
          if (entry.date >= startDate && entry.date <= endDate) {
            entry.workouts.forEach(workout => {
              pastWeekWorkouts.push({ workout, date: entry.date });
            });
          }
        });

        // Sort by date (most recent first)
        pastWeekWorkouts.sort((a, b) => b.date.getTime() - a.date.getTime());
        
        setWorkouts(pastWeekWorkouts);
      } catch (error) {
        console.error('Error loading past week workouts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadPastWeekWorkouts();
    }
  }, [userId]);

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

// Component for Featured Workouts (placeholder for now)
function FeaturedWorkouts({ userId }: { userId: string }) {
  return (
    <div className={styles.featuredPlaceholder}>
      <div className={styles.comingSoonCard}>
        <div className={styles.comingSoonIcon}>🤖</div>
        <h3>AI-Powered Recommendations</h3>
        <p>Coming soon! Our AI will analyze your past 3 days of workouts and suggest personalized featured workouts just for you.</p>
      </div>
    </div>
  );
}
