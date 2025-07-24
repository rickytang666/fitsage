import { NextResponse } from 'next/server';
import { geminiRateLimiter } from '@/utils/rate-limiter';

export async function GET() {
  const status = geminiRateLimiter.getStatus();
  
  return NextResponse.json({
    ...status,
    message: status.canMakeRequest 
      ? '✅ Ready to make API calls' 
      : `⏳ Rate limited - wait ${Math.ceil(status.waitTime / 1000)}s`,
    timestamp: new Date().toISOString()
  });
}
