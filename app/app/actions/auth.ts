'use server';

import { signOut } from '@/auth';
import { withServerActionErrorHandler } from '@/lib/server-action-error-handler';

export async function logout() {
  return withServerActionErrorHandler(async () => {
    await signOut({ redirectTo: '/login' });
  }, 'logout');
}
