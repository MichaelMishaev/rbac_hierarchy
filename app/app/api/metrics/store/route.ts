/**
 * API Route: Store Performance Metrics in Redis
 *
 * Receives Web Vitals and custom metrics from the client
 * and stores them in Redis for aggregation and analysis.
 *
 * Supports both Railway Redis (ioredis) and Upstash Redis (REST API).
 */

import { NextResponse } from 'next/server';
import { Redis as UpstashRedis } from '@upstash/redis';
import IORedis from 'ioredis';
import { requireAuth } from '@/lib/api-auth';
import { withErrorHandler } from '@/lib/error-handler';

// Type for Redis client interface
interface RedisClient {
  setex: (key: string, seconds: number, value: string) => Promise<unknown>;
  zadd: (
    key: string,
    scoreMembers: { score: number; member: string }
  ) => Promise<number>;
  get: <TData = unknown>(key: string) => Promise<TData | null>;
  set: (key: string, value: string) => Promise<unknown>;
  expire: (key: string, seconds: number) => Promise<number>;
}

// Initialize Redis client (if available)
let redis: RedisClient | null = null;

// Priority 1: Railway Redis (standard protocol)
if (process.env['REDIS_URL'] && !process.env['UPSTASH_REDIS_REST_URL']) {
  try {
    const ioredis = new IORedis(process.env['REDIS_URL'], {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: false,
    });

    // Wrap ioredis to match interface
    redis = {
      setex: async (key: string, seconds: number, value: string) => {
        return await ioredis.setex(key, seconds, value);
      },
      zadd: async (key: string, scoreMembers: { score: number; member: string }) => {
        return await ioredis.zadd(key, scoreMembers.score, scoreMembers.member);
      },
      get: async <TData = unknown>(key: string): Promise<TData | null> => {
        const result = await ioredis.get(key);
        if (result === null) return null;
        try {
          return JSON.parse(result) as TData;
        } catch {
          return result as TData;
        }
      },
      set: async (key: string, value: string) => {
        return await ioredis.set(key, value);
      },
      expire: async (key: string, seconds: number) => {
        return await ioredis.expire(key, seconds);
      },
    };
    console.log('[Metrics] Initialized Railway Redis client');
  } catch (error) {
    console.error('[Metrics] Failed to initialize Railway Redis:', error);
  }
}
// Priority 2: Upstash Redis (REST API)
else if (process.env['UPSTASH_REDIS_REST_URL'] && process.env['UPSTASH_REDIS_REST_TOKEN']) {
  redis = new UpstashRedis({
    url: process.env['UPSTASH_REDIS_REST_URL'],
    token: process.env['UPSTASH_REDIS_REST_TOKEN'],
  }) as unknown as RedisClient;
  console.log('[Metrics] Initialized Upstash Redis client');
}

export const POST = withErrorHandler(async (request: Request) => {
  // ✅ SECURITY FIX (VULN-RBAC-001): Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();

  const {
    type, // 'web-vital' or 'custom'
    name,
    value,
    rating,
    timestamp,
    url,
  } = body;

  // Validate required fields
  if (!type || !name || value === undefined) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // If Redis is not configured, just log and return success
  if (!redis) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Metrics] Redis not configured, skipping storage:', {
        type,
        name,
        value,
      });
    }
    return NextResponse.json({ success: true });
  }

  // Store metric in Redis
  const metricKey = `metrics:${type}:${name}:${Date.now()}`;
  const metricData = {
    type,
    name,
    value,
    rating,
    timestamp,
    url,
    userAgent: request.headers.get('user-agent'),
  };

  // Store individual metric
  await redis.setex(
    metricKey,
    60 * 60 * 24 * 7, // Keep for 7 days
    JSON.stringify(metricData)
  );

  // Add to sorted set for time-series queries
  await redis.zadd(
    `metrics:${type}:${name}:timeseries`,
    {
      score: timestamp,
      member: metricKey,
    }
  );

  // Update aggregated statistics
  await updateAggregatedStats(redis, type, name, value, rating);

  return NextResponse.json({ success: true });
});

/**
 * Update aggregated statistics in Redis
 */
async function updateAggregatedStats(
  redis: RedisClient,
  type: string,
  name: string,
  value: number,
  rating?: string
) {
  const statsKey = `metrics:${type}:${name}:stats`;

  // Get current stats
  const currentStats = await redis.get<{
    count: number;
    sum: number;
    min: number;
    max: number;
    good: number;
    needsImprovement: number;
    poor: number;
  }>(statsKey);

  const stats = currentStats || {
    count: 0,
    sum: 0,
    min: Infinity,
    max: -Infinity,
    good: 0,
    needsImprovement: 0,
    poor: 0,
  };

  // Update stats
  stats.count += 1;
  stats.sum += value;
  stats.min = Math.min(stats.min, value);
  stats.max = Math.max(stats.max, value);

  if (rating === 'good') stats.good += 1;
  else if (rating === 'needs-improvement') stats.needsImprovement += 1;
  else if (rating === 'poor') stats.poor += 1;

  // Store updated stats
  await redis.set(statsKey, JSON.stringify(stats));

  // Set expiry
  await redis.expire(statsKey, 60 * 60 * 24 * 30); // Keep for 30 days
}
