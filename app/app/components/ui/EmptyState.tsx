'use client';

import { Box, Typography, Button } from '@mui/material';
import { colors, borderRadius, shadows } from '@/lib/design-system';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

type EmptyStateProps = {
  title: string;
  description: string;
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
};

export default function EmptyState({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 8,
        px: 4,
        background: colors.neutral[0],
        borderRadius: borderRadius.xl,
        boxShadow: shadows.soft,
        border: `2px dashed ${colors.neutral[200]}`,
      }}
      data-testid="empty-state"
    >
      {/* Icon */}
      {icon && (
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            justifyContent: 'center',
            color: colors.neutral[400],
            '& svg': {
              fontSize: 80,
            },
          }}
        >
          {icon}
        </Box>
      )}

      {/* Title */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          mb: 2,
          color: colors.neutral[800],
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
        }}
      >
        {description}
      </Typography>

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {primaryAction && (
            <Button
              variant="contained"
              size="large"
              onClick={primaryAction.onClick}
              startIcon={primaryAction.icon || <AddIcon />}
              sx={{
                background: colors.primary.main,
                color: colors.neutral[0],
                fontWeight: 600,
                px: 4,
                '&:hover': {
                  background: colors.primary.dark,
                },
              }}
              data-testid="empty-state-primary-action"
            >
              {primaryAction.label}
            </Button>
          )}

          {secondaryAction && (
            <Button
              variant="outlined"
              size="large"
              onClick={secondaryAction.onClick}
              startIcon={<HelpOutlineIcon />}
              sx={{
                borderColor: colors.neutral[300],
                color: colors.neutral[700],
                borderWidth: 2,
                px: 4,
                '&:hover': {
                  borderWidth: 2,
                  borderColor: colors.neutral[400],
                  backgroundColor: colors.neutral[50],
                },
              }}
              data-testid="empty-state-secondary-action"
            >
              {secondaryAction.label}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
