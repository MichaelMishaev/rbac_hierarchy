/**
 * Rate Limiting - Redis-based API throttling
 *
 * Security Fix: 2025 OWASP Standards - Implements rate limiting to prevent:
 * - Brute-force attacks on authentication
 * - Account enumeration
 * - DoS attacks
 *
 * Uses Upstash Redis for distributed rate limiting with sliding window algorithm.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL || 'http://localhost:8079',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'development_token',
});

/**
 * Login endpoint rate limiter
 * 5 attempts per minute per IP (OWASP 2025 recommendation)
 */
export const loginRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'ratelimit:login',
});

/**
 * Password change rate limiter
 * 5 attempts per day per user (OWASP 2025 recommendation)
 */
export const passwordChangeRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 d'),
  analytics: true,
  prefix: 'ratelimit:password',
});

/**
 * API endpoint rate limiter
 * 60 requests per minute per user (general API protection)
 */
export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
  prefix: 'ratelimit:api',
});

/**
 * Helper to get client IP from request
 */
export function getClientIP(request: Request): string {
  // Try various headers in order of preference
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'unknown';
}

/**
 * Check rate limit and return result
 * @param rateLimiter - The rate limiter instance to use
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @returns { success: boolean, limit: number, remaining: number, reset: number }
 */
export async function checkRateLimit(
  rateLimiter: Ratelimit,
  identifier: string
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  try {
    const result = await rateLimiter.limit(identifier);
    return result;
  } catch (error) {
    console.error('[RateLimit] Error checking rate limit:', error);
    // Fail open: If Redis is down, allow the request (availability over strict security)
    // In production, you might want to fail closed instead
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
    };
  }
}
