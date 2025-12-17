import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import { Box } from '@mui/material';
import { getLocale } from 'next-intl/server';
import NavigationV3 from '@/app/components/layout/NavigationV3';
import MobileBottomNav from '@/app/components/layout/BottomNavigation';
import ContextAwareFAB from '@/app/components/layout/FloatingActionButton';
import QueryProvider from '@/app/providers/QueryProvider';
import ProgressBar from '@/app/components/ui/ProgressBar';
import CommandPaletteWrapper from '@/app/components/ui/CommandPaletteWrapper';
import PushNotificationPrompt from '@/app/components/PushNotificationPrompt';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const locale = await getLocale();
  const isRTL = locale === 'he';

  if (!session) {
    redirect('/login');
  }

  // Map ACTIVIST_COORDINATOR to SUPERVISOR for navigation compatibility
  const navRole = session.user.role === 'ACTIVIST_COORDINATOR'
    ? 'SUPERVISOR'
    : (session.user.role === 'CITY_COORDINATOR' ? 'MANAGER' : session.user.role);

  return (
    <QueryProvider>
      <ProgressBar />
      <CommandPaletteWrapper />
      <PushNotificationPrompt />
      <Box sx={{ display: 'flex', minHeight: '100vh', direction: isRTL ? 'rtl' : 'ltr' }}>
        {/* Desktop Sidebar - Hidden on mobile */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <NavigationV3
            role={navRole as 'SUPERADMIN' | 'AREA_MANAGER' | 'MANAGER' | 'SUPERVISOR'}
            userEmail={session.user.email}
            stats={{
              pendingInvites: 0,  // TODO: Fetch from API
              activeWorkers: 0,   // TODO: Fetch from API
              activeSites: 0,     // TODO: Fetch from API
            }}
          />
        </Box>

        {/* Main Content - Mobile: bottom padding for nav, Desktop: sidebar margin */}
        <Box
          sx={{
            flex: 1,
            mr: { xs: 0, md: isRTL ? '280px' : 0 },
            ml: { xs: 0, md: isRTL ? 0 : '280px' },
            width: { xs: '100%', md: 'calc(100% - 280px)' },
            minHeight: '100vh',
            pb: { xs: '64px', md: 0 }, // Bottom padding for mobile nav bar
          }}
        >
          {children}
        </Box>

        {/* Mobile Bottom Navigation - Hidden on desktop */}
        <MobileBottomNav />

        {/* Context-Aware Floating Action Button */}
        <ContextAwareFAB />
      </Box>
    </QueryProvider>
  );
}
