'use client';

import { useState, memo } from 'react';
import { Box, TextField, InputAdornment, Typography, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { colors, borderRadius, shadows } from '@/lib/design-system';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// 🚀 PERFORMANCE: Lazy load Autocomplete (heavy component)
const Autocomplete = dynamic(
  () => import('@mui/material/Autocomplete'),
  { ssr: false, loading: () => <TextField placeholder="טוען חיפוש..." disabled fullWidth /> }
);

interface WikiSearchClientProps {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    pageCount: number;
  }>;
  locale: string;
}

function WikiSearchClientComponent({ categories, locale }: WikiSearchClientProps) {
  const [searchValue, setSearchValue] = useState('');
  const router = useRouter();

  // Generate search options from categories
  type SearchOption = {
    label: string;
    value: string;
    type: 'category';
    subtitle: string;
  };

  const searchOptions: SearchOption[] = categories.map((cat) => ({
    label: cat.name,
    value: cat.slug,
    type: 'category' as const,
    subtitle: `${cat.pageCount} דפים`,
  }));

  return (
    <Box
      sx={{
        mb: 4,
        maxWidth: '800px',
        mx: 'auto',
      }}
    >
      <Autocomplete
        freeSolo
        options={searchOptions}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          if (option && typeof option === 'object' && 'label' in option) {
            return (option as SearchOption).label;
          }
          return '';
        }}
        renderOption={(props, option) => {
          if (typeof option === 'string') return null;
          if (!option || typeof option !== 'object' || !('label' in option)) return null;
          const typedOption = option as SearchOption;
          const { key, ...otherProps } = props;
          return (
            <Box
              key={key}
              component="li"
              {...otherProps}
              sx={{
                p: 2,
                '&:hover': {
                  backgroundColor: colors.pastel.blueLight,
                },
              }}
            >
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600, color: colors.neutral[900] }}>
                  {typedOption.label}
                </Typography>
                <Typography variant="caption" sx={{ color: colors.neutral[500] }}>
                  {typedOption.subtitle}
                </Typography>
              </Box>
            </Box>
          );
        }}
        onChange={(event, value) => {
          if (value && typeof value === 'object' && 'value' in value) {
            const typedValue = value as SearchOption;
            router.push(`/${locale}/wiki/${typedValue.value}`);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="חפש בויקי... (קטגוריות, מאמרים, נושאים)"
            fullWidth
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: colors.neutral[400], fontSize: 28 }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: borderRadius.xl,
                backgroundColor: '#fff',
                fontSize: '16px',
                boxShadow: shadows.large,
                border: `2px solid ${colors.primary}`,
                '&:hover': {
                  borderColor: colors.status.blue,
                },
                '&.Mui-focused': {
                  borderColor: colors.status.blue,
                  boxShadow: `0 0 0 4px ${colors.pastel.blueLight}`,
                },
                '& fieldset': {
                  border: 'none',
                },
                py: 1.5,
                px: 2,
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                paddingRight: '8px',
              },
            }}
          />
        )}
        sx={{
          '& .MuiAutocomplete-popper': {
            boxShadow: shadows.large,
            borderRadius: borderRadius.lg,
          },
        }}
      />

      {/* Search Tips */}
      <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Chip
          label="💡 טיפ: השתמש במקש Enter לחיפוש מהיר"
          size="small"
          sx={{
            backgroundColor: colors.pastel.blueLight,
            color: colors.neutral[700],
            fontWeight: 500,
            fontSize: '13px',
          }}
        />
        <Chip
          label="⚡ גישה מהירה ללא קליקים"
          size="small"
          sx={{
            backgroundColor: colors.pastel.greenLight,
            color: colors.neutral[700],
            fontWeight: 500,
            fontSize: '13px',
          }}
        />
      </Box>
    </Box>
  );
}

// 🚀 PERFORMANCE: Memoize to prevent unnecessary re-renders
export const WikiSearchClient = memo(WikiSearchClientComponent);
