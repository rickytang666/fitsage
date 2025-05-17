'use client';

// Development version of ProtectedRoute - no auth checks
// TODO: Restore full auth checks before production

type ProtectedRouteProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

// Pass-through component for development
export default function ProtectedRoute({ 
  children,
  redirectTo = '/auth/login',
}: ProtectedRouteProps) {
  // During development, just render children directly without auth checks
  return <>{children}</>;
}
