import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { getTranslations, getLocale } from 'next-intl/server';
import { colors } from '@/lib/design-system';

export default async function WorkersPage() {
  const session = await auth();
  const t = await getTranslations('workers');
  const tCommon = await getTranslations('common');
  const locale = await getLocale();
  const isRTL = locale === 'he';

  if (!session) {
    redirect('/login');
  }

  // TODO: Implement workers listing and management
  // - Fetch workers based on user role and site access
  // - Display workers table with filters
  // - Add create/edit/delete functionality
  // - Support worker activation/deactivation

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
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: colors.neutral[900],
            mb: 0.5,
          }}
        >
          {isRTL ? 'עובדים' : 'Workers'}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: colors.neutral[600],
            fontWeight: 500,
          }}
        >
          {isRTL ? 'ניהול עובדים באתרים' : 'Manage workers across sites'}
        </Typography>
      </Box>

      {/* Placeholder Content */}
      <Box
        sx={{
          p: 4,
          background: colors.neutral[0],
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" sx={{ color: colors.neutral[600] }}>
          {isRTL ? 'דף זה בבנייה' : 'This page is under construction'}
        </Typography>
        <Typography variant="body2" sx={{ color: colors.neutral[500], mt: 1 }}>
          {isRTL
            ? 'ניהול עובדים יתווסף בקרוב'
            : 'Workers management will be added soon'}
        </Typography>
      </Box>
    </Box>
  );
}
