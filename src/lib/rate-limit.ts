/**
 * Simple in-memory rate limiter
 * In production, consider using Redis or Upstash for distributed rate limiting
 */

interface RateLimitEntry {
  count: number;
  lastReset: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now - entry.lastReset > 3600000) { // 1 hour
      rateLimitMap.delete(key);
    }
  }
}, 300000);

interface RateLimitConfig {
  maxRequests: number; // Maximum requests allowed
  windowMs: number; // Time window in milliseconds
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // milliseconds until reset
  message?: string;
}

/**
 * Check rate limit for a given identifier
 * @param identifier - Unique identifier (e.g., IP, user ID, or combination)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now - entry.lastReset >= config.windowMs) {
    // First request or window has expired, reset
    rateLimitMap.set(identifier, { count: 1, lastReset: now });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    const resetIn = config.windowMs - (now - entry.lastReset);
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      message: `Rate limit exceeded. Try again in ${Math.ceil(resetIn / 1000)} seconds.`,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: config.windowMs - (now - entry.lastReset),
  };
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // Very strict: 3 requests per minute (for sensitive operations like payments)
  strict: (identifier: string) =>
    checkRateLimit(identifier, { maxRequests: 3, windowMs: 60000 }),
  
  // Standard: 10 requests per minute
  standard: (identifier: string) =>
    checkRateLimit(identifier, { maxRequests: 10, windowMs: 60000 }),
  
  // Relaxed: 30 requests per minute
  relaxed: (identifier: string) =>
    checkRateLimit(identifier, { maxRequests: 30, windowMs: 60000 }),
  
  // API: 100 requests per minute
  api: (identifier: string) =>
    checkRateLimit(identifier, { maxRequests: 100, windowMs: 60000 }),
};

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetIn / 1000).toString(),
  };
}
