import { NextResponse } from 'next/server';
import { geminiRateLimiter } from '@/utils/rate-limiter';

export async function GET() {
  // Disable in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Debug endpoints disabled in production' }, { status: 404 });
  }

  const status = geminiRateLimiter.getStatus();
  
  return NextResponse.json({
    ...status,
    message: status.canMakeRequest 
      ? '✅ Ready to make API calls' 
      : `⏳ Rate limited - wait ${Math.ceil(status.waitTime / 1000)}s`,
    timestamp: new Date().toISOString()
  });
}
