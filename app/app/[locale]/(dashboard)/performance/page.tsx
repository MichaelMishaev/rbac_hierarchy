/**
 * Performance Monitoring Dashboard
 *
 * Real-time Web Vitals monitoring and historical performance metrics.
 * Shows LCP, FID, CLS, FCP, TTFB, and custom metrics.
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { getLocale } from 'next-intl/server';
import { colors } from '@/lib/design-system';
import PerformanceDashboardClient from '@/app/components/performance/PerformanceDashboardClient';

export default async function PerformanceDashboard() {
  const session = await auth();
  const locale = await getLocale();
  const isRTL = locale === 'he';

  if (!session) {
    redirect('/login');
  }

  // Only SuperAdmin can access performance dashboard
  if (session.user.role !== 'SUPERADMIN') {
    redirect('/dashboard');
  }

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        background: colors.neutral[50],
        minHeight: '100vh',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: colors.neutral[900],
            mb: 0.5,
          }}
        >
          {isRTL ? 'ניטור ביצועים' : 'Performance Monitoring'}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: colors.neutral[600],
            fontWeight: 500,
          }}
        >
          {isRTL
            ? 'Web Vitals וביצועי אפליקציה בזמן אמת'
            : 'Real-time Web Vitals and Application Performance'}
        </Typography>
      </Box>

      {/* Performance Dashboard Client Component */}
      <PerformanceDashboardClient />
    </Box>
  );
}
