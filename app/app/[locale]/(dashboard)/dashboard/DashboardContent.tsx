import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import { Box, Typography, Grid, Button } from '@mui/material';
import { signOut } from '@/auth.config';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import { getDashboardStats } from '@/app/actions/dashboard';
import { getTranslations, getLocale } from 'next-intl/server';
import DashboardClient from '@/app/components/dashboard/DashboardClient';
import RecentActivity from '@/app/components/dashboard/RecentActivity';
import OrganizationalTreeD3 from '@/app/components/dashboard/OrganizationalTreeD3';
import MonthlyTrendsChart from '@/app/components/dashboard/MonthlyTrendsChart';
import StatusDistributionChart from '@/app/components/dashboard/StatusDistributionChart';
import CollapsibleCard from '@/app/components/ui/CollapsibleCard';
import EmptyState from '@/app/components/ui/EmptyState';
import LiveActivityFeed from '@/app/components/dashboard/LiveActivityFeed';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import MailIcon from '@mui/icons-material/Mail';
import InboxIcon from '@mui/icons-material/Inbox';

export default async function DashboardContent() {
  const session = await auth();
  const t = await getTranslations('dashboard');
  const tCommon = await getTranslations('common');
  const locale = await getLocale();
  const isRTL = locale === 'he';

  if (!session) {
    redirect('/login');
  }

  // Fetch user's comprehensive role information from database
  const { getCurrentUser } = await import('@/lib/auth');
  const currentUserData = await getCurrentUser();
  const { role } = session.user;

  // Build comprehensive role description
  let roleDescription: string = '';

  if (currentUserData.role === 'SUPERADMIN') {
    roleDescription = 'מנהל על';
  } else if (currentUserData.role === 'AREA_MANAGER' && currentUserData.areaManager) {
    const regionName = currentUserData.areaManager.regionName;
    const cityCount = currentUserData.areaManager.cities.length;
    roleDescription = `מנהל אזור ${regionName} (${cityCount} ערים)`;
  } else if (currentUserData.role === 'CITY_COORDINATOR' && currentUserData.coordinatorOf.length > 0) {
    const coordinator = currentUserData.coordinatorOf[0];
    const cityName = coordinator.city.name;
    roleDescription = `מנהל עיר - ${cityName}`;
  } else if (currentUserData.role === 'ACTIVIST_COORDINATOR' && currentUserData.activistCoordinatorOf.length > 0) {
    const coordinator = currentUserData.activistCoordinatorOf[0];
    const cityName = coordinator.city.name;
    const neighborhoods = currentUserData.activistCoordinatorNeighborhoods;
    const neighborhoodCount = neighborhoods.length;

    if (neighborhoodCount > 0) {
      const neighborhoodNames = neighborhoods.map(n => n.neighborhood.name).join(', ');
      roleDescription = `מפקח - ${cityName} (${neighborhoodCount} שכונות: ${neighborhoodNames})`;
    } else {
      roleDescription = `מפקח - ${cityName}`;
    }
  } else {
    // Fallback to basic role labels
    roleDescription =
      role === 'MANAGER' ? 'מנהל עיר' :
      role === 'SUPERVISOR' ? 'מפקח' :
      role === 'ACTIVIST_COORDINATOR' ? 'מפקח' :
      role === 'CITY_COORDINATOR' ? 'מנהל עיר' : role;
  }

  // Fetch dashboard stats based on user role
  const statsResult = await getDashboardStats();

  if (!statsResult.success) {
    return (
      <Box sx={{ p: 4, direction: isRTL ? 'rtl' : 'ltr' }}>
        <Typography variant="h5" color="error">
          {tCommon('error')}: {statsResult.error}
        </Typography>
      </Box>
    );
  }

  const stats = statsResult.stats;

  // Ensure stats exists
  if (!stats) {
    return (
      <Box sx={{ p: 4, direction: isRTL ? 'rtl' : 'ltr' }}>
        <Typography variant="h5" color="error">
          {tCommon('error')}
        </Typography>
      </Box>
    );
  }

  // Helper to render role-specific dashboard
  const renderDashboard = () => {
    if (role === 'SUPERADMIN') {
      const superadminCards = [
        {
          title: t('totalCities'),
          value: stats.superadmin?.totalCities ?? 0,
          subtitle: t('activeCities'),
          color: 'blue' as const,
          icon: <BusinessIcon sx={{ fontSize: 24 }} />,
          href: `/${locale}/cities`,
        },
        {
          title: t('totalNeighborhoods'),
          value: stats.superadmin?.totalNeighborhoods ?? 0,
          subtitle: `${stats.superadmin?.activeNeighborhoods ?? 0} ${tCommon('active')}`,
          color: 'green' as const,
          icon: <LocationOnIcon sx={{ fontSize: 24 }} />,
          href: `/${locale}/neighborhoods`,
        },
        {
          title: t('systemUsers'),
          value:
            (stats.superadmin?.totalManagers ?? 0) +
            (stats.superadmin?.totalSupervisors ?? 0),
          subtitle: `${stats.superadmin?.totalManagers ?? 0} ${t('managers')}, ${
            stats.superadmin?.totalSupervisors ?? 0
          } ${t('supervisors')}`,
          color: 'purple' as const,
          icon: <PeopleIcon sx={{ fontSize: 24 }} />,
          href: `/${locale}/users`,
        },
        {
          title: t('totalActivists'),
          value: stats.superadmin?.totalActivists ?? 0,
          subtitle: `${stats.superadmin?.activeActivists ?? 0} ${tCommon('active')}`,
          color: 'orange' as const,
          icon: <GroupIcon sx={{ fontSize: 24 }} />,
          href: `/${locale}/activists`,
        },
        {
          title: t('pendingInvitations'),
          value: stats.superadmin?.pendingInvitations ?? 0,
          subtitle: t('awaitingAcceptance'),
          color: 'red' as const,
          icon: <MailIcon sx={{ fontSize: 24 }} />,
        },
      ];

      // Mock data for monthly trends (replace with real data from API)
      const monthlyTrendsData = [
        { month: 'ינואר', corporations: 12, sites: 45, workers: 320 },
        { month: 'פברואר', corporations: 15, sites: 52, workers: 380 },
        { month: 'מרץ', corporations: 18, sites: 61, workers: 425 },
        { month: 'אפריל', corporations: 20, sites: 70, workers: 490 },
        { month: 'מאי', corporations: 23, sites: 78, workers: 550 },
        { month: 'יוני', corporations: stats.superadmin?.totalCities ?? 25, sites: stats.superadmin?.totalNeighborhoods ?? 85, workers: stats.superadmin?.totalActivists ?? 600 },
      ];

      // Mock data for status distribution (replace with real data)
      const statusDistributionData = [
        { name: 'ערים פעילות', value: stats.superadmin?.totalCities ?? 0, color: colors.status.blue },
        { name: 'שכונות פעילות', value: stats.superadmin?.activeNeighborhoods ?? 0, color: colors.status.green },
        { name: 'פעילים פעילים', value: stats.superadmin?.activeActivists ?? 0, color: colors.status.orange },
      ];

      return (
        <>
          {/* SuperAdmin KPIs with Navigation */}
          <DashboardClient cards={superadminCards} />

          {/* Data Visualization Charts */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Monthly Trends Chart */}
            <Grid item xs={12} lg={8}>
              <CollapsibleCard title={isRTL ? 'מגמות חודשיות' : 'Monthly Trends'} defaultExpanded={false}>
                <MonthlyTrendsChart
                  data={monthlyTrendsData}
                  dataKeys={[
                    { key: 'corporations', label: isRTL ? 'ערים' : 'Cities', color: colors.status.blue },
                    { key: 'sites', label: isRTL ? 'שכונות' : 'Neighborhoods', color: colors.status.green },
                    { key: 'workers', label: isRTL ? 'פעילים' : 'Activists', color: colors.status.orange },
                  ]}
                />
              </CollapsibleCard>
            </Grid>

            {/* Status Distribution Chart */}
            <Grid item xs={12} lg={4}>
              <CollapsibleCard title={isRTL ? 'התפלגות לפי סטטוס' : 'Status Distribution'} defaultExpanded={false}>
                <StatusDistributionChart
                  data={statusDistributionData}
                  type="donut"
                />
              </CollapsibleCard>
            </Grid>
          </Grid>

          {/* Organizational Tree Visualization */}
          <Box
            sx={{
              mb: 4,
              p: 3,
              background: colors.neutral[0],
              borderRadius: borderRadius.xl,
              boxShadow: shadows.medium,
              border: `1px solid ${colors.neutral[200]}`,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: colors.neutral[800],
                mb: 3,
              }}
            >
              {isRTL ? 'היררכיית המערכת' : 'System Hierarchy'}
            </Typography>
            <OrganizationalTreeD3 />
          </Box>
        </>
      );
    }

    if (role === 'MANAGER') {
      const managerCards = [
        {
          title: t('totalNeighborhoods'),
          value: stats.manager?.totalNeighborhoods ?? 0,
          subtitle: t('allLocations'),
          color: 'green' as const,
          icon: <LocationOnIcon sx={{ fontSize: 24 }} />,
          href: `/${locale}/neighborhoods`,
        },
        {
          title: t('totalActivists'),
          value: stats.manager?.totalActivists ?? 0,
          subtitle: `${stats.manager?.activeActivists ?? 0} ${tCommon('active')}`,
          color: 'orange' as const,
          icon: <GroupIcon sx={{ fontSize: 24 }} />,
          href: `/${locale}/activists`,
        },
        {
          title: t('supervisors'),
          value: stats.manager?.totalSupervisors ?? 0,
          subtitle: t('allLocations'),
          color: 'purple' as const,
          icon: <PeopleIcon sx={{ fontSize: 24 }} />,
          href: `/${locale}/users`,
        },
      ];

      return (
        <>
          {/* Manager KPIs and Live Feed - Two Column Layout */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Left: KPI Cards */}
            <Grid item xs={12} lg={8}>
              <DashboardClient cards={managerCards} />
            </Grid>

            {/* Right: Live Activity Feed */}
            <Grid item xs={12} lg={4}>
              <Box
                sx={{
                  p: 3,
                  background: colors.neutral[0],
                  borderRadius: borderRadius.xl,
                  boxShadow: shadows.medium,
                  border: `1px solid ${colors.neutral[200]}`,
                  height: '100%',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: colors.neutral[800],
                    mb: 2,
                  }}
                >
                  {isRTL ? 'פעילות בזמן אמת' : 'Live Activity'}
                </Typography>
                <LiveActivityFeed />
              </Box>
            </Grid>
          </Grid>
        </>
      );
    }

    if (role === 'SUPERVISOR') {
      const supervisorCards = [
        {
          title: t('totalActivists'),
          value: stats.supervisor?.totalActivists ?? 0,
          subtitle: `${stats.supervisor?.activeActivists ?? 0} ${tCommon('active')}`,
          color: 'orange' as const,
          icon: <GroupIcon sx={{ fontSize: 24 }} />,
          href: `/${locale}/activists`,
        },
        {
          title: t('totalNeighborhoods'),
          value: stats.supervisor?.neighborhood?.name ?? 'N/A',
          subtitle: stats.supervisor?.neighborhood?.isActive ? tCommon('active') : tCommon('inactive'),
          color: 'green' as const,
          icon: <LocationOnIcon sx={{ fontSize: 24 }} />,
          href: `/${locale}/neighborhoods`,
        },
      ];

      return (
        <>
          {/* Supervisor KPIs and Live Feed - Two Column Layout */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Left: KPI Cards */}
            <Grid item xs={12} md={8}>
              <DashboardClient cards={supervisorCards} />
            </Grid>

            {/* Right: Live Activity Feed */}
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  p: 3,
                  background: colors.neutral[0],
                  borderRadius: borderRadius.xl,
                  boxShadow: shadows.medium,
                  border: `1px solid ${colors.neutral[200]}`,
                  height: '100%',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: colors.neutral[800],
                    mb: 2,
                  }}
                >
                  {isRTL ? 'פעילות בזמן אמת' : 'Live Activity'}
                </Typography>
                <LiveActivityFeed />
              </Box>
            </Grid>
          </Grid>
        </>
      );
    }
  };

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
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: colors.neutral[900],
              mb: 0.5,
            }}
          >
            {t('welcome', { name: session.user.name })}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: colors.neutral[600],
              fontWeight: 500,
            }}
          >
            {t('role')}: <strong>{roleDescription}</strong>
          </Typography>
        </Box>

        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/login' });
          }}
        >
          <Button
            type="submit"
            variant="outlined"
            sx={{
              borderColor: colors.neutral[300],
              color: colors.neutral[700],
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                borderColor: colors.error,
                backgroundColor: colors.pastel.redLight,
                color: colors.error,
              },
            }}
          >
            {tCommon('signOut')}
          </Button>
        </form>
      </Box>

      {/* Role-Specific Dashboard Content */}
      {renderDashboard()}

      {/* Recent Activity Section with Empty State */}
      {stats.recentActivity && stats.recentActivity.length > 0 ? (
        <Box sx={{ mt: 4 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: colors.neutral[800],
              mb: 3,
            }}
          >
            {t('recentActivity')}
          </Typography>
          <RecentActivity activities={stats.recentActivity} maxItems={10} />
        </Box>
      ) : (
        <Box sx={{ mt: 4 }}>
          <EmptyState
            title={isRTL ? 'אין פעילות עדיין' : 'No activity yet'}
            description={isRTL
              ? 'התחל בהוספת תאגיד ראשון כדי לראות סטטיסטיקות ופעילות במערכת'
              : 'Start by adding your first corporation to see statistics and activity in the system'
            }
            icon={<InboxIcon />}
          />
        </Box>
      )}
    </Box>
  );
}
