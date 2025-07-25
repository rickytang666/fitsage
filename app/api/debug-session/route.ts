import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  // Disable in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Debug endpoints disabled in production' }, { status: 404 });
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    return NextResponse.json({
      session: {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        expiresAt: session?.expires_at,
      },
      user: {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
      },
      error: error?.message,
      cookies: {
        hasCookies: allCookies.length > 0,
        cookieNames: allCookies.map((c) => c.name),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
