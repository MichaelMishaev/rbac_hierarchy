/**
 * ✅ UNLOCKED: Manage Voters Page - Pagination Added (2025-12-22)
 *
 * Last modified: 2025-12-22
 * Change: Added pagination support to VotersList (was limited to 100 voters)
 * Reason: Critical bug - election campaign system must show ALL voters
 *
 * Features:
 * - Tabbed interface (List, Statistics, Duplicates)
 * - Excel import with duplicate detection
 * - Create/Edit/View voter modals
 * - RBAC-aware (SuperAdmin sees duplicates tab)
 * - Mobile-responsive
 * - Hebrew-only, RTL layout
 * - Pagination (25/50/100/200 rows per page)
 *
 * Related files:
 * - VotersPageClient.tsx
 * - components/ExcelUpload.tsx
 * - components/VotersList.tsx ✅ Modified: Added pagination
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
