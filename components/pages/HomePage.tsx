'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import DatabaseService from '../../services/DatabaseService';
import { User } from '../../models/User';
import styles from './HomePage.module.css';
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

export default function HomePage() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    height: 0,
    weight: 0
  });

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useEffect(() => {
    loadUserData();
  }, [authUser]);

  const loadUserData = async () => {
    if (!authUser?.id) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userData = await DatabaseService.loadUser(authUser.id);
      
      if (userData) {
        setUser(userData);
        setFormData({
          name: userData.name,
          height: userData.height,
          weight: userData.weight
        });
      } else {
        // Create new user profile with email-based name
        const userName = authUser.email?.split('@')[0] || 'User';
        const newUser = new User(authUser.id, userName, 0, 0);
        
        const saved = await DatabaseService.saveUserProfile(newUser);
        
        if (saved) {
          setUser(newUser);
          setFormData({
            name: newUser.name,
            height: newUser.height,
            weight: newUser.weight
          });
        } else {
          console.error('Failed to save new user profile');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        height: user.height,
        weight: user.weight
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!authUser || !user) return;
    
    setIsSaving(true);
    try {
      // Update user object
      user.name = formData.name;
      user.height = formData.height;
      user.weight = formData.weight;

      // Save to database
      const saved = await DatabaseService.saveUserProfile(user);
      
      if (saved) {
        setIsEditing(false);
        // Reload data to ensure consistency
        await loadUserData();
      } else {
        alert('Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateBMI = (weight: number, height: number) => {
    if (height === 0 || weight === 0) return 0;
    const heightInMeters = height / 100;
    return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
  };

  const getBMIStatus = (bmi: number) => {
    if (bmi === 0) return { status: "Not set", color: "gray" };
    if (bmi < 18.5) return { status: "Underweight", color: "blue" };
    if (bmi < 25) return { status: "Normal", color: "green" };
    if (bmi < 30) return { status: "Overweight", color: "yellow" };
    return { status: "Obese", color: "red" };
  };

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

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading your profile...</div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Please log in to view your profile.</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          Profile not found. Try refreshing the page or contact support.
        </div>
      </div>
    );
  }

  const bmi = calculateBMI(user.weight, user.height);
  const bmiStatus = getBMIStatus(bmi);

  return (
    <div className={styles.container}>
      {/* Greeting Banner with Fitness Decorations */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-lg shadow-lg mb-8">
        <div className="px-6 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {greeting}, {user?.name || authUser?.email?.split('@')[0] || 'Fitness Enthusiast'}!
            </h1>
            <p className="text-indigo-100 mt-2">Ready for your daily fitness journey?</p>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className={styles.profileCard}>
        <div className={styles.profileContent}>
          <h2>🔥 Profile Information</h2>
          
          {!isEditing ? (
            // View Mode
            <div className={styles.viewMode}>
              <div className={styles.profileField}>
                <label>Name:</label>
                <span>{user.name}</span>
              </div>
              
              <div className={styles.profileField}>
                <label>Height:</label>
                <span>{user.height > 0 ? `${user.height} cm` : 'Not set'}</span>
              </div>
              
              <div className={styles.profileField}>
                <label>Weight:</label>
                <span>{user.weight > 0 ? `${user.weight} kg` : 'Not set'}</span>
              </div>
              
              <div className={styles.profileField}>
                <label>BMI:</label>
                <span style={{ color: bmiStatus.color }}>
                  {bmi > 0 ? `${bmi} (${bmiStatus.status})` : 'Not available'}
                </span>
              </div>

              <button onClick={handleEdit} className={styles.editButton}>
                ✏️ Edit Profile
              </button>
            </div>
          ) : (
            // Edit Mode
            <div className={styles.editMode}>
              <div className={styles.formField}>
                <label>Name:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className={styles.input}
                />
              </div>
              
              <div className={styles.formField}>
                <label>Height (cm):</label>
                <input
                  type="number"
                  value={formData.height || ''}
                  onChange={(e) => setFormData({...formData, height: Number(e.target.value)})}
                  className={styles.input}
                  min="0"
                  max="300"
                />
              </div>
              
              <div className={styles.formField}>
                <label>Weight (kg):</label>
                <input
                  type="number"
                  value={formData.weight || ''}
                  onChange={(e) => setFormData({...formData, weight: Number(e.target.value)})}
                  className={styles.input}
                  min="0"
                  max="500"
                />
              </div>

              <div className={styles.buttonGroup}>
                <button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className={styles.saveButton}
                >
                  {isSaving ? '💾 Saving...' : '💾 Save'}
                </button>
                
                <button 
                  onClick={handleCancel}
                  disabled={isSaving}
                  className={styles.cancelButton}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className={styles.statsSection}>
        <h3 className={styles.sectionTitle}>Fitness Stats</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{user.totalLogs}</div>
            <div className={styles.statLabel}>Total Logs</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statValue}>{user.totalWorkouts}</div>
            <div className={styles.statLabel}>Total Workouts</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statValue}>{user.totalWorkoutMinutes}</div>
            <div className={styles.statLabel}>Minutes Exercised</div>
          </div>
        </div>
      </div>

      {/* Workout Chart */}
      <div className={styles.chartSection}>
        <h2 className={styles.chartTitle}>Weekly Workout Intensity</h2>
        <div className={styles.chartContainer}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Motivational Quote */}
      <div className={styles.motivationalQuote}>
        <p className={styles.quoteText}>"The only bad workout is the one that didn't happen."</p>
      </div>
    </div>
  );
}
