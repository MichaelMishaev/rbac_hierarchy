import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { getTranslations, getLocale } from 'next-intl/server';
import { colors } from '@/lib/design-system';
import { listCorporations } from '@/app/actions/corporations';
import CorporationsClient from '@/app/components/corporations/CorporationsClient';

export default async function CorporationsPage() {
  const session = await auth();
  const t = await getTranslations('corporations');
  const tCommon = await getTranslations('common');
  const locale = await getLocale();
  const isRTL = locale === 'he';

  if (!session) {
    redirect('/login');
  }

  // Only SuperAdmin can access this page
  if (session.user.role !== 'SUPERADMIN') {
    return (
      <Box sx={{ p: 4, direction: isRTL ? 'rtl' : 'ltr' }}>
        <Typography variant="h5" color="error">
          {t('accessDenied')}
        </Typography>
      </Box>
    );
  }

  // Fetch corporations
  const result = await listCorporations({});

  if (!result.success) {
    return (
      <Box sx={{ p: 4, direction: isRTL ? 'rtl' : 'ltr' }}>
        <Typography variant="h5" color="error">
          {tCommon('error')}: {result.error}
        </Typography>
      </Box>
    );
  }

  const corporations = result.corporations || [];

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
          {t('title')}
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

      {/* Client Component with Modals */}
      <CorporationsClient corporations={corporations} />
    </Box>
  );
}
