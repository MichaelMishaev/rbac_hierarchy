/**
 * Version Dashboard Page
 *
 * SuperAdmin-only page for viewing:
 * - Current app version, Service Worker version, build ID
 * - Deployment history (last 20 deployments)
 * - Branch and environment information
 *
 * RBAC: SuperAdmin only (isSuperAdmin = true)
 * Route: /version
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import VersionDashboardClient from './VersionDashboardClient';

export const metadata = {
  title: 'ניהול גרסאות - מערכת ניהול קמפיין',
  description: 'מעקב אחר גרסאות האפליקציה, Service Worker והיסטוריית פריסות',
};

export default async function VersionPage() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login');
  }

  // RBAC: Only SuperAdmin can access version dashboard
  if (!session.user.isSuperAdmin) {
    return (
      <Box
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
        dir="rtl"
        lang="he"
      >
        <Typography
          variant="h4"
          color="error"
          sx={{ mb: 2, textAlign: 'center' }}
        >
          גישה נדחתה
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ textAlign: 'center' }}
        >
          עמוד זה זמין רק למנהלי מערכת
        </Typography>
      </Box>
    );
  }

  return <VersionDashboardClient />;
}
