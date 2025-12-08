import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import LeafletClient from './LeafletClient';
import { colors } from '@/lib/design-system';

export default function LeafletPage() {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        background: colors.neutral[50],
        overflow: 'hidden',
        direction: 'rtl',
        margin: 0,
        padding: 0,
        position: 'relative',
      }}
    >
      <Suspense
        fallback={
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
          >
            <CircularProgress />
          </Box>
        }
      >
        <LeafletClient />
      </Suspense>
    </Box>
  );
}
