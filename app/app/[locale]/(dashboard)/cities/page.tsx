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
  const locale = await getLocale();
  const isRTL = locale === 'he';

  if (!session) {
    redirect('/login');
  }

  // ============================================
  // ⚠️ LOCKED LOGIC - DO NOT MODIFY WITHOUT APPROVAL
  // ============================================
  // Cities page is LOCKED to SuperAdmin and Area Manager ONLY
  //
  // REASON: Cities are top-level organizational units
  // - City Coordinators manage ONE city (they don't need to see the list)
  // - Activist Coordinators work within neighborhoods (cities are out of scope)
  //
  // CHANGING THIS LOGIC WILL CAUSE REGRESSION BUGS
  // Date Locked: 2025-12-15
  // Approved By: User requirement
  // ============================================
  if (session.user.role !== 'SUPERADMIN' && session.user.role !== 'AREA_MANAGER') {
    return (
      <Box sx={{ p: 4, direction: isRTL ? 'rtl' : 'ltr' }}>
        <Typography variant="h5" color="error">
          {isRTL ? 'גישה נדחתה. רק מנהל על ומנהלי אזור יכולים לצפות בערים.' : 'Access denied. Only SuperAdmin and Area Managers can view cities.'}
        </Typography>
      </Box>
    );
  }

  // ============================================
  // LOCKED DATA FILTERING LOGIC
  // ============================================
  const whereClause: any = {};
  let currentUserAreaManager = null;

  if (session.user.role === 'AREA_MANAGER') {
    // AREA_MANAGER: Only see cities assigned to their area
    const areaManagerRecord = await prisma.areaManager.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        regionName: true,
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (areaManagerRecord) {
      whereClause.areaManagerId = areaManagerRecord.id;
      currentUserAreaManager = {
        id: areaManagerRecord.id,
        regionName: areaManagerRecord.regionName,
        fullName: areaManagerRecord.user?.fullName || '',
        email: areaManagerRecord.user?.email || '',
      };
    } else {
      // Area Manager record not found - show empty list
      whereClause.id = 'non-existent';
    }
  }
  // SUPERADMIN: See all cities (no filter needed)

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

  // Transform to match expected type
  const cities = citiesData.map(city => ({
    ...city,
    areaManager: city.areaManager ? {
      id: city.areaManager.id,
      regionName: city.areaManager.regionName,
      user: city.areaManager.user || { fullName: '', email: '' },
    } : undefined,
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
        // @ts-ignore TODO Week 3: Fix type incompatibility with exactOptionalPropertyTypes
        cities={cities}
        userRole={session.user.role}
        currentUserAreaManager={currentUserAreaManager}
      />
    </Box>
  );
}
