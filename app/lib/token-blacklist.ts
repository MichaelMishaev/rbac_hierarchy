/**
 * Token Blacklist - Redis-based JWT revocation system
 *
 * Security Fix: VULN-AUTH-002 - Implements token blacklisting to prevent
 * compromised or logged-out tokens from being reused.
 *
 * Uses Redis for fast, distributed token invalidation with automatic expiry.
 *
 * IMPORTANT: This module uses dynamic imports to avoid bundling Redis in Edge Runtime.
 * All functions gracefully degrade if Redis is unavailable.
 */

import type { RedisClientType } from 'redis';

// Create Redis client for token blacklist
let redisClient: RedisClientType | null = null;

async function getRedisClient() {
  if (!redisClient) {
    // Dynamic import to avoid bundling in Edge Runtime
    const { createClient } = await import('redis');

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6381';

    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('[Token Blacklist] Max Redis reconnection attempts reached');
            return new Error('Redis connection failed');
          }
          // Exponential backoff: 50ms, 100ms, 200ms, etc.
          return Math.min(retries * 50, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('[Token Blacklist] Redis error:', err);
    });

    redisClient.on('connect', () => {
      console.log('[Token Blacklist] Redis connected');
    });

    try {
      await redisClient.connect();
    } catch (error) {
      console.error('[Token Blacklist] Failed to connect to Redis:', error);
      redisClient = null;
      throw error;
    }
  }

  return redisClient;
}

/**
 * Blacklist a JWT token by its JTI (JWT ID)
 *
 * @param jti - Unique JWT token identifier
 * @param ttl - Time to live in seconds (should match JWT expiration)
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * await blacklistToken('abc-123-def', 1 * 24 * 60 * 60); // 1 day (matches JWT maxAge)
 * ```
 */
export async function blacklistToken(jti: string, ttl: number): Promise<void> {
  try {
    const client = await getRedisClient();
    const key = `jwt:blacklist:${jti}`;

    // Store token ID with expiry matching JWT lifetime
    // Value is timestamp of when token was blacklisted
    await client.set(key, new Date().toISOString(), {
      EX: ttl, // Automatic expiry (Redis removes key after TTL)
    });

    console.log(`[Token Blacklist] Blacklisted token ${jti} with TTL ${ttl}s`);
  } catch (error) {
    console.error('[Token Blacklist] Failed to blacklist token:', error);
    // Don't throw - graceful degradation if Redis is down
    // Log to monitoring system in production
  }
}

/**
 * Check if a JWT token is blacklisted
 *
 * @param jti - Unique JWT token identifier
 * @returns Promise<boolean> - true if blacklisted, false otherwise
 *
 * @example
 * ```ts
 * if (await isTokenBlacklisted('abc-123-def')) {
 *   return new Response('Unauthorized', { status: 401 });
 * }
 * ```
 */
export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    const key = `jwt:blacklist:${jti}`;

    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    console.error('[Token Blacklist] Failed to check blacklist:', error);
    // Fail closed: If Redis is down, deny access (security first)
    return true;
  }
}

/**
 * Clear all blacklisted tokens (admin function, use with caution)
 *
 * @returns Promise<number> - Number of tokens cleared
 */
export async function clearBlacklist(): Promise<number> {
  try {
    const client = await getRedisClient();
    const keys = await client.keys('jwt:blacklist:*');

    if (keys.length === 0) {
      return 0;
    }

    await client.del(keys);
    console.log(`[Token Blacklist] Cleared ${keys.length} blacklisted tokens`);
    return keys.length;
  } catch (error) {
    console.error('[Token Blacklist] Failed to clear blacklist:', error);
    throw error;
  }
}

/**
 * Get blacklist statistics (monitoring/debugging)
 *
 * @returns Promise<{ total: number; keys: string[] }>
 */
export async function getBlacklistStats(): Promise<{ total: number; keys: string[] }> {
  try {
    const client = await getRedisClient();
    const keys = await client.keys('jwt:blacklist:*');

    return {
      total: keys.length,
      keys: keys.slice(0, 100), // Limit to first 100 for performance
    };
  } catch (error) {
    console.error('[Token Blacklist] Failed to get stats:', error);
    return { total: 0, keys: [] };
  }
}
