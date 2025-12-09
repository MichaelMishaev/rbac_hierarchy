import { Suspense } from 'react';
import { Box, Container, CircularProgress } from '@mui/material';
import AttendanceClient from './AttendanceClient';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'נוכחות | מערכת ניהול',
  description: 'מעקב נוכחות עובדים',
};

export default async function AttendancePage() {
  // Verify authentication
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <Container
      maxWidth={false}
      sx={{
        py: 4,
        px: { xs: 2, sm: 3, md: 4 },
        direction: 'rtl',
      }}
    >
      <Suspense
        fallback={
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
            }}
          >
            <CircularProgress />
          </Box>
        }
      >
        <AttendanceClient user={user} />
      </Suspense>
    </Container>
  );
}
