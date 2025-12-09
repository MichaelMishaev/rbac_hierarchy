'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listNeighborhoods } from '@/app/actions/neighborhoods';

export function useSites() {
  return useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const result = await listNeighborhoods({});
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.neighborhoods || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSiteMutations() {
  const queryClient = useQueryClient();

  return {
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['sites'] }),
    prefetch: () => queryClient.prefetchQuery({
      queryKey: ['sites'],
      queryFn: async () => {
        const result = await listNeighborhoods({});
        return result.neighborhoods || [];
      },
    }),
  };
}
