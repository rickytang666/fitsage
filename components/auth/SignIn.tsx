'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import styles from './Auth.module.css';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [confirmationSuccess, setConfirmationSuccess] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for URL parameters
  useEffect(() => {
    const urlError = searchParams.get('error');
    const confirmed = searchParams.get('confirmed');
    
    if (urlError === 'confirmation_failed') {
      setError('Email confirmation failed. Please try again or contact support.');
    } else if (confirmed === 'true') {
      // Show success message for confirmed accounts
      setError(null); // Clear any existing errors
      setConfirmationSuccess(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 Sign in attempt started for:', email);
    console.log('📋 Form event:', e);
    
    setError(null);
    setIsLoading(true);
    setLoginSuccess(false);
    
    try {
      console.log('📞 Calling signIn function...');
      console.log('🏗️ signIn function exists:', typeof signIn);
      
      const result = await signIn(email, password);
      console.log('📨 SignIn result:', result);
      
      if (result && result.error) {
        console.error('❌ Sign in failed:', result.error);
        setError(result.error.message || 'Invalid credentials. Please try again.');
        setIsLoading(false);
        return;
      }
      
      console.log('✅ Sign in successful!');
      // Login successful - show success message
      setLoginSuccess(true);
      
      // Wait a bit longer to ensure session is established
      setTimeout(() => {
        console.log('🚀 Redirecting to home...');
        // Use window.location.href to ensure a fresh request that middleware can intercept
        window.location.href = '/profile';
      }, 2000); // Increased delay to 2 seconds
      
    } catch (err) {
      console.error('💥 Unexpected error during login:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <h2 className={styles.title}>Sign In to FitSage</h2>
      
      {confirmationSuccess && (
        <div className={`${styles.alert} ${styles.alertSuccess}`} role="alert">
          <span className={styles.alertText}>✅ Email confirmed successfully! You can now sign in to your account.</span>
        </div>
      )}
      
      {error && (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          <span className={styles.alertText}>{error}</span>
        </div>
      )}
      
      {loginSuccess && (
        <div className={`${styles.alert} ${styles.alertSuccess}`} role="alert">
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className={styles.alertText}>Sign in successful! Redirecting to home...</span>
          </div>
          <div className="mt-2">
            <Link 
              href="/profile" 
              className="text-sm font-medium text-green-700 underline"
            >
              Click here if you are not redirected automatically
            </Link>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="off"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            placeholder="you@example.com"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="off"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            placeholder="••••••••"
          />
        </div>
        
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`${styles.button} ${isLoading ? styles.buttonLoading : ''}`}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </form>
      
      <div className={styles.linkSection}>
        <p className={styles.linkText}>
          Don't have an account?{' '}
          <Link href="/auth/signup" className={styles.link}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

