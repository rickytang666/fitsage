'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';

// Types for dashboard data
interface DashboardStats {
  workoutsThisWeek: number;
  totalWorkouts: number;
  caloriesBurned: number;
  activeGoals: number;
}

interface RecentWorkout {
  id: string;
  name: string;
  date: string;
  type: string;
  duration: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    workoutsThisWeek: 0,
    totalWorkouts: 0,
    caloriesBurned: 0,
    activeGoals: 0
  });
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);

  // Simulate fetching dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // In a real app, this would be an API call to Supabase
        // For now, we'll simulate a delay and use mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        setStats({
          workoutsThisWeek: 3,
          totalWorkouts: 12,
          caloriesBurned: 1250,
          activeGoals: 2
        });
        
        setRecentWorkouts([
          {
            id: '1',
            name: 'Morning Run',
            date: '2025-05-16',
            type: 'Cardio',
            duration: 30
          },
          {
            id: '2',
            name: 'Strength Training',
            date: '2025-05-14',
            type: 'Strength',
            duration: 45
          },
          {
            id: '3',
            name: 'Yoga Session',
            date: '2025-05-12',
            type: 'Flexibility',
            duration: 60
          }
        ]);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="mt-6 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
              <div className="px-4 py-5 sm:p-6 h-24"></div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg animate-pulse h-64"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard content
  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.email?.split('@')[0] || 'User'}</p>
      </div>
      
      {/* Stats Overview */}
      <div className="mt-6 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Workouts this week */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Workouts this week
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-indigo-600">
              {stats.workoutsThisWeek}
            </dd>
          </div>
        </div>

        {/* Total workouts */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total workouts
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-indigo-600">
              {stats.totalWorkouts}
            </dd>
          </div>
        </div>

        {/* Calories burned */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Calories burned
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-indigo-600">
              {stats.caloriesBurned}
            </dd>
          </div>
        </div>

        {/* Active goals */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Active goals
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-indigo-600">
              {stats.activeGoals}
            </dd>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/workouts/new"
            className="relative block rounded-lg border border-gray-300 bg-white p-6 text-center hover:border-indigo-400 hover:ring-1 hover:ring-indigo-400"
          >
            <span className="text-indigo-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </span>
            <span className="mt-2 block text-sm font-medium text-gray-900">
              Log a Workout
            </span>
          </Link>

          <Link
            href="/nutrition/new"
            className="relative block rounded-lg border border-gray-300 bg-white p-6 text-center hover:border-indigo-400 hover:ring-1 hover:ring-indigo-400"
          >
            <span className="text-indigo-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </span>
            <span className="mt-2 block text-sm font-medium text-gray-900">
              Log a Meal
            </span>
          </Link>

          <Link
            href="/goals/new"
            className="relative block rounded-lg border border-gray-300 bg-white p-6 text-center hover:border-indigo-400 hover:ring-1 hover:ring-indigo-400"
          >
            <span className="text-indigo-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </span>
            <span className="mt-2 block text-sm font-medium text-gray-900">
              Set a New Goal
            </span>
          </Link>
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Recent Workouts</h2>
          <Link
            href="/workouts"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            View all
          </Link>
        </div>
        <div className="mt-4 bg-white shadow rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {recentWorkouts.length > 0 ? (
              recentWorkouts.map((workout) => (
                <li key={workout.id}>
                  <Link href={`/workouts/${workout.id}`} className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {workout.name}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {workout.type}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <svg
                              className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6.5z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {new Date(workout.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <svg
                              className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6.5z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {workout.duration} min
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))
            ) : (
              <li className="px-4 py-6 text-center text-gray-500">
                No workouts logged yet. Start tracking your fitness journey!
              </li>
            )}
          </ul>
        </div>
      </div>
      
      {/* Activity Feed - Placeholder */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Activity Feed</h2>
        </div>
        <div className="mt-4 bg-white shadow rounded-lg p-6">
          <p className="text-center text-gray-500">
            Your activity feed will show your recent progress and achievements.
          </p>
          <div className="mt-4 flex justify-center">
            <Link 
              href="/workouts/new" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Start Tracking
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
