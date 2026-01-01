'use client';

import { useVersionCheck } from '@/app/hooks/useVersionCheck';
import { UpdateBanner } from './UpdateBanner';
import { CriticalUpdateBanner } from './CriticalUpdateBanner';

/**
 * Version Checker Orchestrator
 * Coordinates version detection and banner display
 *
 * Logic:
 * - Uses useVersionCheck hook to poll /api/version
 * - Shows CriticalUpdateBanner if isCritical=true (highest priority)
 * - Shows UpdateBanner for normal updates (dismissible)
 * - Disabled in development (CLIENT_BUILD_ID === 'dev-local')
 */

interface VersionCheckerProps {
  /**
   * Enable version checking
   * @default true in production, false in development
   */
  enabled?: boolean;

  /**
   * Poll interval in milliseconds
   * @default 60000 (60 seconds)
   */
  pollInterval?: number;
}

export function VersionChecker({ enabled, pollInterval }: VersionCheckerProps = {}) {
  const CLIENT_BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || 'dev-local';

  const {
    serverBuildId,
    clientBuildId,
    needsUpdate,
    isCritical,
  } = useVersionCheck({
    enabled: enabled ?? CLIENT_BUILD_ID !== 'dev-local',
    pollInterval,
  });

  // Don't show banners if no update needed
  if (!needsUpdate || !serverBuildId) {
    return null;
  }

  // Critical update takes priority (non-dismissible, countdown)
  if (isCritical) {
    return <CriticalUpdateBanner serverBuildId={serverBuildId} />;
  }

  // Normal update (dismissible, soft notification)
  return <UpdateBanner serverBuildId={serverBuildId} />;
}
