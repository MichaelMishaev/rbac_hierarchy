/**
 * Voters Main Page - Hebrew RTL
 *
 * Features:
 * - Tabbed interface (List, Statistics, Duplicates)
 * - Create/Edit/View voter modals
 * - RBAC-aware (SuperAdmin sees duplicates tab)
 * - Mobile-responsive
 */

import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import VotersPageClient from './VotersPageClient';

export default async function VotersPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const isSuperAdmin = session.user.role === 'SUPERADMIN';

  return <VotersPageClient isSuperAdmin={isSuperAdmin} />;
}
