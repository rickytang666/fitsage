import Link from 'next/link';
import SignUp from '@/components/auth/SignUp';
import styles from './SignUpPage.module.css';

export default function SignUpPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Back Button */}
        <div className={styles.backButton}>
          <Link href="/" className={styles.backLink}>
            ← Back to Home
          </Link>
        </div>
        
        <div className={styles.header}>
          <h1 className={styles.title}>
            🏋️‍♂️ FitSage
          </h1>
          <h2 className={styles.subtitle}>
            Start your fitness journey today
          </h2>
        </div>
        
        <div className={styles.formContainer}>
          <SignUp />
        </div>
      </div>
    </div>
  );
}
