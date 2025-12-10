'use client';

import { Box, Typography } from '@mui/material';
import { animated } from '@react-spring/web';
import { colors, borderRadius, shadows } from '@/lib/design-system';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AnimatedButton from './AnimatedButton';
import { useSpring, config } from '@react-spring/web';
import * as Illustrations from './EmptyStateIllustrations';

type IllustrationType =
  | 'activists'
  | 'tasks'
  | 'neighborhoods'
  | 'cities'
  | 'search'
  | 'data'
  | 'notifications'
  | 'connection';

type EmptyStateProps = {
  title: string;
  description: string;
  /** Choose from pre-built illustrations or pass custom icon */
  illustration?: IllustrationType;
  icon?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Custom styles */
  compact?: boolean;
};

export default function EmptyState({
  title,
  description,
  illustration,
  icon,
  primaryAction,
  secondaryAction,
  compact = false,
}: EmptyStateProps) {
  // 2025 UX: Smooth fade-in + scale animation
  const containerAnimation = useSpring({
    from: { opacity: 0, scale: 0.95, y: 20 },
    to: { opacity: 1, scale: 1, y: 0 },
    config: config.gentle,
  });

  // Select illustration component
  const IllustrationComponent = illustration
    ? {
        activists: Illustrations.NoActivists,
        tasks: Illustrations.NoTasks,
        neighborhoods: Illustrations.NoNeighborhoods,
        cities: Illustrations.NoCities,
        search: Illustrations.NoSearch,
        data: Illustrations.NoData,
        notifications: Illustrations.NoNotifications,
        connection: Illustrations.NoConnection,
      }[illustration]
    : null;

  const AnimatedBox = animated(Box);

  return (
    <AnimatedBox
      style={containerAnimation}
      sx={{
        textAlign: 'center',
        py: compact ? 6 : 8,
        px: 4,
        background: `linear-gradient(135deg, ${colors.neutral[0]} 0%, ${colors.pastel.blueLight}20 100%)`,
        borderRadius: borderRadius['2xl'],
        boxShadow: shadows.soft,
        border: `2px dashed ${colors.neutral[200]}`,
      }}
      data-testid="empty-state"
    >
      {/* Illustration or Icon */}
      {(IllustrationComponent || icon) && (
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {IllustrationComponent ? (
            <IllustrationComponent />
          ) : (
            <Box
              sx={{
                color: colors.neutral[400],
                '& svg': {
                  fontSize: compact ? 60 : 80,
                },
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      )}

      {/* Title */}
      <Typography
        variant={compact ? 'h6' : 'h5'}
        sx={{
          fontWeight: 700,
          mb: 2,
          color: colors.neutral[900],
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </Typography>

      {/* Description */}
      <Typography
        variant="body1"
        sx={{
          color: colors.neutral[600],
          mb: 4,
          maxWidth: 500,
          mx: 'auto',
          lineHeight: 1.7,
          fontSize: compact ? '14px' : '16px',
        }}
      >
        {description}
      </Typography>

      {/* Actions - 2025 UX: Animated buttons */}
      {(primaryAction || secondaryAction) && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {primaryAction && (
            <AnimatedButton
              variant="contained"
              size={compact ? 'medium' : 'large'}
              onClick={primaryAction.onClick}
              startIcon={primaryAction.icon || <AddIcon />}
              intensity="strong"
              sx={{
                background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`,
                color: colors.neutral[0],
                fontWeight: 600,
                px: 4,
                boxShadow: `0 4px 12px ${colors.primary.main}40`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${colors.primary.dark} 0%, ${colors.primary.main} 100%)`,
                  boxShadow: `0 6px 20px ${colors.primary.main}60`,
                },
              }}
              data-testid="empty-state-primary-action"
            >
              {primaryAction.label}
            </AnimatedButton>
          )}

          {secondaryAction && (
            <AnimatedButton
              variant="outlined"
              size={compact ? 'medium' : 'large'}
              onClick={secondaryAction.onClick}
              startIcon={<HelpOutlineIcon />}
              sx={{
                borderColor: colors.neutral[300],
                color: colors.neutral[700],
                borderWidth: 2,
                px: 4,
                '&:hover': {
                  borderWidth: 2,
                  borderColor: colors.primary.main,
                  backgroundColor: colors.pastel.blueLight,
                  color: colors.primary.main,
                },
              }}
              data-testid="empty-state-secondary-action"
            >
              {secondaryAction.label}
            </AnimatedButton>
          )}
        </Box>
      )}
    </AnimatedBox>
  );
}
