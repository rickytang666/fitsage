import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Paths that require authentication
const PROTECTED_PATHS = [
  '/dashboard',
  '/profile',
  '/workouts',
  '/diary',
  '/measurements',
];

// Auth paths - redirect to dashboard if user is already authenticated
const AUTH_PATHS = [
  '/auth/login',
  '/auth/signup',
];

export async function middleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;
    
    // Handle root path redirect
    if (path === '/') {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    // Skip middleware for API routes, auth callback, and static files
    if (path.startsWith('/api/') || 
        path === '/auth/callback' ||
        path.startsWith('/_next/') ||
        path.startsWith('/static/') ||
        path.includes('.')) {
      return NextResponse.next();
    }
    
    // Create response first
    const response = NextResponse.next();
    
    // Only check auth for protected paths to reduce API calls
    const isAuthPath = AUTH_PATHS.includes(path);
    const isProtectedPath = PROTECTED_PATHS.some(protectedPath => 
      path === protectedPath || (protectedPath !== '/dashboard' && path.startsWith(protectedPath))
    );
    
    // Skip auth check for non-auth, non-protected paths
    if (!isAuthPath && !isProtectedPath) {
      return response;
    }
    
    // Create supabase client - only when needed
    const supabase = createMiddlewareClient(
      { req: request, res: response },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      }
    );
    
    // Get session - only for auth/protected paths
    const { data: { session } } = await supabase.auth.getSession();
    
    // If user is authenticated and on auth page, redirect to dashboard
    if (session && isAuthPath) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // If user is not authenticated and on protected path, redirect to login
    if (!session && isProtectedPath) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|fitsage_icon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
