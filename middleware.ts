import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams;
  
  // Skip middleware for ALL non-essential paths to eliminate excessive requests
  if (path.startsWith('/api/') || 
      path === '/auth/callback' ||
      path.startsWith('/_next/') ||
      path.startsWith('/static/') ||
      path.includes('.') ||
      path === '/') { // Allow root path without auth check
    return NextResponse.next();
  }
  
  // Only handle auth callback redirects
  if (path === '/' && searchParams.get('code')) {
    const callbackUrl = new URL('/auth/callback', request.url);
    searchParams.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(callbackUrl);
  }
  
  // Let the frontend handle all authentication logic
  // This eliminates ALL session checks in middleware
  return NextResponse.next();
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
