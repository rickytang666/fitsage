'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Chart data
  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Workout Intensity',
        data: [0.5, 1, 0, 2.5, 2, 2.5, 3.5],
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        pointBackgroundColor: 'rgb(249, 115, 22)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgb(249, 115, 22)',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 4,
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#666',
          stepSize: 1,
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#666',
        },
      },
    },
    elements: {
      line: {
        tension: 0.1,
      },
    },
  };

  return (
    <div className="py-6">
      {/* Greeting Banner with Fitness Decorations */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-lg shadow-lg mb-8">
        <div className="px-6 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {greeting}, {user?.email?.split('@')[0] || 'Fitness Enthusiast'}!
            </h1>
            <p className="text-indigo-100 mt-2">Ready for your daily fitness journey?</p>
          </div>
        </div>
      </div>
      
      {/* Workout Chart */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Weekly Workout Intensity</h2>
        <div className="h-80">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg shadow border-l-4 border-indigo-500">
        <p className="text-lg font-medium text-gray-800">"The only bad workout is the one that didn't happen."</p>
      </div>
    </div>
  );
}
