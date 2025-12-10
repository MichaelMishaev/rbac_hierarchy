'use client';

/**
 * StatusBadge Component (2025 UX Standard)
 *
 * Animated status badges with micro-interactions
 * - Pulse animation for active states
 * - Smooth color transitions
 * - Icon support
 * - RTL-friendly
 */

import { Box, Chip, ChipProps } from '@mui/material';
import { animated, useSpring } from '@react-spring/web';
import { colors, borderRadius } from '@/lib/design-system';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';

type StatusType = 'success' | 'error' | 'warning' | 'info' | 'pending' | 'active';

interface StatusBadgeProps extends Omit<ChipProps, 'color' | 'variant'> {
  status: StatusType;
  /** Show pulse animation for active/pending states */
  pulse?: boolean;
  /** Custom label (auto-translates if not provided) */
  label?: string;
}

const AnimatedChip = animated(Chip);

export default function StatusBadge({
  status,
  pulse = true,
  label,
  ...props
}: StatusBadgeProps) {
  // Default Hebrew labels
  const defaultLabels: Record<StatusType, string> = {
    success: 'הצליח',
    error: 'שגיאה',
    warning: 'אזהרה',
    info: 'מידע',
    pending: 'ממתין',
    active: 'פעיל',
  };

  // Color mapping
  const colorMap: Record<
    StatusType,
    { bg: string; text: string; icon: React.ComponentType<any> }
  > = {
    success: {
      bg: colors.pastel.greenLight,
      text: colors.success,
      icon: CheckIcon,
    },
    error: {
      bg: colors.pastel.redLight,
      text: colors.error,
      icon: ErrorIcon,
    },
    warning: {
      bg: colors.pastel.orangeLight,
      text: colors.pastel.orange,
      icon: WarningIcon,
    },
    info: {
      bg: colors.pastel.blueLight,
      text: colors.primary.main,
      icon: InfoIcon,
    },
    pending: {
      bg: colors.neutral[100],
      text: colors.neutral[600],
      icon: CircleIcon,
    },
    active: {
      bg: colors.pastel.greenLight,
      text: colors.success,
      icon: CircleIcon,
    },
  };

  const config = colorMap[status];
  const Icon = config.icon;

  // Pulse animation for active/pending states
  const pulseAnimation = useSpring({
    from: { scale: 1, opacity: 1 },
    to: async (next) => {
      if (pulse && (status === 'active' || status === 'pending')) {
        while (true) {
          await next({ scale: 1.05, opacity: 0.8 });
          await next({ scale: 1, opacity: 1 });
        }
      }
    },
    config: { duration: 1500 },
  });

  return (
    <AnimatedChip
      icon={<Icon sx={{ fontSize: 16 }} />}
      label={label || defaultLabels[status]}
      size="small"
      style={pulse && (status === 'active' || status === 'pending') ? pulseAnimation : undefined}
      sx={{
        backgroundColor: config.bg,
        color: config.text,
        fontWeight: 600,
        fontSize: '12px',
        height: '24px',
        borderRadius: borderRadius.full,
        '& .MuiChip-icon': {
          color: config.text,
        },
        '& .MuiChip-label': {
          px: 1,
        },
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'scale(1.05)',
        },
      }}
      {...props}
    />
  );
}

/**
 * Dot indicator with pulse animation
 */
export function StatusDot({ status, size = 8 }: { status: StatusType; size?: number }) {
  const colorMap: Record<StatusType, string> = {
    success: colors.success,
    error: colors.error,
    warning: colors.pastel.orange,
    info: colors.primary.main,
    pending: colors.neutral[400],
    active: colors.success,
  };

  const pulseAnimation = useSpring({
    from: { scale: 1, opacity: 1 },
    to: async (next) => {
      if (status === 'active' || status === 'pending') {
        while (true) {
          await next({ scale: 1.5, opacity: 0.5 });
          await next({ scale: 1, opacity: 1 });
        }
      }
    },
    config: { duration: 1500 },
  });

  const AnimatedBox = animated(Box);

  return (
    <AnimatedBox
      style={status === 'active' || status === 'pending' ? pulseAnimation : undefined}
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: colorMap[status],
      }}
    />
  );
}

/**
 * Count badge with animation
 */
export function CountBadge({ count, max = 99 }: { count: number; max?: number }) {
  const displayCount = count > max ? `${max}+` : count;

  const scaleAnimation = useSpring({
    from: { scale: 0 },
    to: { scale: 1 },
    config: { tension: 300, friction: 10 },
  });

  const AnimatedBox = animated(Box);

  if (count === 0) return null;

  return (
    <AnimatedBox
      style={scaleAnimation}
      sx={{
        minWidth: 20,
        height: 20,
        borderRadius: borderRadius.full,
        backgroundColor: colors.error,
        color: colors.neutral[0],
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        fontWeight: 700,
        px: 0.5,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      }}
    >
      {displayCount}
    </AnimatedBox>
  );
}

/**
 * Progress badge (percentage)
 */
export function ProgressBadge({ progress }: { progress: number }) {
  const percentage = Math.min(Math.max(progress, 0), 100);
  const color =
    percentage >= 80
      ? colors.success
      : percentage >= 50
      ? colors.pastel.orange
      : colors.error;

  return (
    <Chip
      label={`${Math.round(percentage)}%`}
      size="small"
      sx={{
        backgroundColor: `${color}20`,
        color,
        fontWeight: 700,
        fontSize: '12px',
        height: '24px',
        borderRadius: borderRadius.full,
        border: `2px solid ${color}`,
      }}
    />
  );
}
