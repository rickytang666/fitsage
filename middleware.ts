import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

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
    
    // Create supabase middleware client
    const response = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res: response });

    // Get session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Middleware auth error:', error);
    }

    // Check if user is authenticated
    const isAuthenticated = !!session;

    // Handle protected routes
    if (PROTECTED_PATHS.some(protectedPath => path.startsWith(protectedPath))) {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }

    // Handle auth routes (login/signup)
    if (AUTH_PATHS.some(authPath => path.startsWith(authPath))) {
      if (isAuthenticated) {
        // Redirect to dashboard if already authenticated
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Handle root path
    if (path === '/') {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/auth/login', request.url));
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
     * - public folder files
     */
    '/((?!_next/static|_next/image|fitsage_icon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
