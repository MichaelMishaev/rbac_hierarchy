'use client';

import { useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { colors, borderRadius, shadows } from '@/lib/design-system';

interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export default function CollapsibleCard({
  title,
  children,
  defaultExpanded = true,
}: CollapsibleCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Box
      sx={{
        p: 3,
        background: colors.neutral[0],
        borderRadius: borderRadius.xl,
        boxShadow: shadows.medium,
        border: `1px solid ${colors.neutral[200]}`,
        transition: 'all 0.3s ease',
      }}
      data-testid="collapsible-card"
    >
      {/* Header with Toggle */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: isExpanded ? 3 : 0,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: colors.neutral[800],
            textAlign: 'right', // RTL
          }}
        >
          {title}
        </Typography>

        <IconButton
          onClick={() => setIsExpanded(!isExpanded)}
          size="small"
          sx={{
            color: colors.neutral[600],
            '&:hover': {
              backgroundColor: colors.pastel.blue,
              color: colors.primary,
            },
          }}
          aria-label={isExpanded ? 'הסתר' : 'הצג'}
        >
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Collapsible Content */}
      {isExpanded && (
        <Box
          sx={{
            animation: 'fadeIn 0.3s ease',
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'translateY(-10px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  );
}
