'use client';

import Link from 'next/link';
import styles from './HomePage.module.css';

export default function HomePage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          🏋️‍♂️ FitSage
        </h1>
        <p className={styles.subtitle}>
          Your AI-powered fitness companion. Track workouts, analyze progress, and achieve your goals with intelligent insights.
        </p>
        
        <div className={styles.buttonContainer}>
          <Link href="/auth/signup" className={`${styles.button} ${styles.buttonPrimary}`}>
            Get Started
          </Link>
          <Link href="/auth/login" className={`${styles.button} ${styles.buttonSecondary}`}>
            Sign In
          </Link>
        </div>

        <div className={styles.features}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📊</div>
            <h3 className={styles.featureTitle}>Smart Analytics</h3>
            <p className={styles.featureDescription}>
              AI-powered insights into your fitness progress and performance
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📝</div>
            <h3 className={styles.featureTitle}>Workout Diary</h3>
            <p className={styles.featureDescription}>
              Intelligent workout logging with automatic summarization
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎯</div>
            <h3 className={styles.featureTitle}>Goal Tracking</h3>
            <p className={styles.featureDescription}>
              Set, track, and achieve your fitness goals with precision
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
