'use client';

import { Box, Skeleton, Grid } from '@mui/material';
import { colors, borderRadius } from '@/lib/design-system';

export default function QuickPreviewSkeleton() {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" gap={2} mb={3}>
        <Skeleton variant="circular" width={56} height={56} />
        <Box flex={1}>
          <Skeleton width="60%" height={24} />
          <Skeleton width="40%" height={16} sx={{ mt: 1 }} />
        </Box>
      </Box>

      {/* KPI Cards Grid */}
      <Grid container spacing={2} mb={3}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={6} key={i}>
            <Skeleton
              variant="rectangular"
              height={80}
              sx={{ borderRadius: borderRadius.md }}
            />
          </Grid>
        ))}
      </Grid>

      {/* Info Section */}
      <Box mb={3}>
        <Skeleton width="40%" height={20} sx={{ mb: 2 }} />
        <Skeleton height={40} sx={{ mb: 1, borderRadius: borderRadius.md }} />
        <Skeleton height={40} sx={{ mb: 1, borderRadius: borderRadius.md }} />
        <Skeleton height={40} sx={{ borderRadius: borderRadius.md }} />
      </Box>

      {/* Action Button */}
      <Skeleton height={48} sx={{ borderRadius: borderRadius.lg }} />
    </Box>
  );
}
