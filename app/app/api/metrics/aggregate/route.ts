/**
 * API Route: Get Aggregated Performance Metrics
 *
 * Returns aggregated Web Vitals and custom metrics from Redis
 * for performance dashboard and monitoring.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client (if available)
let redis: Redis | null = null;

if (process.env['REDIS_URL']) {
  redis = new Redis({
    url: process.env['REDIS_URL'],
    token: process.env['REDIS_TOKEN'] || '',
  });
}

export async function GET(request: NextRequest) {
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
  redis: Redis,
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
  redis: Redis,
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
