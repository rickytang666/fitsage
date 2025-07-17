import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const userName = "Ricky"; // Example username

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🏋️‍♂️ {userName}</h1>
        <p className={styles.subtitle}>Your Fitness Dashboard</p>
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
          <p className="text-sm text-gray-400 mt-1">Last workout: Today, 7:00 AM</p>
        </div>
      </div>
    </div>
  );
}
