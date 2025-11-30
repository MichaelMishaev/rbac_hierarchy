'use client';

import { Grid, Skeleton, Box } from '@mui/material';
import { colors, borderRadius, shadows } from '@/lib/design-system';

type DashboardSkeletonProps = {
  cardCount?: number;
  showTree?: boolean;
};

export default function DashboardSkeleton({ cardCount = 5, showTree = true }: DashboardSkeletonProps) {
  return (
    <Box>
      {/* KPI Cards Skeleton */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[...Array(cardCount)].map((_, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Box
              sx={{
                p: 3,
                background: colors.neutral[0],
                borderRadius: borderRadius['2xl'],
                boxShadow: shadows.soft,
                border: `2px solid ${colors.neutral[100]}`,
              }}
            >
              {/* Header with Icon */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="circular" width={48} height={48} />
              </Box>

              {/* Main Value */}
              <Skeleton variant="text" width="40%" height={60} sx={{ mb: 1 }} />

              {/* Subtitle */}
              <Skeleton variant="text" width="70%" height={16} />
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Organizational Tree Skeleton */}
      {showTree && (
        <Box
          sx={{
            mb: 4,
            p: 3,
            background: colors.neutral[0],
            borderRadius: borderRadius.xl,
            boxShadow: shadows.medium,
            border: `1px solid ${colors.neutral[200]}`,
          }}
        >
          <Skeleton variant="text" width="30%" height={32} sx={{ mb: 3 }} />
          <Skeleton variant="rectangular" height={400} animation="wave" />
        </Box>
      )}

      {/* Recent Activity Skeleton */}
      <Box
        sx={{
          mt: 4,
          p: 3,
          background: colors.neutral[0],
          borderRadius: borderRadius.xl,
          boxShadow: shadows.soft,
          border: `1px solid ${colors.neutral[200]}`,
        }}
      >
        <Skeleton variant="text" width="25%" height={32} sx={{ mb: 2 }} />
        {[...Array(3)].map((_, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="80%" height={20} />
              <Skeleton variant="text" width="50%" height={16} />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
