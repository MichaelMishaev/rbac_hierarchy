import { NextResponse } from 'next/server';

/**
 * Version Endpoint - Source of Truth for Deployment Versions
 * Polled by client to detect version mismatches and show update notifications
 *
 * Returns:
 * - buildId: Full build identifier (YYYY-MM-DD-gitSHA or dev-local)
 * - buildDate: Date portion of build ID
 * - gitSha: Git commit SHA (7 chars)
 * - isCritical: Force reload flag (controlled by FORCE_UPDATE env var)
 * - serverTime: Current server timestamp (ISO 8601)
 * - environment: Railway environment or 'local'
 *
 * Cache: 10 seconds (balances freshness with server load)
 */
export async function GET() {
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID || 'dev-local';
  const isCritical = process.env.FORCE_UPDATE === 'true';

  // Parse buildId to extract components
  // Format: YYYY-MM-DD-gitSHA or "dev-local"
  let buildDate = null;
  let gitSha = null;

  if (buildId !== 'dev-local') {
    const parts = buildId.split('-');
    if (parts.length === 4) {
      // Valid format: YYYY-MM-DD-gitSHA
      buildDate = `${parts[0]}-${parts[1]}-${parts[2]}`; // YYYY-MM-DD
      gitSha = parts[3]; // gitSHA
    }
  }

  const versionInfo = {
    buildId,
    buildDate,
    gitSha,
    isCritical,
    serverTime: new Date().toISOString(),
    environment: process.env.RAILWAY_ENVIRONMENT || 'local',
  };

  return NextResponse.json(versionInfo, {
    status: 200,
    headers: {
      // Cache for 10 seconds to reduce server load while maintaining freshness
      'Cache-Control': 'public, max-age=10, must-revalidate',
    },
  });
}
