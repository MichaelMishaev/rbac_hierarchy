import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Box, Typography, Alert } from '@mui/material';
import { getTranslations, getLocale } from 'next-intl/server';
import { colors } from '@/lib/design-system';
import TaskCreationFormV2 from '@/app/components/tasks/TaskCreationFormV2';

// Enable route caching - revalidate every 30 seconds
export const revalidate = 30;

export default async function NewTaskPage() {
  const session = await auth();
  const t = await getTranslations('tasks');
  const locale = await getLocale();
  const isRTL = locale === 'he';

  if (!session) {
    redirect('/login');
  }

  // Only SuperAdmin, Area Manager, and Corporation Manager can send tasks
  // Supervisors are RECEIVE-ONLY (per system specification)
  const canSendTasks = ['SUPERADMIN', 'AREA_MANAGER', 'MANAGER'].includes(session.user.role);

  if (!canSendTasks) {
    return (
      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          background: colors.neutral[50],
          minHeight: '100vh',
          direction: isRTL ? 'rtl' : 'ltr',
        }}
      >
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('supervisorsCannotSend')}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {isRTL
              ? 'רק מנהלים יכולים לשלוח משימות. רכזי שכונות יכולים רק לקבל משימות בתיבת המשימות.'
              : 'Only managers can send tasks. Supervisors can only receive tasks in their inbox.'}
          </Typography>
        </Alert>
      </Box>
    );
  }

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
          {t('newTask')}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: colors.neutral[600],
            fontWeight: 500,
          }}
        >
          {isRTL
            ? 'שלח משימה חדשה לנמענים שתחתיך בהיררכיה'
            : 'Send a new task to recipients under you in the hierarchy'}
        </Typography>
      </Box>

      {/* Task Creation Form V2 - 2025 UX Best Practices */}
      <TaskCreationFormV2
        senderId={session.user.id}
        senderRole={session.user.role}
        senderName={session.user.name || session.user.email}
      />
    </Box>
  );
}
