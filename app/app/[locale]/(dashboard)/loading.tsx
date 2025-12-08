import { Box, Skeleton } from '@mui/material';
import { colors } from '@/lib/design-system';

export default function DashboardLoading() {
  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        background: colors.neutral[50],
        minHeight: '100vh',
      }}
    >
      {/* Header Skeleton */}
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width={250} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={200} height={24} />
      </Box>

      {/* KPI Cards Skeleton */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 4,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={120}
            sx={{ borderRadius: 2 }}
          />
        ))}
      </Box>

      {/* Charts Skeleton */}
      <Box sx={{ mb: 4 }}>
        <Skeleton
          variant="rectangular"
          height={300}
          sx={{ borderRadius: 2 }}
        />
      </Box>
    </Box>
  );
}
