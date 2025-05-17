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

// Paths that should redirect to dashboard if user is already authenticated
const AUTH_PATHS = [
  '/auth/login',
  '/auth/signup',
];

export async function middleware(request: NextRequest) {
  try {
    // Create supabase middleware client
    const response = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res: response });

    // Get session
    const { data: { session }} = await supabase.auth.getSession();
    const path = request.nextUrl.pathname;

    // Check if the path is protected and user is not authenticated
    if (PROTECTED_PATHS.some(protectedPath => path.startsWith(protectedPath)) && !session) {
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if the path is auth and user is already authenticated
    if (AUTH_PATHS.some(authPath => path.startsWith(authPath)) && session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
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

