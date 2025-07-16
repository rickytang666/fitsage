import { Metadata } from 'next';
import SignIn from '@/components/auth/SignIn';
import styles from './LoginPage.module.css';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your FitSage account to track your fitness journey.',
};

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            🏋️‍♂️ FitSage
          </h1>
          <h2 className={styles.subtitle}>
            Your personal fitness companion
          </h2>
        </div>
        
        <div className={styles.formContainer}>
          <SignIn />
        </div>
      </div>
    </div>
  );
}
