'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';

// Types for dashboard data
interface DashboardStats {
  workoutsThisWeek: number;
  totalWorkouts: number;
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
    totalWorkouts: 0
  });
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

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
          totalWorkouts: 12
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
        <p className="text-gray-500">{greeting}, {user?.email?.split('@')[0] || 'User'}</p>
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

      </div>

    </div>
  );
}
