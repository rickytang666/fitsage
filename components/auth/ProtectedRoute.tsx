'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

// Loading component to show while auth state is being checked
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  );
}

type ProtectedRouteProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

// HOC for protecting routes that require authentication
export default function ProtectedRoute({ 
  children,
  redirectTo = '/auth/login'
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after we confirm user is not authenticated (and not still loading)
    if (!isLoading && !user) {
      router.push(redirectTo);
    }
  }, [user, isLoading, router, redirectTo]);

  // Show loading screen while checking auth state
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If user is not authenticated, show loading until redirect happens
  if (!user) {
    return <LoadingScreen />;
  }

  // If the user is authenticated, render the children
  return <>{children}</>;
}
