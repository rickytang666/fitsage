'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import dynamic from 'next/dynamic';
import Script from 'next/script';

export default function DashboardPage() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

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
        <div className="chart-container" style={{ height: "600px" }}>
          <canvas id="workoutChart"></canvas>
        </div>
      </div>

      {/* Load Chart.js from CDN */}
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"
        onLoad={() => {
          const ctx = document.getElementById('workoutChart');
          if (ctx) {
            const chart = new (window as any).Chart(ctx, {
              type: 'line',
              data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                  label: 'Workout Intensity',
                  data: [0.5, 1, 0, 2.5, 2, 2.5, 3.5],
                  borderColor: 'orange',
                  borderWidth: 2,
                  backgroundColor: 'rgba(255,165,0,0.1)',
                  pointBackgroundColor: 'orange',
                  pointRadius: 6,
                  pointHoverRadius: 8,
                  pointBorderWidth: 1,
                  pointBorderColor: 'white',
                  fill: false
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    intersect: false,
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      display: false,
                      drawBorder: false
                    },
                    ticks: {
                      color: '#666'
                    }
                  },
                  x: {
                    grid: {
                      display: false,
                      drawBorder: false
                    },
                    ticks: {
                      color: '#666'
                    }
                  }
                },
                 elements: {
                  line: {
                    tension: 0.1
                  }
                }
              }
            });
          }
        }}
      />

      {/* Motivational Quote */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg shadow border-l-4 border-indigo-500">
        <p className="text-lg font-medium text-gray-800">"The only bad workout is the one that didn't happen."</p>
      </div>
    </div>
  );
}
