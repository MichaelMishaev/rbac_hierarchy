'use client';

import { Box, Card, CardContent, Skeleton } from '@mui/material';
import { colors, borderRadius } from '@/lib/design-system';

/**
 * Skeleton Loaders for Loading States
 *
 * Modern alternative to spinners - reduces perceived wait time by 40%
 *
 * Usage:
 * ```tsx
 * {loading ? <ActivistCardSkeleton /> : <ActivistCard data={data} />}
 * ```
 */

// Activist Card Skeleton
export function ActivistCardSkeleton() {
  return (
    <Card sx={{ borderRadius: borderRadius['2xl'], p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Skeleton variant="circular" width={56} height={56} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={20} sx={{ mt: 0.5 }} />
        </Box>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: borderRadius.lg }} />
      </Box>
    </Card>
  );
}

// Task Card Skeleton
export function TaskCardSkeleton() {
  return (
    <Card sx={{ borderRadius: borderRadius['2xl'], p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Skeleton variant="text" width="70%" height={28} />
        <Skeleton variant="rounded" width={80} height={28} />
      </Box>
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="text" width="85%" sx={{ mt: 0.5 }} />
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Skeleton variant="rounded" width={60} height={24} />
        <Skeleton variant="rounded" width={80} height={24} />
      </Box>
    </Card>
  );
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, p: 2, borderBottom: `1px solid ${colors.neutral[100]}` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} variant="text" width={`${100 / columns}%`} height={40} />
      ))}
    </Box>
  );
}

// KPI Card Skeleton
export function KPICardSkeleton() {
  return (
    <Card sx={{ borderRadius: borderRadius['2xl'], p: 3 }}>
      <Skeleton variant="text" width="50%" height={20} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="80%" height={48} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="60%" height={16} />
    </Card>
  );
}

// List Skeleton (for lists of activists, tasks, etc.)
export function ListSkeleton({ items = 5, variant = 'activist' }: { items?: number; variant?: 'activist' | 'task' }) {
  const Component = variant === 'activist' ? ActivistCardSkeleton : TaskCardSkeleton;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {Array.from({ length: items }).map((_, i) => (
        <Component key={i} />
      ))}
    </Box>
  );
}

// Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width={300} height={40} sx={{ mb: 3 }} />

      {/* KPI Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 4 }}>
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        <Card sx={{ p: 3, borderRadius: borderRadius['2xl'] }}>
          <Skeleton variant="text" width={200} height={24} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: borderRadius.lg }} />
        </Card>
        <Card sx={{ p: 3, borderRadius: borderRadius['2xl'] }}>
          <Skeleton variant="text" width={200} height={24} sx={{ mb: 2 }} />
          <ListSkeleton items={3} variant="task" />
        </Card>
      </Box>
    </Box>
  );
}
