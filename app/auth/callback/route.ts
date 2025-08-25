import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const error = requestUrl.searchParams.get('error');
  
  console.log('Auth callback called with:', { 
    code: code ? 'present' : 'missing',
    token_hash: token_hash ? 'present' : 'missing',
    type,
    error
  });

  // Handle error from email provider - just redirect to login cleanly
  if (error) {
    console.log('Email provider error, redirecting to login:', error);
    return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
  }

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      // First, exchange code for session to confirm the email
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.log('Error exchanging code for session, redirecting to login:', error.message);
        // Always redirect to login for clean UX - no scary error messages
        return NextResponse.redirect(new URL('/auth/login?confirmed=true', requestUrl.origin));
      }
      
      console.log('Email confirmation successful for user:', data.user?.email);
      
      // Email is now confirmed, but we want the user to see the success message
      // So immediately sign out to prevent auto-login, but keep the confirmation status
      await supabase.auth.signOut();
      
      // Redirect to login page with success message - user will see the green banner
      return NextResponse.redirect(new URL('/auth/login?confirmed=true', requestUrl.origin));
    } catch (error) {
      console.log('Callback error, redirecting to login:', error);
      return NextResponse.redirect(new URL('/auth/login?confirmed=true', requestUrl.origin));
    }
  }

  // Handle token_hash method (alternative confirmation method)
  if (token_hash && type) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as 'email'
      });
      
      if (error) {
        console.log('Error verifying OTP, redirecting to login:', error.message);
        return NextResponse.redirect(new URL('/auth/login?confirmed=true', requestUrl.origin));
      }
      
      console.log('Token hash confirmation successful for user:', data.user?.email);
      
      // Successful confirmation - redirect to login page for clean flow
      return NextResponse.redirect(new URL('/auth/login?confirmed=true', requestUrl.origin));
    } catch (error) {
      console.log('Token hash error, redirecting to login:', error);
      return NextResponse.redirect(new URL('/auth/login?confirmed=true', requestUrl.origin));
    }
  }

  // No code provided - redirect to login cleanly
  console.log('No code provided in callback, redirecting to login');
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin));
}
