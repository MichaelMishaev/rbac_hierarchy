'use client';

import React from 'react';
import { Box, Typography, ButtonBase } from '@mui/material';
import { colors, borderRadius } from '@/lib/design-system';

type ColorKey = 'blue' | 'green' | 'purple' | 'orange' | 'red';

type StatChipProps = {
  icon: React.ReactElement;
  label: string;
  value: string | number;
  color: ColorKey;
  onClick?: () => void;
  clickable?: boolean;
};

export default function StatChip({ icon, label, value, color, onClick, clickable = false }: StatChipProps) {
  const colorMap = {
    blue: colors.pastel.blue,
    green: colors.pastel.green,
    purple: colors.pastel.purple,
    orange: colors.pastel.orange,
    red: colors.pastel.red,
  };

  const lightColorMap = {
    blue: colors.pastel.blueLight,
    green: colors.pastel.greenLight,
    purple: colors.pastel.purpleLight,
    orange: colors.pastel.orangeLight,
    red: colors.pastel.redLight,
  };

  const mainColor = colorMap[color] || colors.neutral[600];
  const bgColor = lightColorMap[color] || colors.neutral[100];

  const content = (
    <Box
      sx={{
        p: 2,
        borderRadius: borderRadius.md,
        backgroundColor: bgColor,
        border: `1px solid ${mainColor}20`,
        width: '100%',
        height: '100%',
        transition: 'all 0.2s ease',
        ...(clickable && {
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 4px 12px ${mainColor}30`,
            borderColor: mainColor,
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        }),
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
        {React.cloneElement(icon, {
          sx: { fontSize: 16, color: mainColor },
        })}
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          {label}
        </Typography>
      </Box>
      <Typography variant="h6" fontWeight={600}>
        {value}
      </Typography>
      {clickable && (
        <Typography variant="caption" color={mainColor} fontWeight={500} sx={{ mt: 0.5, display: 'block' }}>
          לחץ לצפייה →
        </Typography>
      )}
    </Box>
  );

  if (clickable && onClick) {
    return (
      <ButtonBase
        onClick={onClick}
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: borderRadius.md,
          textAlign: 'right',
        }}
      >
        {content}
      </ButtonBase>
    );
  }

  return content;
}
