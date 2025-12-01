'use client';

import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

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
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red';
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
      shadow: shadows.medium, // Use medium shadow instead
    },
    red: {
      bg: colors.pastel.redLight,
      main: colors.error,
      shadow: shadows.medium, // Use medium shadow instead
    },
  };

  const currentColor = colorMap[color];

  return (
    <Card
      onClick={onClick}
      data-testid={dataTestId}
      sx={{
        background: currentColor.bg,
        border: `2px solid ${currentColor.main}40`,
        borderRadius: borderRadius['2xl'],
        boxShadow: shadows.soft,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': onClick
          ? {
              transform: 'translateY(-4px)',
              boxShadow: currentColor.shadow,
              borderColor: currentColor.main,
            }
          : {},
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
        {/* Header with Icon */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: colors.neutral[600],
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '13px',
            }}
          >
            {title}
          </Typography>
          {icon && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: colors.neutral[0],
                boxShadow: shadows.inner,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentColor.main,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        {/* Main Value */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              color: colors.neutral[900],
              letterSpacing: '-0.02em',
              mb: 1,
            }}
          >
            {value}
          </Typography>

          {/* Subtitle */}
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                color: colors.neutral[600],
                fontWeight: 500,
                mb: 1,
              }}
            >
              {subtitle}
            </Typography>
          )}

          {/* Trend Indicator */}
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
              <Chip
                icon={
                  trend.isPositive ? (
                    <TrendingUpIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <TrendingDownIcon sx={{ fontSize: 16 }} />
                  )
                }
                label={`${trend.isPositive ? '+' : ''}${trend.value}%`}
                size="small"
                sx={{
                  backgroundColor: trend.isPositive
                    ? colors.pastel.greenLight
                    : colors.pastel.redLight,
                  color: trend.isPositive ? colors.success : colors.error,
                  fontWeight: 600,
                  fontSize: '12px',
                  borderRadius: borderRadius.full,
                  '& .MuiChip-icon': {
                    color: trend.isPositive ? colors.success : colors.error,
                  },
                }}
              />
              {trend.label && (
                <Typography
                  variant="caption"
                  sx={{
                    color: colors.neutral[500],
                    fontWeight: 500,
                  }}
                >
                  {trend.label}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
