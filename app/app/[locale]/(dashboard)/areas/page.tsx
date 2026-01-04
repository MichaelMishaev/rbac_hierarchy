import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { getTranslations, getLocale } from 'next-intl/server';
import { colors } from '@/lib/design-system';
import { prisma } from '@/lib/prisma';
import AreasClient from '@/app/components/areas/AreasClient';

// Enable ISR (Incremental Static Regeneration) for background updates
// This allows pages to update in the background without disrupting user interactions
// See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
export const revalidate = 30; // Revalidate every 30 seconds

export default async function AreasPage() {
  const session = await auth();
  const t = await getTranslations('areas');
  const locale = await getLocale();
  const isRTL = locale === 'he';

  if (!session) {
    redirect('/login');
  }

  // RBAC: Only SuperAdmin and Area Managers can access this page
  if (session.user.role !== 'SUPERADMIN' && session.user.role !== 'AREA_MANAGER') {
    return (
      <Box sx={{ p: 4, direction: isRTL ? 'rtl' : 'ltr' }}>
        <Typography variant="h5" color="error">
          {t('accessDenied')}
        </Typography>
      </Box>
    );
  }

  // Build query based on role
  let whereClause: any = {};
  let superiorUser: { fullName: string; email: string } | null = null;

  // Area Managers can only see their own area
  if (session.user.role === 'AREA_MANAGER') {
    whereClause = {
      userId: session.user.id,
    };

    // Fetch SuperAdmin as superior user for Area Managers
    const superAdmin = await prisma.user.findFirst({
      where: {
        isSuperAdmin: true,
        isActive: true,
      },
      select: {
        fullName: true,
        email: true,
      },
    });

    superiorUser = superAdmin;
  }
  // SuperAdmin sees all areas (no filter)

  // Fetch area managers with their associated data
  // CRITICAL FIX: Filter out soft-deleted users (isActive = false)
  const areasData = await prisma.areaManager.findMany({
    where: whereClause,
    include: {
      user: {
        where: {
          isActive: true, // Only include active users (filters soft-deleted)
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          isActive: true,
        },
      },
      cities: {
        select: {
          id: true,
          name: true,
          code: true,
          isActive: true,
        },
      },
    },
    orderBy: [
      { isActive: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  // Transform data for client component
  const areas = areasData.map(area => ({
    id: area.id,
    regionName: area.regionName,
    regionCode: area.regionCode,
    isActive: area.isActive,
    createdAt: area.createdAt,
    updatedAt: area.updatedAt,
    metadata: area.metadata,
    user: area.user,
    cities: area.cities,
    citiesCount: area.cities.length,
  }));

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
      <AreasClient
        areas={areas}
        userRole={session.user.role}
        superiorUser={superiorUser}
      />
    </Box>
  );
}
