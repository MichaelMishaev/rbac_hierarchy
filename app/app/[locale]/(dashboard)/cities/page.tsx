import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { getTranslations, getLocale } from 'next-intl/server';
import { colors } from '@/lib/design-system';
import { prisma } from '@/lib/prisma';
import CitiesClient from '@/app/components/cities/CitiesClient';

// Enable route caching - revalidate every 30 seconds
export const revalidate = 30;

export default async function CorporationsPage() {
  const session = await auth();
  const t = await getTranslations('citys');
  const tCommon = await getTranslations('common');
  const locale = await getLocale();
  const isRTL = locale === 'he';

  if (!session) {
    redirect('/login');
  }

  // SuperAdmin and AreaManager can access this page
  if (session.user.role !== 'SUPERADMIN' && session.user.role !== 'AREA_MANAGER') {
    return (
      <Box sx={{ p: 4, direction: isRTL ? 'rtl' : 'ltr' }}>
        <Typography variant="h5" color="error">
          {t('accessDenied')}
        </Typography>
      </Box>
    );
  }

  // Build query filter based on role
  const whereClause: any = {};

  // AREA_MANAGER: Only see corporations assigned to them
  if (session.user.role === 'AREA_MANAGER') {
    const areaManagerRecord = await prisma.areaManager.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (areaManagerRecord) {
      whereClause.areaManagerId = areaManagerRecord.id;
    } else {
      // Area Manager record not found - show empty list
      whereClause.id = 'non-existent';
    }
  }
  // SUPERADMIN: See all corporations (no filter needed)

  // v1.4: Fetch cities with areaManager relation
  const citiesData = await prisma.city.findMany({
    where: whereClause,
    include: {
      areaManager: {
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          coordinators: true,
          activistCoordinators: true,
          neighborhoods: true,
          invitations: true,
        },
      },
    },
    orderBy: [
      { name: 'asc' },
    ],
  });

  // Transform null to undefined for optional relations (TypeScript compatibility)
  const cities = citiesData.map(city => ({
    ...city,
    areaManager: city.areaManager || undefined,
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
      <CitiesClient
        cities={cities}
        userRole={session.user.role}
      />
    </Box>
  );
}
