/**
 * 🚨 CRITICAL: Secure logout hook that clears ALL client-side state
 *
 * This hook ensures complete data isolation between users by:
 * 1. Clearing React Query cache (prevents previous user's API data from persisting)
 * 2. Clearing localStorage (removes previous user's recent pages, preferences, etc.)
 * 3. Clearing sessionStorage (removes any temporary data)
 * 4. Invalidating NextAuth session
 *
 * SECURITY NOTE: Without proper cleanup, users logging in on the same machine
 * can see previous user's data due to browser caching.
 */

'use client';

import { useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';

export function useLogout() {
  const queryClient = useQueryClient();

  const logout = useCallback(async () => {
    try {
      // Step 1: Clear React Query cache (ALL cached API responses)
      queryClient.clear();

      // Step 2: Clear localStorage (recent pages, preferences, etc.)
      try {
        localStorage.clear();
      } catch (error) {
        console.error('Failed to clear localStorage:', error);
      }

      // Step 3: Clear sessionStorage (temporary data)
      try {
        sessionStorage.clear();
      } catch (error) {
        console.error('Failed to clear sessionStorage:', error);
      }

      // Step 4: Sign out with NextAuth (invalidate session + redirect)
      await signOut({ callbackUrl: '/login', redirect: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if something fails
      window.location.href = '/login';
    }
  }, [queryClient]);

  return { logout };
}
