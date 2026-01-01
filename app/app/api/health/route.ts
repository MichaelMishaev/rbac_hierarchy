import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Health Check Endpoint
 * Used by Railway for deployment health checks and monitoring
 *
 * Returns:
 * - 200: Service is healthy, DB is reachable
 * - 503: Service is unhealthy, DB connection failed
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Test database connectivity with a simple query
    await prisma.$queryRaw`SELECT 1`;

    const responseTime = Date.now() - startTime;
    const uptime = process.uptime();

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'dev-local',
        database: {
          status: 'connected',
          responseTime: `${responseTime}ms`,
        },
        uptime: `${Math.floor(uptime)}s`,
        environment: process.env.RAILWAY_ENVIRONMENT || 'local',
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;

    console.error('[Health Check] Database connection failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'dev-local',
        database: {
          status: 'disconnected',
          responseTime: `${responseTime}ms`,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        uptime: `${Math.floor(process.uptime())}s`,
        environment: process.env.RAILWAY_ENVIRONMENT || 'local',
      },
      { status: 503 }
    );
  }
}
