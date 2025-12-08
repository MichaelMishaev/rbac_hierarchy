'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDashboardStats } from '@/app/actions/dashboard';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const result = await getDashboardStats();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.stats;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (fresher for dashboard)
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useDashboardMutations() {
  const queryClient = useQueryClient();

  return {
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
    prefetch: () => queryClient.prefetchQuery({
      queryKey: ['dashboard-stats'],
      queryFn: async () => {
        const result = await getDashboardStats();
        return result.stats;
      },
    }),
  };
}
