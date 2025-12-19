import { redirect } from 'next/navigation';
import { auth, getCurrentUser } from '@/lib/auth';
import { Box, Container } from '@mui/material';
import { ActivistBottomNav } from '@/app/components/activists/ActivistBottomNav';

export default async function ActivistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // CRITICAL: Only ACTIVIST role can access this layout
  if (!session || session.user.role !== 'ACTIVIST') {
    redirect('/login');
  }

  // Get full user data including activist profile
  const user = await getCurrentUser();

  // Verify activist has a profile linked
  if (!user.activistProfile) {
    console.error('[ActivistLayout] CRITICAL: ACTIVIST user without activistProfile!');
    console.error('[ActivistLayout] User ID:', user.id, 'Email:', user.email);
    redirect('/login');
  }

  console.log('[ActivistLayout] ✅ SUCCESS - Activist profile found for:', user.email);

  return (
    <Box
      dir="rtl"
      lang="he"
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 8, // Bottom nav height
      }}
    >
      {/* Mobile-first container */}
      <Container
        maxWidth="sm"
        sx={{
          pt: 2,
          px: 2,
        }}
      >
        {children}
      </Container>

      {/* Bottom Navigation (fixed) with logout */}
      <ActivistBottomNav />
    </Box>
  );
}
