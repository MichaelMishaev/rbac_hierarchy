/**
 * API Route: Store Performance Metrics in Redis
 *
 * Receives Web Vitals and custom metrics from the client
 * and stores them in Redis for aggregation and analysis.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client (if available)
let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  redis = new Redis({
    url: process.env.REDIS_URL,
    token: process.env.REDIS_TOKEN || '',
  });
}

export async function POST(request: NextRequest) {
  try {
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
  } catch (error) {
    console.error('[Metrics] Error storing metric:', error);
    return NextResponse.json(
      { error: 'Failed to store metric' },
      { status: 500 }
    );
  }
}

/**
 * Update aggregated statistics in Redis
 */
async function updateAggregatedStats(
  redis: Redis,
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
