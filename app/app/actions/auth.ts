'use server';

import { signOut } from '@/auth.config';
import { withServerActionErrorHandler } from '@/lib/server-action-error-handler';

export async function logout() {
  return withServerActionErrorHandler(async () => {
    await signOut({ redirectTo: '/login' });
  }, 'logout');
}
