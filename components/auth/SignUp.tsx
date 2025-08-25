"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import styles from "./Auth.module.css";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset states
    setError(null);
    setSuccess(false);

    // Validate form
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password);

      if (error) {
        if (error.message?.includes("already registered")) {
          setError(
            "This email is already registered. Please try signing in instead."
          );
        } else {
          setError(error.message || "Failed to sign up. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      // Success
      setSuccess(true);
      setIsLoading(false);

      // Reset form
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <h2 className={styles.title}>Create your FitSage account</h2>

      {error && (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          <span className={styles.alertText}>{error}</span>
        </div>
      )}

      {success && (
        <div className={`${styles.alert} ${styles.alertSuccess}`} role="alert">
          <span className={styles.alertText}>
            Account created successfully! Please check your email for a
            confirmation link.
          </span>
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

        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword" className={styles.label}>
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="off"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.input}
            placeholder="••••••••"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`${styles.button} ${
              isLoading ? styles.buttonLoading : ""
            }`}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </div>
      </form>

      <div className={styles.signupLink}>
        <p>
          Already have an account?{" "}
          <Link href="/auth/login" className={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
