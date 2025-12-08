import { Box, Skeleton, Typography } from '@mui/material';
import { colors } from '@/lib/design-system';

export default function SitesLoading() {
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
        <Skeleton variant="text" width={180} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={280} height={24} />
      </Box>

      {/* Search and Actions Skeleton */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Skeleton variant="rectangular" width={300} height={56} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" width={150} height={56} sx={{ borderRadius: 2 }} />
      </Box>

      {/* Table Skeleton */}
      <Box
        sx={{
          background: colors.neutral[0],
          borderRadius: 2,
          p: 3,
        }}
      >
        {/* Table Header */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="text" width="20%" height={32} />
          ))}
        </Box>

        {/* Table Rows */}
        {[1, 2, 3, 4, 5, 6, 7].map((row) => (
          <Box key={row} sx={{ display: 'flex', gap: 2, mb: 2 }}>
            {[1, 2, 3, 4, 5].map((col) => (
              <Skeleton key={col} variant="text" width="20%" height={48} />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
