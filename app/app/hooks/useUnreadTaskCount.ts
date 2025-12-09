/**
 * Hook to fetch and poll unread task count for navigation badge
 * Uses React Query for caching and automatic refetching
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
    refetchInterval: 30000, // Poll every 30 seconds for real-time updates
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    staleTime: 10000, // Consider data fresh for 10 seconds
  });
}
