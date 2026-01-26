/**
 * Redis Cache Utility - Performance Optimization
 *
 * Provides caching for:
 * - Permission hierarchies (5 min TTL)
 * - Dashboard statistics (30s TTL)
 * - Session data (configurable TTL)
 *
 * @module lib/cache
 */

import IORedis from 'ioredis';

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  PERMISSIONS: 300,    // 5 minutes - permission hierarchies change infrequently
  DASHBOARD_STATS: 30, // 30 seconds - balance between freshness and performance
  SESSION: 3600,       // 1 hour - session data
  USER_PROFILE: 60,    // 1 minute - user profile data
} as const;

// Cache key prefixes
export const CACHE_PREFIX = {
  PERMISSIONS: 'perms:',
  DASHBOARD: 'dash:',
  SESSION: 'sess:',
  USER: 'user:',
} as const;

// Singleton Redis client
let redisClient: IORedis | null = null;

/**
 * Get or create Redis client singleton
 */
function getRedisClient(): IORedis | null {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('[Cache] No REDIS_URL configured - caching disabled');
    return null;
  }

  try {
    redisClient = new IORedis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      enableOfflineQueue: true,
      lazyConnect: true,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on('connect', () => {
      console.log('[Cache] Successfully connected to Redis');
    });

    redisClient.on('error', (err: Error) => {
      console.error('[Cache] Redis connection error:', err.message);
    });

    return redisClient;
  } catch (error) {
    console.error('[Cache] Failed to initialize Redis client:', error);
    return null;
  }
}

/**
 * Get cached value
 * @param key - Cache key
 * @returns Parsed value or null if not found
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const value = await client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('[Cache] Get error:', error);
    return null;
  }
}

/**
 * Set cached value
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttlSeconds - Time to live in seconds
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    return true;
  } catch (error) {
    console.error('[Cache] Set error:', error);
    return false;
  }
}

/**
 * Delete cached value
 * @param key - Cache key
 */
export async function cacheDelete(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error('[Cache] Delete error:', error);
    return false;
  }
}

/**
 * Delete all keys matching a pattern
 * @param pattern - Redis key pattern (e.g., "perms:*")
 */
export async function cacheDeletePattern(pattern: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
    return true;
  } catch (error) {
    console.error('[Cache] Delete pattern error:', error);
    return false;
  }
}

/**
 * Cache-through helper: Get from cache or fetch and cache
 * @param key - Cache key
 * @param fetchFn - Function to fetch data if not cached
 * @param ttlSeconds - Time to live in seconds
 */
export async function cacheThrough<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // Try cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch and cache
  const value = await fetchFn();
  await cacheSet(key, value, ttlSeconds);
  return value;
}

// ============================================
// PERMISSION HIERARCHY CACHING
// ============================================

export interface PermissionHierarchy {
  userId: string;
  role: string;
  cityIds: string[];
  neighborhoodIds: string[];
  areaIds: string[];
  canAccessAll: boolean;
}

/**
 * Get cached permission hierarchy for a user
 */
export async function getCachedPermissions(
  userId: string
): Promise<PermissionHierarchy | null> {
  return cacheGet<PermissionHierarchy>(`${CACHE_PREFIX.PERMISSIONS}${userId}`);
}

/**
 * Cache permission hierarchy for a user
 */
export async function cachePermissions(
  userId: string,
  permissions: PermissionHierarchy
): Promise<boolean> {
  return cacheSet(
    `${CACHE_PREFIX.PERMISSIONS}${userId}`,
    permissions,
    CACHE_TTL.PERMISSIONS
  );
}

/**
 * Invalidate permission cache for a user
 */
export async function invalidatePermissions(userId: string): Promise<boolean> {
  return cacheDelete(`${CACHE_PREFIX.PERMISSIONS}${userId}`);
}

/**
 * Invalidate all permission caches (e.g., after role changes)
 */
export async function invalidateAllPermissions(): Promise<boolean> {
  return cacheDeletePattern(`${CACHE_PREFIX.PERMISSIONS}*`);
}

// ============================================
// DASHBOARD STATS CACHING
// ============================================

export interface DashboardStats {
  totalActivists: number;
  activeActivists: number;
  totalVoters: number;
  totalNeighborhoods: number;
  totalCities: number;
  recentActivityCount: number;
  lastUpdated: string;
}

/**
 * Get cached dashboard stats for a scope
 * @param scope - "global" or city/area ID
 */
export async function getCachedDashboardStats(
  scope: string
): Promise<DashboardStats | null> {
  return cacheGet<DashboardStats>(`${CACHE_PREFIX.DASHBOARD}${scope}`);
}

/**
 * Cache dashboard stats
 * @param scope - "global" or city/area ID
 * @param stats - Dashboard statistics
 */
export async function cacheDashboardStats(
  scope: string,
  stats: DashboardStats
): Promise<boolean> {
  return cacheSet(
    `${CACHE_PREFIX.DASHBOARD}${scope}`,
    { ...stats, lastUpdated: new Date().toISOString() },
    CACHE_TTL.DASHBOARD_STATS
  );
}

/**
 * Invalidate dashboard stats cache
 * @param scope - Optional specific scope, or all if not provided
 */
export async function invalidateDashboardStats(scope?: string): Promise<boolean> {
  if (scope) {
    return cacheDelete(`${CACHE_PREFIX.DASHBOARD}${scope}`);
  }
  return cacheDeletePattern(`${CACHE_PREFIX.DASHBOARD}*`);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if caching is available
 */
export function isCacheAvailable(): boolean {
  return getRedisClient() !== null;
}

/**
 * Get cache statistics (for monitoring)
 */
export async function getCacheStats(): Promise<{
  available: boolean;
  info?: string;
}> {
  const client = getRedisClient();
  if (!client) {
    return { available: false };
  }

  try {
    const info = await client.info('memory');
    return { available: true, info };
  } catch (error) {
    return { available: false };
  }
}
