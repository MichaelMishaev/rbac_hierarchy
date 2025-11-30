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
  const { role } = session.user;

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
          title: t('totalCorporations'),
          value: stats.superadmin?.totalCorporations ?? 0,
          subtitle: t('activeCompanies'),
          color: 'blue' as const,
          icon: <BusinessIcon sx={{ fontSize: 24 }} />,
          href: `/${locale}/corporations`,
        },
        {
          title: t('totalSites'),
          value: stats.superadmin?.totalSites ?? 0,
          subtitle: `${stats.superadmin?.activeSites ?? 0} ${tCommon('active')}`,
          color: 'green' as const,
          icon: <LocationOnIcon sx={{ fontSize: 24 }} />,
          href: `/${locale}/sites`,
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
          title: t('totalWorkers'),
          value: stats.superadmin?.totalWorkers ?? 0,
          subtitle: `${stats.superadmin?.activeWorkers ?? 0} ${tCommon('active')}`,
          color: 'orange' as const,
          icon: <GroupIcon sx={{ fontSize: 24 }} />,
          href: `/${locale}/workers`,
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
        { month: 'יוני', corporations: stats.superadmin?.totalCorporations ?? 25, sites: stats.superadmin?.totalSites ?? 85, workers: stats.superadmin?.totalWorkers ?? 600 },
      ];

      // Mock data for status distribution (replace with real data)
      const statusDistributionData = [
        { name: 'תאגידים פעילים', value: stats.superadmin?.totalCorporations ?? 0, color: colors.status.blue },
        { name: 'אתרים פעילים', value: stats.superadmin?.activeSites ?? 0, color: colors.status.green },
        { name: 'עובדים פעילים', value: stats.superadmin?.activeWorkers ?? 0, color: colors.status.orange },
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
                    { key: 'corporations', label: isRTL ? 'תאגידים' : 'Corporations', color: colors.status.blue },
                    { key: 'sites', label: isRTL ? 'אתרים' : 'Sites', color: colors.status.green },
                    { key: 'workers', label: isRTL ? 'עובדים' : 'Workers', color: colors.status.orange },
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
          title: t('totalSites'),
          value: stats.manager?.totalSites ?? 0,
          subtitle: t('allLocations'),
          color: 'green' as const,
          icon: <LocationOnIcon sx={{ fontSize: 24 }} />,
          href: `/${locale}/sites`,
        },
        {
          title: t('totalWorkers'),
          value: stats.manager?.totalWorkers ?? 0,
          subtitle: `${stats.manager?.activeWorkers ?? 0} ${tCommon('active')}`,
          color: 'orange' as const,
          icon: <GroupIcon sx={{ fontSize: 24 }} />,
          href: `/${locale}/workers`,
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
          {/* Manager KPIs with Navigation */}
          <DashboardClient cards={managerCards} />
        </>
      );
    }

    if (role === 'SUPERVISOR') {
      const supervisorCards = [
        {
          title: t('totalWorkers'),
          value: stats.supervisor?.totalWorkers ?? 0,
          subtitle: `${stats.supervisor?.activeWorkers ?? 0} ${tCommon('active')}`,
          color: 'orange' as const,
          icon: <GroupIcon sx={{ fontSize: 24 }} />,
          href: `/${locale}/workers`,
        },
        {
          title: t('totalSites'),
          value: stats.supervisor?.site?.name ?? 'N/A',
          subtitle: stats.supervisor?.site?.isActive ? tCommon('active') : tCommon('inactive'),
          color: 'green' as const,
          icon: <LocationOnIcon sx={{ fontSize: 24 }} />,
          href: `/${locale}/sites`,
        },
      ];

      return (
        <>
          {/* Supervisor KPIs with Navigation - Mobile-First */}
          <DashboardClient cards={supervisorCards} />
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
            {t('role')}: <strong>{
              role === 'SUPERADMIN' ? 'מנהל על' :
              role === 'MANAGER' ? 'מנהל' :
              role === 'SUPERVISOR' ? 'מפקח' : role
            }</strong>
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
