import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  
  console.log('Auth callback called with:', { 
    code: code ? 'present' : 'missing',
    token_hash: token_hash ? 'present' : 'missing',
    type 
  });

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

  // Handle token_hash method (alternative confirmation method)
  if (token_hash && type) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any
      });
      
      if (error) {
        console.error('Error verifying OTP:', error);
        return NextResponse.redirect(new URL('/auth/login?error=confirmation_failed', requestUrl.origin));
      }
      
      console.log('Token hash confirmation successful for user:', data.user?.email);
      
      // Successful confirmation - redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    } catch (error) {
      console.error('Token hash error:', error);
      return NextResponse.redirect(new URL('/auth/login?error=confirmation_failed', requestUrl.origin));
    }
  }

  // No code provided - redirect to login
  console.log('No code provided in callback');
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
}
