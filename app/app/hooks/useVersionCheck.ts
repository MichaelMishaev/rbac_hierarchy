'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Version Check Hook
 * Polls /api/version to detect deployment updates and version mismatches
 *
 * Features:
 * - Polls every 60 seconds (configurable)
 * - Checks on tab focus/visibility change
 * - Compares client vs server BUILD_ID
 * - Graceful error handling (network failures)
 * - Abort controller to prevent race conditions
 *
 * Returns:
 * - serverBuildId: Current deployed version
 * - clientBuildId: Version this client was built with
 * - needsUpdate: True if versions don't match
 * - isCritical: True if force reload required
 * - lastChecked: Timestamp of last check
 */

interface VersionCheckResult {
  serverBuildId: string | null;
  clientBuildId: string;
  needsUpdate: boolean;
  isCritical: boolean;
  lastChecked: Date | null;
  error: string | null;
}

interface VersionResponse {
  buildId: string;
  isCritical: boolean;
}

const POLL_INTERVAL = 60 * 1000; // 60 seconds
const CLIENT_BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || 'dev-local';

export function useVersionCheck(options?: {
  enabled?: boolean;
  pollInterval?: number;
}): VersionCheckResult {
  const enabled = options?.enabled ?? true;
  const pollInterval = options?.pollInterval ?? POLL_INTERVAL;

  const [serverBuildId, setServerBuildId] = useState<string | null>(null);
  const [isCritical, setIsCritical] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkVersion = useCallback(async () => {
    if (!enabled) return;

    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/version', {
        signal: abortControllerRef.current.signal,
        cache: 'no-store', // Always fetch fresh data
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: VersionResponse = await response.json();

      setServerBuildId(data.buildId);
      setIsCritical(data.isCritical);
      setLastChecked(new Date());
      setError(null);

      // Log version mismatch for debugging
      if (data.buildId !== CLIENT_BUILD_ID) {
        console.log(
          `[Version Check] Update detected: ${CLIENT_BUILD_ID} → ${data.buildId}` +
            (data.isCritical ? ' (CRITICAL)' : '')
        );
      }
    } catch (err) {
      // Ignore abort errors (normal when component unmounts or new request starts)
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      // Log other errors but don't show to user
      console.warn('[Version Check] Failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [enabled]);

  // Initial check on mount
  useEffect(() => {
    if (!enabled) return;

    checkVersion();
  }, [checkVersion, enabled]);

  // Set up polling interval
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(checkVersion, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkVersion, enabled, pollInterval]);

  // OPTIMIZED: Merged visibility and focus handlers into single effect
  // This prevents duplicate API calls when both events fire
  useEffect(() => {
    if (!enabled) return;

    let lastCheckTime = 0;
    const DEBOUNCE_MS = 1000; // Prevent multiple checks within 1 second

    const handleVisibilityOrFocus = () => {
      // Only check if tab is visible and debounce rapid events
      const now = Date.now();
      if (document.visibilityState === 'visible' && now - lastCheckTime > DEBOUNCE_MS) {
        lastCheckTime = now;
        checkVersion();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [checkVersion, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Calculate needsUpdate
  const needsUpdate =
    serverBuildId !== null &&
    serverBuildId !== CLIENT_BUILD_ID &&
    CLIENT_BUILD_ID !== 'dev-local'; // Don't show updates in dev

  return {
    serverBuildId,
    clientBuildId: CLIENT_BUILD_ID,
    needsUpdate,
    isCritical,
    lastChecked,
    error,
  };
}
