import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import { Box, Typography, Grid, Button } from '@mui/material';
import { signOut } from '@/auth.config';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import { getDashboardStats } from '@/app/actions/dashboard';
import KPICard from '@/app/components/dashboard/KPICard';
import QuickActions from '@/app/components/dashboard/QuickActions';
import RecentActivity from '@/app/components/dashboard/RecentActivity';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import MailIcon from '@mui/icons-material/Mail';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Fetch dashboard stats based on user role
  const statsResult = await getDashboardStats();

  if (!statsResult.success) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" color="error">
          Error loading dashboard: {statsResult.error}
        </Typography>
      </Box>
    );
  }

  const stats = statsResult.stats;
  const { role } = session.user;

  // Ensure stats exists
  if (!stats) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" color="error">
          No stats available
        </Typography>
      </Box>
    );
  }

  // Helper to render role-specific dashboard
  const renderDashboard = () => {
    if (role === 'SUPERADMIN') {
      return (
        <>
          {/* SuperAdmin KPIs */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <KPICard
                title="Total Corporations"
                value={stats.superadmin?.totalCorporations ?? 0}
                subtitle="Active companies"
                color="blue"
                icon={<BusinessIcon sx={{ fontSize: 24 }} />}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <KPICard
                title="Total Sites"
                value={stats.superadmin?.totalSites ?? 0}
                subtitle={`${stats.superadmin?.activeSites ?? 0} active`}
                color="green"
                icon={<LocationOnIcon sx={{ fontSize: 24 }} />}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <KPICard
                title="System Users"
                value={
                  (stats.superadmin?.totalManagers ?? 0) +
                  (stats.superadmin?.totalSupervisors ?? 0)
                }
                subtitle={`${stats.superadmin?.totalManagers ?? 0} managers, ${
                  stats.superadmin?.totalSupervisors ?? 0
                } supervisors`}
                color="purple"
                icon={<PeopleIcon sx={{ fontSize: 24 }} />}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <KPICard
                title="Total Workers"
                value={stats.superadmin?.totalWorkers ?? 0}
                subtitle={`${stats.superadmin?.activeWorkers ?? 0} active`}
                color="orange"
                icon={<GroupIcon sx={{ fontSize: 24 }} />}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <KPICard
                title="Pending Invitations"
                value={stats.superadmin?.pendingInvitations ?? 0}
                subtitle="Awaiting acceptance"
                color="red"
                icon={<MailIcon sx={{ fontSize: 24 }} />}
              />
            </Grid>
          </Grid>

          {/* Quick Actions - TODO: Implement with Client Component wrapper */}
          {/* <Box sx={{ mb: 4 }}>
            <QuickActions />
          </Box> */}
        </>
      );
    }

    if (role === 'MANAGER') {
      return (
        <>
          {/* Manager KPIs */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <KPICard
                title="Total Sites"
                value={stats.manager?.totalSites ?? 0}
                subtitle="In your corporation"
                color="green"
                icon={<LocationOnIcon sx={{ fontSize: 24 }} />}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <KPICard
                title="Total Workers"
                value={stats.manager?.totalWorkers ?? 0}
                subtitle={`${stats.manager?.activeWorkers ?? 0} active`}
                color="orange"
                icon={<GroupIcon sx={{ fontSize: 24 }} />}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <KPICard
                title="Total Supervisors"
                value={stats.manager?.totalSupervisors ?? 0}
                subtitle="Managing sites"
                color="purple"
                icon={<PeopleIcon sx={{ fontSize: 24 }} />}
              />
            </Grid>
          </Grid>

          {/* Quick Actions - TODO: Implement with Client Component wrapper */}
          {/* <Box sx={{ mb: 4 }}>
            <QuickActions />
          </Box> */}
        </>
      );
    }

    if (role === 'SUPERVISOR') {
      return (
        <>
          {/* Supervisor KPIs - Mobile-First */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <KPICard
                title="Total Workers"
                value={stats.supervisor?.totalWorkers ?? 0}
                subtitle={`${stats.supervisor?.activeWorkers ?? 0} active`}
                color="orange"
                icon={<GroupIcon sx={{ fontSize: 24 }} />}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <KPICard
                title="Your Site"
                value={stats.supervisor?.site?.name ?? 'N/A'}
                subtitle={`${stats.supervisor?.site?.isActive ? 'Active' : 'Inactive'}`}
                color="green"
                icon={<LocationOnIcon sx={{ fontSize: 24 }} />}
              />
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
            Welcome back, {session.user.name}! 👋
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: colors.neutral[600],
              fontWeight: 500,
            }}
          >
            Role: <strong>{role}</strong>
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
            Sign Out
          </Button>
        </form>
      </Box>

      {/* Role-Specific Dashboard Content */}
      {renderDashboard()}

      {/* Recent Activity Section */}
      {stats.recentActivity && stats.recentActivity.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: colors.neutral[800],
              mb: 3,
            }}
          >
            Recent Activity
          </Typography>
          <RecentActivity activities={stats.recentActivity} maxItems={10} />
        </Box>
      )}

      {/* Empty State for Recent Activity */}
      {(!stats.recentActivity || stats.recentActivity.length === 0) && (
        <Box
          sx={{
            mt: 4,
            p: 4,
            background: colors.neutral[0],
            borderRadius: borderRadius.xl,
            boxShadow: shadows.soft,
            border: `1px solid ${colors.neutral[200]}`,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="body1"
            sx={{
              color: colors.neutral[400],
            }}
          >
            No recent activity yet. Start by creating your first corporation!
          </Typography>
        </Box>
      )}
    </Box>
  );
}
