"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

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
    <div className="max-w-md w-full mx-auto p-6 bg-card rounded-lg shadow-md text-foreground">
      <h2 className="text-2xl font-bold text-center mb-6">
        Create your FitSage account
      </h2>

      {error && (
        <div
          className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
        >
          <span className="block text-red-800">{error}</span>
        </div>
      )}

      {success && (
        <div
          className="p-4 mb-4 bg-green-50 border border-green-200 rounded-lg"
          role="alert"
        >
          <span className="block text-green-800">
            Account created successfully! Please check your email for a
            confirmation link.
          </span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
        autoComplete="off"
      >
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
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
            className="w-full px-3 py-2 border border-border rounded-md shadow-sm bg-input text-foreground placeholder:text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
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
            className="w-full px-3 py-2 border border-border rounded-md shadow-sm bg-input text-foreground placeholder:text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-2"
          >
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
            className="w-full px-3 py-2 border border-border rounded-md shadow-sm bg-input text-foreground placeholder:text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            placeholder="••••••••"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full px-4 py-2 rounded-md font-medium text-white transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
              isLoading
                ? "bg-primary/75 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90 hover:-translate-y-0.5 shadow-md hover:shadow-lg"
            }`}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-foreground">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-primary hover:text-primary/80 underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
