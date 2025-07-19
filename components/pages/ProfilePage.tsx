'use client';

import { useState } from 'react';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const userName = "Ricky"; // Example username
  
  // User physical data
  const [userData, setUserData] = useState({
    height: 175, // cm
    weight: 70, // kg
    bmi: 22.9,
  });

  // BMI calculator function
  const calculateBMI = (weight: number, height: number) => {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  const calculateBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { status: "Underweight", color: "blue" };
    if (bmi < 25) return { status: "Normal", color: "green" };
    if (bmi < 30) return { status: "Overweight", color: "yellow" };
    return { status: "Obese", color: "red" };
  };

  const bmiStatus = calculateBMIStatus(userData.bmi);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🏋️‍♂️ {userName}</h1>
        <p className={styles.subtitle}>Your Fitness Profile</p>
      </div>

      <div className={styles.profileCard}>
        <div className={styles.profileContent}>
          <h2>🔥 Your Fitness Profile is Heating Up!</h2>
          <p>
            You're cooking with real power — tracking your workouts, progress, and goals like a champ. 
            Stay tuned for next-level insights coming your way!
          </p>
        </div>
      </div>

      {/* Physical Stats Section */}
      <div className={styles.statsSection}>
        <h3 className={styles.sectionTitle}>Physical Stats</h3>
        
        <div className={styles.statsGrid}>
          {/* Height and Weight */}
          <div className={styles.statCard}>
            <div className={styles.statGroup}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Height</span>
                <span className={styles.statValue}>{userData.height} cm</span>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ height: `${Math.min(100, (userData.height / 200) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Weight</span>
                <span className={styles.statValue}>{userData.weight} kg</span>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ height: `${Math.min(100, (userData.weight / 100) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* BMI Card */}
          <div className={styles.statCard}>
            <div className={styles.bmiContainer}>
              <h4 className={styles.bmiTitle}>Body Mass Index</h4>
              <div className={styles.bmiValue}>{userData.bmi.toFixed(1)}</div>
              <div className={styles.bmiStatus}>
                <span className={`${styles.bmiStatusBadge} ${styles[bmiStatus.color]}`}>
                  {bmiStatus.status}
                </span>
              </div>
              
              {/* BMI Scale */}
              <div className={styles.bmiScale}>
                <div className={styles.bmiScaleBar}>
                  <div className={styles.bmiScaleSegment} style={{ width: '20%', backgroundColor: '#3b82f6' }}></div>
                  <div className={styles.bmiScaleSegment} style={{ width: '20%', backgroundColor: '#10b981' }}></div>
                  <div className={styles.bmiScaleSegment} style={{ width: '25%', backgroundColor: '#f59e0b' }}></div>
                  <div className={styles.bmiScaleSegment} style={{ width: '15%', backgroundColor: '#ef4444' }}></div>
                  <div className={styles.bmiScaleSegment} style={{ width: '20%', backgroundColor: '#dc2626' }}></div>
                </div>
                <div className={styles.bmiScaleLabels}>
                  <span>16</span>
                  <span>18.5</span>
                  <span>25</span>
                  <span>30</span>
                  <span>35</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.settingsCard}>
        <div className="flex items-center space-x-3">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4"
            />
          </svg>
          <h3 className={styles.settingsTitle}>Workout Log Updated!</h3>
        </div>
        <div className={styles.settingsContent}>
          <p>
            Great job! Your latest workout has been recorded. Keep crushing those fitness goals 💪
          </p>
          <p className={styles.textSmallGray}>Last workout: Today, 7:00 AM</p>
        </div>
      </div>
    </div>
  );
}
