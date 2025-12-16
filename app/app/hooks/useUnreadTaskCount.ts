/**
 * Hook to fetch and poll unread task count for navigation badge
 * Uses React Query for caching and automatic refetching
 *
 * 🚀 PERFORMANCE OPTIMIZATIONS:
 * - Reduced polling from 30s → 60s (50% less API calls)
 * - Disabled refetchOnWindowFocus (less network noise)
 * - Increased staleTime from 10s → 30s (better caching)
 */

import { useQuery } from '@tanstack/react-query';

interface UnreadCountResponse {
  unread_count: number;
}

export function useUnreadTaskCount() {
  return useQuery<UnreadCountResponse>({
    queryKey: ['tasks', 'unread-count'],
    queryFn: async () => {
      const response = await fetch('/api/tasks/unread-count', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      return response.json();
    },
    refetchInterval: 60000, // 🚀 Optimized: 30s → 60s (50% reduction in API calls)
    refetchOnWindowFocus: false, // 🚀 Optimized: Disabled to reduce network noise
    staleTime: 30000, // 🚀 Optimized: 10s → 30s (better caching, less refetching)
  });
}
