import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { getTranslations, getLocale } from 'next-intl/server';
import { colors } from '@/lib/design-system';
import TaskInbox from '@/app/components/tasks/TaskInbox';

// Enable route caching - revalidate every 30 seconds
export const revalidate = 30;

export default async function TaskInboxPage() {
  const session = await auth();
  const t = await getTranslations('tasks');
  const locale = await getLocale();
  const isRTL = locale === 'he';

  if (!session) {
    redirect('/login');
  }

  // All roles can receive tasks (except Workers who don't have login)
  // Workers are excluded from the task system entirely

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        background: colors.neutral[50],
        minHeight: '100vh',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          mb: 4,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: colors.neutral[900],
            mb: 0.5,
          }}
        >
          {t('inbox')}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: colors.neutral[600],
            fontWeight: 500,
          }}
        >
          {t('description')}
        </Typography>
      </Box>

      {/* Task Inbox Component */}
      <TaskInbox />
    </Box>
  );
}
