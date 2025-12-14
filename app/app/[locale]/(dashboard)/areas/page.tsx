import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { getTranslations, getLocale } from 'next-intl/server';
import { colors } from '@/lib/design-system';
import { prisma } from '@/lib/prisma';
import AreasClient from '@/app/components/areas/AreasClient';

// Enable route caching - revalidate every 30 seconds
export const revalidate = 30;

export default async function AreasPage() {
  const session = await auth();
  const t = await getTranslations('areas');
  const tCommon = await getTranslations('common');
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

  // Area Managers can only see their own area
  if (session.user.role === 'AREA_MANAGER') {
    whereClause = {
      userId: session.user.id,
    };
  }
  // SuperAdmin sees all areas (no filter)

  // Fetch area managers with their associated data
  const areasData = await prisma.areaManager.findMany({
    where: whereClause,
    include: {
      user: {
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
      />
    </Box>
  );
}
