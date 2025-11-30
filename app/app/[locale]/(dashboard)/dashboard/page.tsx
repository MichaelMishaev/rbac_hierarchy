import { Suspense } from 'react';
import DashboardSkeleton from '@/app/components/dashboard/DashboardSkeleton';
import DashboardContent from './DashboardContent';
import { Box } from '@mui/material';
import { colors } from '@/lib/design-system';

export default function DashboardPage() {
  return (
    <Box
      sx={{
        background: colors.neutral[50],
        minHeight: '100vh',
      }}
    >
      <Suspense fallback={<DashboardSkeleton cardCount={5} showTree={true} />}>
        <DashboardContent />
      </Suspense>
    </Box>
  );
}
