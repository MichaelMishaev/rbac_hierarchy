import { Box, Skeleton, Stack } from '@mui/material';

export default function TaskInboxLoading() {
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header skeleton */}
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={300} height={24} />
      </Box>

      {/* Tabs skeleton */}
      <Skeleton variant="rectangular" width={200} height={40} sx={{ mb: 3 }} />

      {/* Task cards skeleton */}
      <Stack spacing={2}>
        {[1, 2, 3].map((i) => (
          <Box key={i} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
            <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={80} sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Skeleton variant="rectangular" width={100} height={36} />
              <Skeleton variant="rectangular" width={100} height={36} />
              <Skeleton variant="rectangular" width={100} height={36} />
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
