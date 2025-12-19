'use client';

import { SessionProvider } from 'next-auth/react';
import { ActivistBottomNav } from './ActivistBottomNav';

export function ActivistBottomNavWrapper() {
  return (
    <SessionProvider>
      <ActivistBottomNav />
    </SessionProvider>
  );
}
