/**
 * useRealtimeStats Hook
 * Provides real-time dashboard statistics with animated counters
 *
 * Features:
 * - Polls API for updated stats every 30 seconds
 * - Smooth number transitions for counters
 * - Automatic refetch on window focus
 * - Optimistic updates from live feed events
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveFeed } from './useLiveFeed';

export interface RealtimeStats {
  activeActivists: number;
  todayCheckIns: number;
  activeTasks: number;
  completedTasksToday: number;
  lastUpdated: Date;
}

interface UseRealtimeStatsReturn {
  stats: RealtimeStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const DEFAULT_STATS: RealtimeStats = {
  activeActivists: 0,
  todayCheckIns: 0,
  activeTasks: 0,
  completedTasksToday: 0,
  lastUpdated: new Date(),
};

const BASE_POLL_INTERVAL = 30000; // 30 seconds
const MAX_POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes max backoff

export function useRealtimeStats(): UseRealtimeStatsReturn {
  const [stats, setStats] = useState<RealtimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { events } = useLiveFeed();

  // OPTIMIZED: Track consecutive errors for exponential backoff
  const consecutiveErrorsRef = useRef(0);
  const currentIntervalRef = useRef(BASE_POLL_INTERVAL);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/dashboard/realtime-stats');

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      const data = await response.json();

      setStats({
        activeActivists: data.activeActivists || 0,
        todayCheckIns: data.todayCheckIns || 0,
        activeTasks: data.activeTasks || 0,
        completedTasksToday: data.completedTasksToday || 0,
        lastUpdated: new Date(),
      });

      // Reset backoff on success
      consecutiveErrorsRef.current = 0;
      currentIntervalRef.current = BASE_POLL_INTERVAL;
      setError(null);
    } catch (err) {
      console.error('[RealtimeStats] Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');

      // OPTIMIZED: Exponential backoff on consecutive errors
      consecutiveErrorsRef.current += 1;
      currentIntervalRef.current = Math.min(
        BASE_POLL_INTERVAL * Math.pow(2, consecutiveErrorsRef.current),
        MAX_POLL_INTERVAL
      );

      console.warn(
        `[RealtimeStats] Error #${consecutiveErrorsRef.current}, next poll in ${currentIntervalRef.current / 1000}s`
      );

      // Set default stats on error to prevent UI breaks
      if (!stats) {
        setStats(DEFAULT_STATS);
      }
    } finally {
      setLoading(false);
    }
  }, [stats]);

  // Initial fetch on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // OPTIMIZED: Poll with exponential backoff on errors
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const scheduleNextPoll = () => {
      timeoutId = setTimeout(() => {
        fetchStats().then(() => {
          // Schedule next poll with potentially updated interval
          scheduleNextPoll();
        });
      }, currentIntervalRef.current);
    };

    scheduleNextPoll();

    return () => clearTimeout(timeoutId);
  }, [fetchStats]);

  // Refetch on window focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      console.log('[RealtimeStats] Window focused - refetching stats');
      fetchStats();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchStats]);

  // Optimistic updates from live feed events
  useEffect(() => {
    if (!stats || events.length === 0) return;

    const latestEvent = events[0];

    setStats((prevStats) => {
      if (!prevStats) return prevStats;

      const newStats = { ...prevStats };

      switch (latestEvent.type) {
        case 'check_in':
          newStats.todayCheckIns += 1;
          break;

        case 'task_complete':
          newStats.completedTasksToday += 1;
          newStats.activeTasks = Math.max(0, newStats.activeTasks - 1);
          break;

        case 'task_assigned':
          newStats.activeTasks += 1;
          break;

        case 'activist_added':
          newStats.activeActivists += 1;
          break;
      }

      newStats.lastUpdated = new Date();
      return newStats;
    });
  }, [events, stats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
