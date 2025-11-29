import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import { Box } from '@mui/material';
import { getLocale } from 'next-intl/server';
import NavigationClient from '@/app/components/layout/NavigationClient';

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
    <Box sx={{ display: 'flex', minHeight: '100vh', direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Navigation Sidebar */}
      <NavigationClient role={session.user.role as 'SUPERADMIN' | 'MANAGER' | 'SUPERVISOR'} />

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          mr: { xs: 0, md: isRTL ? '260px' : 0 },
          ml: { xs: 0, md: isRTL ? 0 : '260px' },
          width: { xs: '100%', md: 'calc(100% - 260px)' },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
