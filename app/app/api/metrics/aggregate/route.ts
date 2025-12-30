/**
 * API Route: Get Aggregated Performance Metrics
 *
 * Returns aggregated Web Vitals and custom metrics from Redis
 * for performance dashboard and monitoring.
 *
 * Supports both Railway Redis (ioredis) and Upstash Redis (REST API).
 */

import { NextRequest, NextResponse } from 'next/server';
import { Redis as UpstashRedis } from '@upstash/redis';
import IORedis from 'ioredis';
import { requireAuth } from '@/lib/api-auth';

// Type for Redis client interface
interface RedisClient {
  get: <TData = unknown>(key: string) => Promise<TData | null>;
  zrange: (
    key: string,
    start: number,
    stop: number,
    options?: { byScore?: boolean; withScores?: boolean }
  ) => Promise<(string | number)[]>;
  keys: (pattern: string) => Promise<string[]>;
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
      get: async <TData = unknown>(key: string): Promise<TData | null> => {
        const result = await ioredis.get(key);
        if (result === null) return null;
        try {
          return JSON.parse(result) as TData;
        } catch {
          return result as TData;
        }
      },
      zrange: async (
        key: string,
        start: number,
        stop: number,
        options?: { byScore?: boolean; withScores?: boolean }
      ) => {
        if (options?.byScore) {
          const args: (string | number)[] = options.withScores ? ['WITHSCORES'] : [];
          return await ioredis.zrangebyscore(key, start, stop, ...args);
        }
        return await ioredis.zrange(key, start, stop);
      },
      keys: async (pattern: string) => {
        return await ioredis.keys(pattern);
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

export async function GET(request: NextRequest) {
  // ✅ SECURITY FIX (VULN-RBAC-001): Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    if (!redis) {
      return NextResponse.json({
        error: 'Redis not configured',
        metrics: [],
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'web-vital';
    const name = searchParams.get('name');
    const timeframe = parseInt(searchParams.get('timeframe') || '86400000'); // Default 24 hours

    if (name) {
      // Get stats for specific metric
      const stats = await getMetricStats(redis, type, name, timeframe);
      return NextResponse.json(stats);
    } else {
      // Get stats for all metrics
      const allStats = await getAllMetricsStats(redis, type, timeframe);
      return NextResponse.json(allStats);
    }
  } catch (error) {
    console.error('[Metrics] Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

/**
 * Get statistics for a specific metric
 */
async function getMetricStats(
  redis: RedisClient,
  type: string,
  name: string,
  timeframe: number
) {
  const statsKey = `metrics:${type}:${name}:stats`;
  const timeseriesKey = `metrics:${type}:${name}:timeseries`;

  // Get aggregated stats
  const stats = await redis.get<{
    count: number;
    sum: number;
    min: number;
    max: number;
    good: number;
    needsImprovement: number;
    poor: number;
  }>(statsKey);

  if (!stats) {
    return {
      name,
      count: 0,
      average: 0,
      min: 0,
      max: 0,
      distribution: {
        good: 0,
        needsImprovement: 0,
        poor: 0,
      },
      timeseries: [],
    };
  }

  // Get recent data points for timeseries
  const now = Date.now();
  const startTime = now - timeframe;
  const timeseriesData = await redis.zrange(
    timeseriesKey,
    startTime,
    now,
    {
      byScore: true,
      withScores: true,
    }
  );

  // Fetch actual metric values
  const timeseries = [];
  for (let i = 0; i < timeseriesData.length; i += 2) {
    const metricKey = timeseriesData[i] as string;
    const timestamp = timeseriesData[i + 1] as number;

    const metricData = await redis.get(metricKey);
    if (metricData) {
      timeseries.push({
        timestamp,
        ...(typeof metricData === 'string' ? JSON.parse(metricData) : metricData),
      });
    }
  }

  return {
    name,
    count: stats.count,
    average: stats.count > 0 ? stats.sum / stats.count : 0,
    min: stats.min === Infinity ? 0 : stats.min,
    max: stats.max === -Infinity ? 0 : stats.max,
    distribution: {
      good: stats.good,
      needsImprovement: stats.needsImprovement,
      poor: stats.poor,
    },
    timeseries,
  };
}

/**
 * Get statistics for all metrics
 */
async function getAllMetricsStats(
  redis: RedisClient,
  type: string,
  timeframe: number
) {
  // Get all metric names
  const pattern = `metrics:${type}:*:stats`;
  const keys = await redis.keys(pattern);

  const allStats = (
    await Promise.all(
      keys.map(async (key) => {
        // Extract metric name from key
        const parts = key.split(':');
        const name = parts[2]; // metrics:type:NAME:stats

        if (!name) return null;

        return getMetricStats(redis, type, name, timeframe);
      })
    )
  ).filter((stat): stat is NonNullable<typeof stat> => stat !== null);

  return allStats;
}
