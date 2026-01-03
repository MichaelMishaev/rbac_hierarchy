import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { getTranslations, getLocale } from 'next-intl/server';
import { colors } from '@/lib/design-system';
import { prisma } from '@/lib/prisma';
import { listNeighborhoods } from '@/app/actions/neighborhoods';
import { listCities } from '@/app/actions/cities';
import { listAreas } from '@/app/actions/areas';
import NeighborhoodsClient from '@/app/components/neighborhoods/NeighborhoodsClient';

// Enable route caching - revalidate every 30 seconds
export const revalidate = 30;

export default async function SitesPage() {
  const session = await auth();
  const t = await getTranslations('sites');
  const tCommon = await getTranslations('common');
  const locale = await getLocale();
  const isRTL = locale === 'he';

  if (!session) {
    redirect('/login');
  }

  // ALL roles can access - data filtering happens in listNeighborhoods() action
  // Fetch neighborhoods, cities, and areas
  let sitesResult, citiesResult, areasResult;
  try {
    [sitesResult, citiesResult, areasResult] = await Promise.all([
      listNeighborhoods({}),
      listCities({}),
      listAreas(),
    ]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
    return (
      <Box sx={{ p: 4, direction: isRTL ? 'rtl' : 'ltr' }}>
        <Typography variant="h5" color="error">
          {tCommon('error')}: {errorMessage}
        </Typography>
      </Box>
    );
  }

  if (!sitesResult.success) {
    return (
      <Box sx={{ p: 4, direction: isRTL ? 'rtl' : 'ltr' }}>
        <Typography variant="h5" color="error">
          {tCommon('error')}: Failed to load neighborhoods
        </Typography>
      </Box>
    );
  }

  const neighborhoods = sitesResult.neighborhoods || [];
  const cities = citiesResult.cities || [];
  const areas = areasResult.areas || [];

  // Get current user's city if they're a City Coordinator
  let userCityId: string | undefined;
  let superiorUser: { fullName: string; email: string } | null = null;

  if (session.user.role === 'CITY_COORDINATOR') {
    // Import getCurrentUser to get full user data
    const { getCurrentUser } = await import('@/lib/auth');
    const currentUser = await getCurrentUser();
    userCityId = currentUser.coordinatorOf[0]?.cityId;

    // Fetch Area Manager as superior user for City Coordinators
    if (userCityId) {
      const city = await prisma.city.findUnique({
        where: { id: userCityId },
        select: {
          areaManager: {
            select: {
              user: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (city?.areaManager?.user) {
        superiorUser = city.areaManager.user;
      }
    }
  } else if (session.user.role === 'ACTIVIST_COORDINATOR') {
    // Fetch City Coordinator as superior user for Activist Coordinators
    const { getCurrentUser } = await import('@/lib/auth');
    const currentUser = await getCurrentUser();
    const cityId = currentUser.activistCoordinatorOf[0]?.cityId;

    if (cityId) {
      const cityCoordinator = await prisma.cityCoordinator.findFirst({
        where: { cityId },
        select: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      });

      if (cityCoordinator?.user) {
        superiorUser = cityCoordinator.user;
      }
    }
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
      <NeighborhoodsClient
        neighborhoods={neighborhoods}
        cities={cities.map(c => ({ id: c.id, name: c.name, code: c.code, areaManagerId: c.areaManagerId }))}
        areas={areas.map(a => ({ id: a.id, regionName: a.regionName, regionCode: a.regionCode }))}
        userRole={session.user.role}
        userCityId={userCityId}
        superiorUser={superiorUser}
      />
    </Box>
  );
}
