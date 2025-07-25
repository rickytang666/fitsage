/**
 * Improved rate limiter for Gemini API calls
 * More reasonable limits based on actual Gemini API capabilities
 */

interface RateLimitState {
  lastRequest: number;
  requestCount: number;
  windowStart: number;
  adaptiveDelay: number; // Adaptive delay based on API response times
  recentErrors: { timestamp: number; type: string }[];
}

export interface RateLimitStatus {
  canMakeRequest: boolean;
  requestsInWindow: number;
  maxRequests: number;
  waitTime: number;
  timeUntilWindowReset: number;
  adaptiveDelay: number;
  recentErrorCount: number;
}

class ImprovedRateLimiter {
  private state: RateLimitState = {
    lastRequest: 0,
    requestCount: 0,
    windowStart: Date.now(),
    adaptiveDelay: 1000, // Start with 1 second
    recentErrors: []
  };

  // More reasonable configuration based on Gemini API capabilities
  private readonly config = {
    maxRequestsPerMinute: 30, // Increased from 15 (more reasonable)
    baseMinDelay: 1000, // Base 1 second between requests (reduced from 3s)
    maxAdaptiveDelay: 10000, // Max 10 seconds if errors occur
    windowDuration: 60000, // 1 minute window
    errorTrackingWindow: 300000, // Track errors for 5 minutes
  };

  /**
   * Check if we can make a request now
   */
  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Clean old errors
    this.cleanOldErrors(now);
    
    // Reset window if it's expired
    if (now - this.state.windowStart >= this.config.windowDuration) {
      this.state.windowStart = now;
      this.state.requestCount = 0;
    }

    // Check if we've hit the requests per minute limit
    if (this.state.requestCount >= this.config.maxRequestsPerMinute) {
      return false;
    }

    // Use adaptive delay instead of fixed delay
    const currentDelay = Math.max(this.config.baseMinDelay, this.state.adaptiveDelay);
    
    // Check minimum time between requests (adaptive)
    if (now - this.state.lastRequest < currentDelay) {
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
    
    // Time until adaptive delay is satisfied
    const currentDelay = Math.max(this.config.baseMinDelay, this.state.adaptiveDelay);
    const intervalWait = this.state.lastRequest + currentDelay - now;
    
    // If we've hit rate limit, wait until window resets
    if (this.state.requestCount >= this.config.maxRequestsPerMinute) {
      return Math.max(0, windowReset);
    }
    
    // Otherwise wait for adaptive interval
    return Math.max(0, intervalWait);
  }

  /**
   * Record that a request was made successfully
   */
  recordRequest(): void {
    const now = Date.now();
    this.state.lastRequest = now;
    this.state.requestCount++;
    
    // Reduce adaptive delay on successful requests (faster recovery)
    this.state.adaptiveDelay = Math.max(
      this.config.baseMinDelay,
      this.state.adaptiveDelay * 0.9 // Gradually reduce delay
    );
  }

  /**
   * Record an error to adapt future request timing
   */
  recordError(errorType: 'rate_limit' | 'service_unavailable' | 'other', errorMessage?: string): void {
    const now = Date.now();
    
    this.state.recentErrors.push({
      timestamp: now,
      type: errorType
    });

    // Adapt delay based on error type
    switch (errorType) {
      case 'rate_limit':
        // Significantly increase delay for rate limits
        this.state.adaptiveDelay = Math.min(
          this.config.maxAdaptiveDelay,
          this.state.adaptiveDelay * 2
        );
        console.log(`🚫 Rate limit detected, increasing delay to ${this.state.adaptiveDelay}ms`);
        break;
        
      case 'service_unavailable':
        // Moderate increase for service issues
        this.state.adaptiveDelay = Math.min(
          this.config.maxAdaptiveDelay,
          this.state.adaptiveDelay * 1.5
        );
        console.log(`⚠️ Service unavailable, increasing delay to ${this.state.adaptiveDelay}ms`);
        break;
        
      case 'other':
        // Small increase for other errors
        this.state.adaptiveDelay = Math.min(
          this.config.maxAdaptiveDelay,
          this.state.adaptiveDelay * 1.2
        );
        break;
    }

    this.cleanOldErrors(now);
  }

  /**
   * Clean errors older than the tracking window
   */
  private cleanOldErrors(now: number): void {
    this.state.recentErrors = this.state.recentErrors.filter(
      error => now - error.timestamp < this.config.errorTrackingWindow
    );
  }

  /**
   * Get current status for debugging
   */
  getStatus(): RateLimitStatus {
    const now = Date.now();
    this.cleanOldErrors(now);
    
    return {
      canMakeRequest: this.canMakeRequest(),
      requestsInWindow: this.state.requestCount,
      maxRequests: this.config.maxRequestsPerMinute,
      waitTime: this.getWaitTime(),
      timeUntilWindowReset: Math.max(0, this.state.windowStart + this.config.windowDuration - now),
      adaptiveDelay: this.state.adaptiveDelay,
      recentErrorCount: this.state.recentErrors.length
    };
  }

  /**
   * Reset the rate limiter (useful for testing)
   */
  reset(): void {
    this.state = {
      lastRequest: 0,
      requestCount: 0,
      windowStart: Date.now(),
      adaptiveDelay: this.config.baseMinDelay,
      recentErrors: []
    };
  }

  /**
   * Get configuration for debugging
   */
  getConfig() {
    return { ...this.config };
  }
}

// Create singleton instance for consistent state across the app
export const improvedGeminiRateLimiter = new ImprovedRateLimiter();

/**
 * Helper function to wait for rate limit clearance
 */
export async function waitForRateLimit(): Promise<void> {
  const waitTime = improvedGeminiRateLimiter.getWaitTime();
  if (waitTime > 0) {
    console.log(`⏳ Waiting ${waitTime}ms for rate limit clearance...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
}

/**
 * Helper function to check if an error is rate limit related
 */
export function isRateLimitError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  const status = error.status;
  
  return status === 429 || 
         message.includes('rate') || 
         message.includes('quota') ||
         message.includes('limit');
} 