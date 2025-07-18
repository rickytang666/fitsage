'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import Sidebar from '@/components/dashboard/Sidebar';

type LayoutWrapperProps = {
  children: React.ReactNode;
};

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();

  // Don't show sidebar on auth pages
  const isAuthPage = pathname.startsWith('/auth');
  
  // Don't show sidebar if user just signed out (even if user state hasn't cleared yet)
  const justSignedOut = searchParams.get('signedOut') === 'true';
  
  // Don't show sidebar on root path (intro page) unless user is authenticated and didn't just sign out
  const isRootPath = pathname === '/';
  
  // Don't show sidebar if user is not authenticated (unless on auth pages)
  const shouldShowSidebar = !isAuthPage && !isLoading && user && !justSignedOut && !isRootPath;

  if (shouldShowSidebar) {
    return (
      <div className="flex h-screen bg-gray-50">
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
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
