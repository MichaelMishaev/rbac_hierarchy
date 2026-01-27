'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 30 seconds
            staleTime: 30 * 1000,
            // Keep inactive data in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            // CRITICAL: Enable background refetching when window regains focus
            // This updates data WITHOUT closing modals/dialogs
            refetchOnWindowFocus: true,
            // Enable automatic background refetch at intervals
            // This keeps data fresh without disrupting user interactions
            refetchInterval: 30 * 1000, // Refetch every 30 seconds
            refetchIntervalInBackground: false, // Don't refetch when tab is hidden
            // OPTIMIZED: Only refetch on mount if data is stale (not fresh)
            // Was 'always' which caused unnecessary refetches on every mount
            refetchOnMount: 'stale',
            // Retry failed requests
            retry: 1,
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
