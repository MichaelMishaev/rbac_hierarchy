import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { getTranslations, getLocale } from 'next-intl/server';
import { colors } from '@/lib/design-system';
import { listWorkers } from '@/app/actions/activists';
import { listNeighborhoods } from '@/app/actions/neighborhoods';
import { getAreaManagers, listCities } from '@/app/actions/cities';
import { prisma } from '@/lib/prisma';
import ActivistsClient from '@/app/components/activists/ActivistsClient';

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

  // Fetch activists, neighborhoods, areas, and cities
  const [workersResult, sitesResult, areasResult, citiesResult] = await Promise.all([
    listWorkers({}),
    listNeighborhoods({}),
    getAreaManagers(),
    listCities({}),
  ]);

  // Fetch activist coordinators (ActivistCoordinator records, not User records!)
  const activistCoordinators = await prisma.activistCoordinator.findMany({
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
  const currentUserActivistCoordinator = activistCoordinators.find((c: any) => c.userId === session.user.id);
  const defaultActivistCoordinatorId = currentUserActivistCoordinator?.id || undefined;

  if (!workersResult.success) {
    return (
      <Box sx={{ p: 4, direction: isRTL ? 'rtl' : 'ltr' }}>
        <Typography variant="h5" color="error">
          {tCommon('error')}: {workersResult.error}
        </Typography>
      </Box>
    );
  }

  const activists = workersResult.activists || [];
  const neighborhoods = sitesResult.neighborhoods || [];
  const areas = areasResult.areaManagers || [];
  const cities = citiesResult.cities || [];

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
        // @ts-ignore TODO Week 3: Fix type incompatibility with exactOptionalPropertyTypes
        activists={activists.map(a => ({
          ...a,
          // Map 'neighborhood' to 'site' for ActivistsClient (legacy naming)
          site: a.neighborhood ? {
            id: a.neighborhood.id,
            name: a.neighborhood.name,
            cityId: a.neighborhood.cityRelation?.id || '',
            cityRelation: a.neighborhood.cityRelation || undefined,
          } : undefined,
          activistCoordinator: a.activistCoordinator ? {
            id: a.activistCoordinator.id,
            user: {
              fullName: a.activistCoordinator.user.fullName,
              email: a.activistCoordinator.user.email,
            },
          } : undefined,
        }))}
        neighborhoods={neighborhoods.map(n => ({
          id: n.id,
          name: n.name,
          cityId: n.cityId,
          cityRelation: n.cityRelation || undefined,
        }))}
        activistCoordinators={activistCoordinators}
        areas={areas.map(a => ({
          id: a.id,
          regionName: a.regionName,
          regionCode: a.regionCode,
        }))}
        cities={cities.map(c => ({
          id: c.id,
          name: c.name,
          code: c.code,
          areaManagerId: c.areaManagerId || '',
        }))}
        currentUserId={session.user.id}
        defaultActivistCoordinatorId={defaultActivistCoordinatorId}
      />
    </Box>
  );
}
