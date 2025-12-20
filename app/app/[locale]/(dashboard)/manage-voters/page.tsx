/**
 * 🔒 LOCKED: Manage Voters Page - DO NOT MODIFY
 *
 * Last locked: 2025-12-20
 * Reason: Stable voter management with Excel import functionality
 *
 * ⚠️ WARNING: This page is locked for modifications.
 * Any changes require explicit approval.
 *
 * Features:
 * - Tabbed interface (List, Statistics, Duplicates)
 * - Excel import with duplicate detection
 * - Create/Edit/View voter modals
 * - RBAC-aware (SuperAdmin sees duplicates tab)
 * - Mobile-responsive
 * - Hebrew-only, RTL layout
 *
 * Related files (also locked):
 * - VotersPageClient.tsx
 * - components/ExcelUpload.tsx
 * - components/VotersList.tsx
 * - components/VoterForm.tsx
 * - components/VoterDetails.tsx
 * - components/VoterStatistics.tsx
 * - components/DuplicatesDashboard.tsx
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
