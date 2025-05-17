'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  preventRedirectsDuringNavigation?: boolean;
};

// HOC for protecting routes that require authentication
export default function ProtectedRoute({ 
  children,
  redirectTo = '/auth/login',
  preventRedirectsDuringNavigation = false
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const isNavigatingRef = useRef(false);
  const lastPathRef = useRef(pathname);

  // First useEffect just to mark initial load as complete after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoadComplete(true);
    }, 500); // Allow time for auth to initialize

    return () => clearTimeout(timer);
  }, []);

  // Track navigation between dashboard pages
  useEffect(() => {
    if (lastPathRef.current !== pathname) {
      isNavigatingRef.current = true;
      // Reset navigation state after a delay
      const timer = setTimeout(() => {
        isNavigatingRef.current = false;
        lastPathRef.current = pathname;
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Handle auth state changes and redirects
  useEffect(() => {
    // Skip redirect if explicitly prevented by props or if user is navigating
    if (preventRedirectsDuringNavigation || isNavigatingRef.current) {
      console.log("Skipping redirect during navigation");
      return;
    }

    // Only redirect after initial load and when we confirm user is not authenticated
    if (initialLoadComplete && !isLoading && !user) {
      // Don't redirect if we're already at the login page
      if (!pathname.startsWith(redirectTo)) {
        console.log("Redirecting to login");
        router.push(redirectTo);
      }
    }
  }, [user, isLoading, router, redirectTo, initialLoadComplete, pathname, preventRedirectsDuringNavigation]);

  // Show loading screen while checking auth state
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If user is not authenticated but we're deliberately preventing redirects during navigation,
  // render the children anyway to avoid disrupting the navigation flow
  if (!user && preventRedirectsDuringNavigation) {
    return <>{children}</>;
  }
  
  // If user is not authenticated, show loading until redirect happens
  if (!user) {
    return <LoadingScreen />;
  }

  // If the user is authenticated, render the children
  return <>{children}</>;
}
