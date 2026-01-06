import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { getTranslations, getLocale } from 'next-intl/server';
import { colors } from '@/lib/design-system';
import { prisma } from '@/lib/prisma';
import CitiesClient from '@/app/components/cities/CitiesClient';

// Enable ISR (Incremental Static Regeneration) for background updates
// This allows pages to update in the background without disrupting user interactions
// See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
export const revalidate = 30; // Revalidate every 30 seconds

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
          גישה נדחתה. רק מנהל על ומנהלי מחוז יכולים לצפות בערים.
        </Typography>
      </Box>
    );
  }

  // ============================================
  // LOCKED DATA FILTERING LOGIC
  // ============================================
  const whereClause: any = {};
  let currentUserAreaManager = null;
  let superiorUser: { fullName: string; email: string } | null = null;

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
  // SUPERADMIN: See all cities (no filter needed)

  // v1.4: Fetch cities with areaManager relation
  // CRITICAL FIX: Cannot use where clause on one-to-one relation (Prisma limitation)
  // Soft-deleted users (isActive = false) are filtered in the transformation below
  const citiesData = await prisma.city.findMany({
    where: whereClause,
    include: {
      areaManager: {
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              isActive: true, // Include isActive field for filtering
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
  // Filter out soft-deleted users (isActive = false) from area managers
  const cities = citiesData.map(city => ({
    ...city,
    areaManager: city.areaManager ? {
      id: city.areaManager.id,
      regionName: city.areaManager.regionName,
      // Only include user if they are active (not soft-deleted)
      user: (city.areaManager.user && city.areaManager.user.isActive !== false)
        ? { fullName: city.areaManager.user.fullName, email: city.areaManager.user.email }
        : { fullName: '', email: '' },
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
        cities={cities}
        userRole={session.user.role}
        currentUserAreaManager={currentUserAreaManager}
        superiorUser={superiorUser}
      />
    </Box>
  );
}
