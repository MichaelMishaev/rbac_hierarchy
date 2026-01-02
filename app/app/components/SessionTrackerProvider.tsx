'use client';

/**
 * Session Tracker Provider
 *
 * Wraps the app to enable automatic session tracking.
 * Tracks user navigation, clicks, and form submissions.
 *
 * Feature Flag: NEXT_PUBLIC_ENABLE_SESSION_TRACKING
 */

import { useEffect } from 'react';
import { useSessionTracker } from '@/app/lib/session-tracker';

interface SessionTrackerProviderProps {
  children: React.ReactNode;
}

export default function SessionTrackerProvider({ children }: SessionTrackerProviderProps) {
  // Initialize and start session tracking
  useSessionTracker();

  return <>{children}</>;
}
