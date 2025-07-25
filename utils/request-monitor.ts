/**
 * Request monitoring utility to help debug excessive API calls
 * This helps identify which requests are being made frequently
 */

interface RequestLog {
  url: string;
  method: string;
  timestamp: number;
  count: number;
}

class RequestMonitor {
  private requests: Map<string, RequestLog> = new Map();
  private isEnabled: boolean = false;

  // Enable monitoring (only in development)
  enable() {
    if (process.env.NODE_ENV === 'development') {
      this.isEnabled = true;
      console.log('🔍 Request monitoring enabled');
      
      // Monitor fetch requests
      this.interceptFetch();
      
      // Report excessive requests every 30 seconds
      setInterval(() => {
        this.reportExcessiveRequests();
      }, 30000);
    }
  }

  private interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [input, init] = args;
      const url = typeof input === 'string' ? input : input.url;
      const method = init?.method || 'GET';
      
      // Log the request
      this.logRequest(url, method);
      
      // Call original fetch
      return originalFetch.apply(window, args);
    };
  }

  private logRequest(url: string, method: string) {
    if (!this.isEnabled) return;

    const key = `${method}:${url}`;
    const now = Date.now();
    
    if (this.requests.has(key)) {
      const existing = this.requests.get(key)!;
      existing.count++;
      existing.timestamp = now;
    } else {
      this.requests.set(key, {
        url,
        method,
        timestamp: now,
        count: 1
      });
    }
  }

  private reportExcessiveRequests() {
    if (!this.isEnabled || this.requests.size === 0) return;

    const now = Date.now();
    const recentRequests = Array.from(this.requests.values())
      .filter(req => now - req.timestamp < 60000) // Last minute
      .filter(req => req.count > 5) // More than 5 requests
      .sort((a, b) => b.count - a.count);

    if (recentRequests.length > 0) {
      console.warn('⚠️ Excessive requests detected:');
      recentRequests.forEach(req => {
        console.warn(`  ${req.method} ${req.url}: ${req.count} requests in last minute`);
      });
    }

    // Clean up old requests
    Array.from(this.requests.entries()).forEach(([key, req]) => {
      if (now - req.timestamp > 300000) { // 5 minutes old
        this.requests.delete(key);
      }
    });
  }

  // Get current request stats
  getStats() {
    const now = Date.now();
    return Array.from(this.requests.values())
      .filter(req => now - req.timestamp < 60000)
      .sort((a, b) => b.count - a.count);
  }

  // Clear all logs
  clear() {
    this.requests.clear();
  }
}

export const requestMonitor = new RequestMonitor();

// Auto-enable in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  requestMonitor.enable();
}
