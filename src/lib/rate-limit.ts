// Rate limiting utilities for data import

// Simple in-memory rate limiter for data import
// In production, use Redis or similar distributed cache
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs; // 1 minute default
    this.maxRequests = maxRequests; // 10 requests per minute default
  }

  async checkLimit(userId: string): Promise<boolean> {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Remove old requests outside the window
    const recentRequests = userRequests.filter(timestamp => now - timestamp < this.windowMs);

    // Check if limit exceeded
    if (recentRequests.length >= this.maxRequests) {
      return false; // Rate limit exceeded
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(userId, recentRequests);

    return true; // Within rate limit
  }

  // Clean up old entries periodically (basic memory management)
  cleanup(): void {
    const now = Date.now();
    for (const [userId, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(timestamp => now - timestamp < this.windowMs);

      if (recentRequests.length === 0) {
        this.requests.delete(userId);
      } else {
        this.requests.set(userId, recentRequests);
      }
    }
  }
}

// Create rate limiter for data import: 5 requests per minute per user
export const dataImportRateLimiter = new RateLimiter(60000, 5);

// Cleanup every 5 minutes
setInterval(
  () => {
    dataImportRateLimiter.cleanup();
  },
  5 * 60 * 1000,
);

export async function checkRateLimit(userId: string): Promise<Response | null> {
  const allowed = await dataImportRateLimiter.checkLimit(userId);

  if (!allowed) {
    return Response.json(
      {
        error: 'Rate limit exceeded. Maximum 5 data import requests per minute.',
        retryAfter: 60,
      },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Window': '60',
        },
      },
    );
  }

  return null; // No rate limit hit
}
