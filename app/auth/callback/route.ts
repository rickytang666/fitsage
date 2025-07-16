import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  console.log('Auth callback called with code:', code ? 'present' : 'missing');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(new URL('/auth/login?error=confirmation_failed', requestUrl.origin));
      }
      
      console.log('Email confirmation successful for user:', data.user?.email);
      
      // Successful email confirmation - redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    } catch (error) {
      console.error('Callback error:', error);
      return NextResponse.redirect(new URL('/auth/login?error=confirmation_failed', requestUrl.origin));
    }
  }

  // No code provided - redirect to login
  console.log('No code provided in callback');
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
}
