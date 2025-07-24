import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Simple in-memory cache for session validation to reduce Supabase requests
const sessionCache = new Map<string, { session: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache

// Paths that require authentication
const PROTECTED_PATHS = [
  '/profile',
  '/workouts',
  '/diary',
];

// Auth paths - redirect to home if user is already authenticated
const AUTH_PATHS = [
  '/auth/login',
  '/auth/signup',
];

export async function middleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;
    const searchParams = request.nextUrl.searchParams;
    
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
    
    // Only check auth for protected paths, auth paths, and root path to reduce API calls
    const isAuthPath = AUTH_PATHS.includes(path);
    const isProtectedPath = PROTECTED_PATHS.some(protectedPath => 
      path === protectedPath || (protectedPath !== '/profile' && path.startsWith(protectedPath))
    );
    const isRootPath = path === '/';
    
    // Skip auth check for non-auth, non-protected, non-root paths
    if (!isAuthPath && !isProtectedPath && !isRootPath) {
      return response;
    }
    
    // If user just signed out, allow them to see intro page
    if (isRootPath && searchParams.get('signedOut') === 'true') {
      return response;
    }
    
    // If there's a code parameter at root, redirect to auth callback
    if (isRootPath && searchParams.get('code')) {
      const callbackUrl = new URL('/auth/callback', request.url);
      // Preserve all search parameters for the callback
      searchParams.forEach((value, key) => {
        callbackUrl.searchParams.set(key, value);
      });
      return NextResponse.redirect(callbackUrl);
    }
    
    // Create cache key based on request cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const cacheKey = `session_${Buffer.from(cookieHeader).toString('base64').slice(0, 50)}`;
    
    // Check cache first to avoid unnecessary Supabase requests
    const cached = sessionCache.get(cacheKey);
    let session = null;
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      // Use cached session
      session = cached.session;
      console.log('🚀 Using cached session for middleware');
    } else {
      // Create supabase client - only when needed and not cached
      const supabase = createMiddlewareClient(
        { req: request, res: response },
        {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        }
      );
      
      // Get session - only for auth/protected/root paths
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      session = freshSession;
      
      // Cache the session
      sessionCache.set(cacheKey, { session, timestamp: Date.now() });
      
      // Clean up old cache entries (simple cleanup)
      if (sessionCache.size > 100) {
        const oldKeys = Array.from(sessionCache.keys()).slice(0, 20);
        oldKeys.forEach(key => sessionCache.delete(key));
      }
    }
    
    // If user is authenticated and on auth page, redirect to home
    if (session && isAuthPath) {
      return NextResponse.redirect(new URL('/profile', request.url));
    }
    
    // If user is authenticated and on root path, redirect to home
    if (session && isRootPath) {
      return NextResponse.redirect(new URL('/profile', request.url));
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
