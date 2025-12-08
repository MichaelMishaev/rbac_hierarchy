'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listWorkers } from '@/app/actions/workers';

export function useWorkers() {
  return useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const result = await listWorkers({});
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.workers || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useWorkerMutations() {
  const queryClient = useQueryClient();

  return {
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['workers'] }),
    prefetch: () => queryClient.prefetchQuery({
      queryKey: ['workers'],
      queryFn: async () => {
        const result = await listWorkers({});
        return result.workers || [];
      },
    }),
  };
}
