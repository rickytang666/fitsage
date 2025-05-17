'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Local storage keys - must match AuthProvider
const AUTH_KEY = 'fitsage_auth';

// Simple loading component
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

// Simplified protected route component
export default function ProtectedRoute({ 
  children,
  redirectTo = '/auth/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // One-time check on mount
  useEffect(() => {
    // Check localStorage for auth state
    const checkAuth = () => {
      const storedAuth = localStorage.getItem(AUTH_KEY);
      
      if (storedAuth === 'true') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.push(redirectTo);
      }
    };
    
    checkAuth();
  }, [redirectTo, router]);

  // Show loading screen while checking auth state
  if (isAuthenticated === null) {
    return <LoadingScreen />;
  }
  
  // If the user is authenticated, render the children
  if (isAuthenticated) {
    return <>{children}</>;
  }
  
  // Otherwise show loading while redirect happens
  return <LoadingScreen />;
}
