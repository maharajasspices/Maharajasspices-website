/**
 * Client-side rate limiter for form submissions and API calls
 * This provides UX protection against accidental rapid submissions
 * Note: This is NOT a security measure - server-side rate limiting is required for security
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class ClientRateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly defaultLimit = 5;
  private readonly defaultWindow = 60000; // 1 minute

  /**
   * Check if an action is allowed under rate limits
   * @param key - Unique identifier for the action (e.g., 'contact-form', 'checkout')
   * @param limit - Maximum number of attempts (default: 5)
   * @param windowMs - Time window in milliseconds (default: 60000)
   * @returns Object with allowed status and retry time if blocked
   */
  checkLimit(key: string, limit: number = this.defaultLimit, windowMs: number = this.defaultWindow): {
    allowed: boolean;
    retryAfter?: number;
  } {
    const now = Date.now();
    const entry = this.limits.get(key);

    // No entry or expired window - allow and create new entry
    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return { allowed: true };
    }

    // Within window - check if under limit
    if (entry.count < limit) {
      entry.count++;
      return { allowed: true };
    }

    // Over limit - calculate retry time
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  /**
   * Reset rate limit for a specific key
   * @param key - The key to reset
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.limits.clear();
  }

  /**
   * Clean up expired entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

export const rateLimiter = new ClientRateLimiter();

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}
