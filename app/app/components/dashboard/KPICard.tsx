'use client';

import { CardContent, Typography, Box, Chip } from '@mui/material';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AnimatedCounter from './AnimatedCounter';
import AnimatedCard from '@/app/components/ui/AnimatedCard';

export type KPICardProps = {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  icon?: React.ReactNode;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'indigo';
  onClick?: () => void;
  'data-testid'?: string;
};

export default function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color,
  onClick,
  'data-testid': dataTestId,
}: KPICardProps) {
  // Color mapping
  const colorMap = {
    blue: {
      bg: colors.pastel.blueLight,
      main: colors.pastel.blue,
      shadow: shadows.glowBlue,
    },
    indigo: {
      bg: '#E0E7FF', // Indigo light
      main: '#6366F1', // Indigo
      shadow: shadows.medium,
    },
    purple: {
      bg: colors.pastel.purpleLight,
      main: colors.pastel.purple,
      shadow: shadows.glowPurple,
    },
    green: {
      bg: colors.pastel.greenLight,
      main: colors.pastel.green,
      shadow: shadows.glowGreen,
    },
    orange: {
      bg: colors.pastel.orangeLight,
      main: colors.pastel.orange,
      shadow: shadows.medium,
    },
    red: {
      bg: colors.pastel.redLight,
      main: colors.error,
      shadow: shadows.medium,
    },
  };

  const currentColor = colorMap[color];

  return (
    <AnimatedCard
      onClick={onClick}
      data-testid={dataTestId}
      clickable={!!onClick}
      intensity={6} // Reduced from 10 for more subtle lift
      sx={{
        background: currentColor.bg,
        border: `2px solid ${currentColor.main}40`,
        borderRadius: borderRadius['2xl'],
        boxShadow: shadows.soft,
        height: '100%',
        minHeight: '160px', // Compact minimum height (was ~300px)
        display: 'flex',
        flexDirection: 'column',
        // Subtle hover effect
        '&:hover': onClick
          ? {
              borderColor: currentColor.main,
              boxShadow: shadows.medium,
            }
          : {},
      }}
    >
      <CardContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 2, // Reduced from 3 (16px instead of 24px)
          '&:last-child': {
            pb: 2, // Override MUI default padding-bottom
          }
        }}
      >
        {/* Header with Icon */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 1.5, // Reduced from 2
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: colors.neutral[600],
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '11px', // Reduced from 13px
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
          {icon && (
            <Box
              sx={{
                width: 36, // Reduced from 48px
                height: 36, // Reduced from 48px
                borderRadius: '50%',
                background: colors.neutral[0],
                boxShadow: shadows.inner,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentColor.main,
                flexShrink: 0,
                '& > svg': {
                  fontSize: '20px', // Icon size
                },
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        {/* Main Value */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
          {typeof value === 'number' ? (
            <AnimatedCounter
              value={value}
              showTrend={false}
              color={colors.neutral[900]}
              sx={{
                fontSize: { xs: '2rem', sm: '2.25rem' }, // Slightly reduced (was h2: 2.5rem)
                fontWeight: 700,
                lineHeight: 1,
                mb: 0.5,
              }}
            />
          ) : (
            <Typography
              variant="h3"
              component="div"
              sx={{
                fontSize: { xs: '2rem', sm: '2.25rem' }, // Reduced from h2
                fontWeight: 700,
                color: colors.neutral[900],
                letterSpacing: '-0.02em',
                lineHeight: 1,
                mb: 0.5,
              }}
            >
              {value}
            </Typography>
          )}

          {/* Subtitle */}
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                color: colors.neutral[600],
                fontWeight: 500,
                fontSize: '13px', // Slightly reduced
                lineHeight: 1.3,
                mb: trend ? 1 : 0,
              }}
            >
              {subtitle}
            </Typography>
          )}

          {/* Trend Indicator */}
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 'auto' }}>
              <Chip
                icon={
                  trend.isPositive ? (
                    <TrendingUpIcon sx={{ fontSize: 14 }} />
                  ) : (
                    <TrendingDownIcon sx={{ fontSize: 14 }} />
                  )
                }
                label={`${trend.isPositive ? '+' : ''}${trend.value}%`}
                size="small"
                sx={{
                  height: '22px', // Compact chip
                  backgroundColor: trend.isPositive
                    ? colors.pastel.greenLight
                    : colors.pastel.redLight,
                  color: trend.isPositive ? colors.success : colors.error,
                  fontWeight: 600,
                  fontSize: '11px',
                  borderRadius: borderRadius.full,
                  '& .MuiChip-icon': {
                    color: trend.isPositive ? colors.success : colors.error,
                    marginInlineEnd: '-4px',
                  },
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
              {trend.label && (
                <Typography
                  variant="caption"
                  sx={{
                    color: colors.neutral[500],
                    fontWeight: 500,
                    fontSize: '11px',
                  }}
                >
                  {trend.label}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </AnimatedCard>
  );
}
