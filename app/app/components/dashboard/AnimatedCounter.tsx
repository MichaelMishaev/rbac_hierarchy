/**
 * Animated Counter Component
 * Smoothly animates number changes in KPI cards
 *
 * Features:
 * - Smooth transition between values
 * - Customizable duration
 * - Color-coded based on change (increase = green, decrease = red)
 * - Supports large numbers with formatting
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { Typography, Box } from '@mui/material';
import { colors } from '@/lib/design-system';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface AnimatedCounterProps {
  value: number;
  duration?: number; // Animation duration in milliseconds
  showTrend?: boolean; // Show trend indicator
  previousValue?: number; // Previous value for trend calculation
  suffix?: string; // Suffix like "%" or "K"
  color?: string; // Color of the number
}

export default function AnimatedCounter({
  value,
  duration = 1000,
  showTrend = false,
  previousValue,
  suffix = '',
  color = colors.neutral[700],
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);

  useEffect(() => {
    if (displayValue === value) return;

    const startValue = displayValue;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentValue = Math.round(startValue + (endValue - startValue) * easeOut);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, displayValue]);

  useEffect(() => {
    previousValueRef.current = displayValue;
  }, [displayValue]);

  const trend = previousValue !== undefined ? value - previousValue : 0;
  const trendPercentage = previousValue !== undefined && previousValue !== 0
    ? Math.round((trend / previousValue) * 100)
    : 0;

  const getTrendColor = () => {
    if (trend > 0) return colors.status.green;
    if (trend < 0) return colors.error;
    return colors.neutral[400];
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography
        variant="h3"
        sx={{
          fontWeight: 700,
          color,
          fontSize: { xs: '2rem', md: '2.5rem' },
          fontFamily: typography.fontFamily.rounded,
        }}
      >
        {displayValue.toLocaleString('he-IL')}
        {suffix}
      </Typography>

      {showTrend && trend !== 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
            py: 0.5,
            borderRadius: '8px',
            bgcolor: getTrendColor() + '20',
          }}
        >
          {trend > 0 ? (
            <TrendingUpIcon sx={{ fontSize: 16, color: getTrendColor() }} />
          ) : (
            <TrendingDownIcon sx={{ fontSize: 16, color: getTrendColor() }} />
          )}
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: getTrendColor(),
            }}
          >
            {Math.abs(trendPercentage)}%
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// Import typography for font family
import { typography } from '@/lib/design-system';
