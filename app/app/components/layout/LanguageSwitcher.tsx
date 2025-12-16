'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Box, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { colors, borderRadius } from '@/lib/design-system';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (event: React.MouseEvent<HTMLElement>, newLocale: string | null) => {
    if (!newLocale) return;

    // Remove current locale from pathname
    const pathnameWithoutLocale = pathname.replace(/^\/(he|en)/, '') || '/';

    // Navigate to new locale
    const newPath = newLocale === 'he' ? pathnameWithoutLocale : `/${newLocale}${pathnameWithoutLocale}`;
    router.push(newPath);
    router.refresh();
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <ToggleButtonGroup
        value={locale}
        exclusive
        onChange={handleChange}
        aria-label="language"
        size="small"
        sx={{
          backgroundColor: colors.neutral[100],
          borderRadius: borderRadius.full,
          '& .MuiToggleButton-root': {
            px: 2,
            py: 0.5,
            border: 'none',
            borderRadius: borderRadius.full,
            fontSize: '12px',
            fontWeight: 600,
            color: colors.neutral[600],
            '&.Mui-selected': {
              backgroundColor: colors.neutral[0],
              color: colors.pastel.blue,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              '&:hover': {
                backgroundColor: colors.neutral[0],
              },
            },
            '&:hover': {
              backgroundColor: colors.neutral[200],
            },
          },
        }}
      >
        <ToggleButton value="he" aria-label="hebrew">
          עב
        </ToggleButton>
        <ToggleButton value="en" aria-label="english">
          EN
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
