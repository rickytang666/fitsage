import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
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
        {/* Back Button */}
        <div className={styles.backButton}>
          <Link href="/" className={styles.backLink}>
            ← Back to Home
          </Link>
        </div>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <img src="/logo.svg" alt="FitSage Logo" style={{ height: 48, width: 48, verticalAlign: 'middle', marginRight: 12 }} />
            FitSage
          </h1>
          <h2 className={styles.subtitle}>
            Your personal fitness companion
          </h2>
        </div>
        <div className={styles.formContainer}>
          <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
            <SignIn />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
