import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import { Box } from '@mui/material';
import { getLocale } from 'next-intl/server';
import NavigationV3 from '@/app/components/layout/NavigationV3';
import QueryProvider from '@/app/providers/QueryProvider';

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

  return (
    <QueryProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh', direction: isRTL ? 'rtl' : 'ltr' }}>
        {/* Navigation V3 - 2025 UX Best Practices with Mobile Drawer */}
        <NavigationV3
          role={session.user.role as 'SUPERADMIN' | 'MANAGER' | 'SUPERVISOR'}
          stats={{
            pendingInvites: 0,  // TODO: Fetch from API
            activeWorkers: 0,   // TODO: Fetch from API
            activeSites: 0,     // TODO: Fetch from API
          }}
        />

        {/* Main Content - Mobile: no margin (hamburger), Desktop: sidebar margin */}
        <Box
          sx={{
            flex: 1,
            mr: { xs: 0, md: isRTL ? '280px' : 0 },
            ml: { xs: 0, md: isRTL ? 0 : '280px' },
            width: { xs: '100%', md: 'calc(100% - 280px)' },
            minHeight: '100vh',
          }}
        >
          {children}
        </Box>
      </Box>
    </QueryProvider>
  );
}
