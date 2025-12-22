/**
 * Hook to fetch and poll unread notification count for "More" tab badge
 * Uses React Query for caching and automatic refetching
 *
 * 🚀 PERFORMANCE OPTIMIZATIONS:
 * - Polling every 60s (same as task count)
 * - Disabled refetchOnWindowFocus (less network noise)
 * - StaleTime 30s (better caching)
 *
 * Used by:
 * - BottomNavigation "More" tab badge
 */

import { useQuery } from '@tanstack/react-query';

interface UnreadNotificationCountResponse {
  unread_count: number;
}

export function useUnreadNotificationCount() {
  return useQuery<UnreadNotificationCountResponse>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/unread-count', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch unread notification count');
      }

      return response.json();
    },
    refetchInterval: 60000, // Poll every 60 seconds (same as task count)
    refetchOnWindowFocus: false, // Reduce network noise
    staleTime: 30000, // Cache for 30 seconds
  });
}
