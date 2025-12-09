import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { getTranslations, getLocale } from 'next-intl/server';
import { colors } from '@/lib/design-system';
import { listSites } from '@/app/actions/neighborhoods';
import { listCorporations } from '@/app/actions/cities';
import SitesClient from '@/app/components/sites/SitesClient';
import { Suspense } from 'react';

// Enable route caching - revalidate every 30 seconds
export const revalidate = 30;

export default async function SitesPage() {
  const session = await auth();
  const t = await getTranslations('sites');
  const tCommon = await getTranslations('common');
  const locale = await getLocale();
  const isRTL = locale === 'he';

  if (!session) {
    redirect('/login');
  }

  // Only SuperAdmin and Manager can access this page
  if (session.user.role === 'SUPERVISOR') {
    return (
      <Box sx={{ p: 4, direction: isRTL ? 'rtl' : 'ltr' }}>
        <Typography variant="h5" color="error">
          {isRTL ? 'גישה נדחתה. רק מנהלים יכולים לצפות באתרים.' : 'Access denied. Only managers can view sites.'}
        </Typography>
      </Box>
    );
  }

  // Fetch sites and corporations
  const [sitesResult, corporationsResult] = await Promise.all([
    listSites({}),
    listCorporations({}),
  ]);

  if (!sitesResult.success) {
    return (
      <Box sx={{ p: 4, direction: isRTL ? 'rtl' : 'ltr' }}>
        <Typography variant="h5" color="error">
          {tCommon('error')}: {sitesResult.error}
        </Typography>
      </Box>
    );
  }

  const sites = sitesResult.sites || [];
  const corporations = corporationsResult.corporations || [];

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
      <SitesClient 
        sites={sites} 
        corporations={corporations.map(c => ({ id: c.id, name: c.name, code: c.code }))} 
      />
    </Box>
  );
}
