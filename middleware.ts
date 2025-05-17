import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Paths that require authentication
const PROTECTED_PATHS = [
  '/dashboard',
  '/profile',
  '/workouts',
  '/nutrition',
  '/goals',
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
    
    // Special case: always allow direct access to dashboard after login
    // This prevents redirect loops during authentication
    const fromAuth = request.headers.get('referer')?.includes('/auth/');
    if (path === '/dashboard' && fromAuth) {
      return NextResponse.next();
    }
    
    // Create supabase middleware client
    const response = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res: response });

    // Get session with error handling
    let session = null;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data) {
        session = data.session;
      }
    } catch (sessionError) {
      console.error('Session fetch error:', sessionError);
      // Continue without session on error
    }

    // Handle protected routes - redirect to login if not authenticated
    if (PROTECTED_PATHS.some(protectedPath => path.startsWith(protectedPath))) {
      if (!session) {
        const redirectUrl = new URL('/auth/login', request.url);
        redirectUrl.searchParams.set('redirect', path);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Handle auth routes - redirect to dashboard if already authenticated
    // Skip this check for POST requests or if coming from dashboard
    const isGetRequest = request.method.toLowerCase() === 'get';
    if (isGetRequest && AUTH_PATHS.some(authPath => path.startsWith(authPath))) {
      if (session) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
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
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

