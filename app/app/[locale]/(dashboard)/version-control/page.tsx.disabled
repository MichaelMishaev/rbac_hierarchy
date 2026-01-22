import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { getVersionData, getGitCommitInfo } from '@/app/actions/version';
import VersionControlClient from './VersionControlClient';
import { colors } from '@/lib/design-system';

export const metadata = {
  title: 'בקרת גרסאות - מערכת ניהול',
  description: 'מעקב אחר גרסאות המערכת, שינויים ופריסות',
};

/**
 * Version Control Dashboard Page
 * Displays version information, changelog, and deployment history
 *
 * Features:
 * - Real-time version display
 * - Visual changelog timeline
 * - Deployment history
 * - Git commit information
 * - Hebrew RTL design
 * - Mobile-responsive
 */
export default async function VersionControlPage() {
  // Fetch version data and git info in parallel
  const [versionData, gitInfo] = await Promise.all([
    getVersionData(),
    getGitCommitInfo(),
  ]);

  return (
    <Box
      dir="rtl"
      lang="he"
      sx={{
        minHeight: '100vh',
        backgroundColor: colors.neutral[50],
        p: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Suspense
        fallback={
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '60vh',
            }}
          >
            <CircularProgress />
          </Box>
        }
      >
        <VersionControlClient versionData={versionData} gitInfo={gitInfo} />
      </Suspense>
    </Box>
  );
}
