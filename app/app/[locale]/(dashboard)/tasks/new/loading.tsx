import { Box, Skeleton, Stack } from '@mui/material';

export default function NewTaskLoading() {
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header skeleton */}
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={300} height={24} />
      </Box>

      {/* Form skeleton */}
      <Box sx={{ maxWidth: 800 }}>
        <Stack spacing={3}>
          {/* Task Type */}
          <Box>
            <Skeleton variant="text" width={120} height={24} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" width="100%" height={56} />
          </Box>

          {/* Task Description */}
          <Box>
            <Skeleton variant="text" width={150} height={24} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" width="100%" height={150} />
          </Box>

          {/* Send To */}
          <Box>
            <Skeleton variant="text" width={100} height={24} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" width="100%" height={120} />
          </Box>

          {/* Execution Date */}
          <Box>
            <Skeleton variant="text" width={130} height={24} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" width="100%" height={56} />
          </Box>

          {/* Submit Button */}
          <Skeleton variant="rectangular" width={150} height={48} />
        </Stack>
      </Box>
    </Box>
  );
}
