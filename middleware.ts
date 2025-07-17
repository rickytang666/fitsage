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
    
    // Skip middleware for API routes and auth callback
    if (path.startsWith('/api/') || path === '/auth/callback') {
      return NextResponse.next();
    }
    
    // Create response first
    const response = NextResponse.next();
    
    // Create supabase client - ensure we're using the same session storage
    const supabase = createMiddlewareClient(
      { req: request, res: response },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      }
    );
    
    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    
    const isAuthPath = AUTH_PATHS.includes(path);
    const isProtectedPath = PROTECTED_PATHS.includes(path);
    
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
