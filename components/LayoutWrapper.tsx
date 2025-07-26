'use client';

import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import Sidebar from '@/components/dashboard/Sidebar';

type LayoutWrapperProps = {
  children: React.ReactNode;
};

function LayoutWrapperInner({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoading, isSigningOut } = useAuth();

  // Don't show sidebar on auth pages
  const isAuthPage = pathname.startsWith('/auth');
  
  // Don't show sidebar if user just signed out (even if user state hasn't cleared yet)
  const justSignedOut = searchParams.get('signedOut') === 'true';
  
  // Don't show sidebar on root path (intro page) unless user is authenticated and didn't just sign out
  const isRootPath = pathname === '/';
  
  // Don't show sidebar if user is not authenticated, is signing out, or is loading
  const shouldShowSidebar = !isAuthPage && !isLoading && !isSigningOut && user && !justSignedOut && !isRootPath;

  // If signing out, show loading state immediately to prevent any flashing
  if (isSigningOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Signing out...</p>
        </div>
      </div>
    );
  }

  if (shouldShowSidebar) {
    return (
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content area */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    );
  }

  // No sidebar - just show content (for auth pages, intro page, or when not authenticated)
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LayoutWrapperInner>
        {children}
      </LayoutWrapperInner>
    </Suspense>
  );
}
