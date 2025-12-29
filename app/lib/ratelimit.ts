/**
 * Rate Limiting - Redis-based API throttling
 *
 * Security Fix: 2025 OWASP Standards - Implements rate limiting to prevent:
 * - Brute-force attacks on authentication
 * - Account enumeration
 * - DoS attacks
 *
 * Supports both Railway Redis (standard protocol) and Upstash Redis (REST API).
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis as UpstashRedis } from '@upstash/redis';
import IORedis from 'ioredis';

// Type-safe Redis client interface for @upstash/ratelimit
interface RedisClient {
  sadd: (key: string, ...members: string[]) => Promise<number>;
  eval: (script: string, keys: string[], args: string[]) => Promise<unknown>;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, opts?: { ex?: number }) => Promise<string>;
  incr: (key: string) => Promise<number>;
  decr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<number>;
  del: (...keys: string[]) => Promise<number>;
}

/**
 * Initialize Redis client based on environment configuration
 */
function initializeRedis(): RedisClient {
  const redisUrl = process.env.REDIS_URL;
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Priority 1: Railway Redis (standard protocol)
  if (redisUrl && !upstashUrl) {
    try {
      const ioredis = new IORedis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        enableOfflineQueue: true,
        lazyConnect: false,
        retryStrategy(times: number) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      // Connection event listeners
      ioredis.on('connect', () => {
        console.log('[RateLimit] Successfully connected to Railway Redis');
      });

      ioredis.on('error', (err: Error) => {
        console.error('[RateLimit] Railway Redis connection error:', err.message);
      });

      ioredis.on('ready', () => {
        console.log('[RateLimit] Railway Redis ready for commands');
      });

      // Wrap ioredis to be compatible with @upstash/ratelimit
      const wrappedClient: RedisClient = {
        sadd: async (key: string, ...members: string[]) => {
          return await ioredis.sadd(key, ...members);
        },
        eval: async (script: string, keys: string[], args: string[]) => {
          return await ioredis.eval(script, keys.length, ...keys, ...args);
        },
        get: async (key: string) => {
          return await ioredis.get(key);
        },
        set: async (key: string, value: string, opts?: { ex?: number }) => {
          if (opts?.ex) {
            return await ioredis.set(key, value, 'EX', opts.ex);
          }
          return await ioredis.set(key, value);
        },
        incr: async (key: string) => {
          return await ioredis.incr(key);
        },
        decr: async (key: string) => {
          return await ioredis.decr(key);
        },
        expire: async (key: string, seconds: number) => {
          return await ioredis.expire(key, seconds);
        },
        del: async (...keys: string[]) => {
          return await ioredis.del(...keys);
        },
      };

      console.log('[RateLimit] Initialized Railway Redis client');
      return wrappedClient;
    } catch (error) {
      console.error('[RateLimit] Failed to initialize Railway Redis:', error);
      return createMockRedis();
    }
  }

  // Priority 2: Upstash Redis (REST API)
  if (upstashUrl && upstashToken) {
    const upstashClient = new UpstashRedis({
      url: upstashUrl,
      token: upstashToken,
    });
    console.log('[RateLimit] Initialized Upstash Redis client');
    return upstashClient as unknown as RedisClient;
  }

  // Fallback: Mock Redis (fail-open for development)
  console.warn('[RateLimit] No Redis configured - rate limiting disabled (fail-open)');
  return createMockRedis();
}

/**
 * Creates a mock Redis client that allows all requests (fail-open)
 */
function createMockRedis(): RedisClient {
  return {
    sadd: async () => 1,
    eval: async () => null,
    get: async () => null,
    set: async () => 'OK',
    incr: async () => 1,
    decr: async () => 0,
    expire: async () => 1,
    del: async () => 1,
  };
}

// Initialize Redis client once on module load
const redis = initializeRedis();

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
