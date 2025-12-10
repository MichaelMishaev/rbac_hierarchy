import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { getTranslations, getLocale } from 'next-intl/server';
import { colors } from '@/lib/design-system';
import { listWorkers } from '@/app/actions/activists';
import { listNeighborhoods } from '@/app/actions/neighborhoods';
import { prisma } from '@/lib/prisma';
import ActivistsClient from '@/app/components/activists/ActivistsClient';
import { Suspense } from 'react';

// Enable route caching - revalidate every 30 seconds
export const revalidate = 30;

export default async function WorkersPage() {
  const session = await auth();
  const t = await getTranslations('workers');
  const tCommon = await getTranslations('common');
  const locale = await getLocale();
  const isRTL = locale === 'he';

  if (!session) {
    redirect('/login');
  }

  // Fetch workers and sites
  const [workersResult, sitesResult] = await Promise.all([
    listWorkers({}),
    listNeighborhoods({}),
  ]);

  // Fetch activist coordinators (ActivistCoordinator records, not User records!)
  const supervisors = await prisma.activistCoordinator.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,  // ActivistCoordinator record ID
      userId: true,  // Include userId to find current user's coordinator record
      user: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      user: {
        fullName: 'asc',
      },
    },
  });

  // Find current user's coordinator record (if they are a coordinator)
  const currentUserSupervisor = supervisors.find((s: any) => s.userId === session.user.id);
  const defaultSupervisorId = currentUserSupervisor?.id || undefined;

  if (!workersResult.success) {
    return (
      <Box sx={{ p: 4, direction: isRTL ? 'rtl' : 'ltr' }}>
        <Typography variant="h5" color="error">
          {tCommon('error')}: {workersResult.error}
        </Typography>
      </Box>
    );
  }

  const workers = workersResult.workers || [];
  const sites = sitesResult.sites || [];

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
      <Box
        sx={{
          mb: 4,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: colors.neutral[900],
            mb: 0.5,
          }}
        >
          {t('title')}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: colors.neutral[600],
            fontWeight: 500,
          }}
        >
          {t('description')}
        </Typography>
      </Box>

      {/* Client Component with Modals */}
      <ActivistsClient
        workers={workers.map(w => ({
          ...w,
          neighborhood: w.neighborhood ? {
            id: w.neighborhood.id,
            name: w.neighborhood.name,
            cityId: w.neighborhood.cityRelation?.id || '',
            cityRelation: w.neighborhood.cityRelation,
          } : undefined,
          activistCoordinator: w.activistCoordinator ? {
            id: w.activistCoordinator.id,
            user: {
              fullName: w.activistCoordinator.user.fullName,
              email: w.activistCoordinator.user.email,
            },
          } : undefined,
        }))}
        sites={sites.map(s => ({
          id: s.id,
          name: s.name,
          cityId: s.cityId,
          cityRelation: s.cityRelation,
        }))}
        supervisors={supervisors}
        currentUserId={session.user.id}
        defaultSupervisorId={defaultSupervisorId}
      />
    </Box>
  );
}
