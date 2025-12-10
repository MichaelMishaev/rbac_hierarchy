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

import { useState, useEffect, useCallback } from 'react';
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

export function useRealtimeStats(): UseRealtimeStatsReturn {
  const [stats, setStats] = useState<RealtimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { events } = useLiveFeed();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

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
    } catch (err) {
      console.error('[RealtimeStats] Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');

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

  // Poll every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
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
