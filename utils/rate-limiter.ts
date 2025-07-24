/**
 * Simple rate limiter for Gemini API calls
 * Helps prevent hitting rate limits by tracking request timing
 */

interface RateLimitState {
  lastRequest: number;
  requestCount: number;
  windowStart: number;
}

class RateLimiter {
  private state: RateLimitState = {
    lastRequest: 0,
    requestCount: 0,
    windowStart: Date.now()
  };

  // Configuration based on Gemini API limits
  private readonly config = {
    maxRequestsPerMinute: 20, // Slightly higher limit since we have separate limiters
    minTimeBetweenRequests: 2000, // 2 seconds between requests (reduced from 4s)
    windowDuration: 60000, // 1 minute window
  };

  /**
   * Check if we can make a request now
   */
  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Reset window if it's expired
    if (now - this.state.windowStart >= this.config.windowDuration) {
      this.state.windowStart = now;
      this.state.requestCount = 0;
    }

    // Check if we've hit the requests per minute limit
    if (this.state.requestCount >= this.config.maxRequestsPerMinute) {
      return false;
    }

    // Check minimum time between requests
    if (now - this.state.lastRequest < this.config.minTimeBetweenRequests) {
      return false;
    }

    return true;
  }

  /**
   * Get how long to wait before next request is allowed
   */
  getWaitTime(): number {
    const now = Date.now();
    
    // Time until window resets
    const windowReset = this.state.windowStart + this.config.windowDuration - now;
    
    // Time until minimum interval is satisfied
    const intervalWait = this.state.lastRequest + this.config.minTimeBetweenRequests - now;
    
    // If we've hit rate limit, wait until window resets
    if (this.state.requestCount >= this.config.maxRequestsPerMinute) {
      return Math.max(0, windowReset);
    }
    
    // Otherwise wait for minimum interval
    return Math.max(0, intervalWait);
  }

  /**
   * Record that a request was made
   */
  recordRequest(): void {
    const now = Date.now();
    this.state.lastRequest = now;
    this.state.requestCount++;
  }

  /**
   * Get current status for debugging
   */
  getStatus(): {
    canMakeRequest: boolean;
    requestsInWindow: number;
    maxRequests: number;
    waitTime: number;
    timeUntilWindowReset: number;
  } {
    const now = Date.now();
    return {
      canMakeRequest: this.canMakeRequest(),
      requestsInWindow: this.state.requestCount,
      maxRequests: this.config.maxRequestsPerMinute,
      waitTime: this.getWaitTime(),
      timeUntilWindowReset: Math.max(0, this.state.windowStart + this.config.windowDuration - now),
    };
  }
}

// Export separate instances for different routes
export const geminiRateLimiter = new RateLimiter(); // For diary summarize
export const featuredWorkoutsRateLimiter = new RateLimiter(); // For featured workouts

/**
 * Utility function to wait for rate limit to reset
 */
export async function waitForRateLimit(limiter: RateLimiter = geminiRateLimiter): Promise<void> {
  const waitTime = limiter.getWaitTime();
  if (waitTime > 0) {
    console.log(`⏳ Rate limit active, waiting ${Math.ceil(waitTime / 1000)}s before next API call...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
}

/**
 * Check if an error is rate limit related
 */
export function isRateLimitError(error: any): boolean {
  if (error instanceof Error) {
    return error.message.includes('429') || 
           error.message.includes('Rate limit') || 
           error.message.includes('quota exceeded');
  }
  return false;
}

export default geminiRateLimiter;
