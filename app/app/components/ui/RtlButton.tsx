'use client';

import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { ReactNode } from 'react';
import { useLocale } from 'next-intl';

interface RtlButtonProps extends Omit<ButtonProps, 'startIcon' | 'endIcon'> {
  /**
   * Icon to display at the start of the button (left in LTR, right in RTL)
   */
  startIcon?: ReactNode;
  /**
   * Icon to display at the end of the button (right in LTR, left in RTL)
   */
  endIcon?: ReactNode;
  /**
   * Show loading spinner instead of startIcon
   */
  loading?: boolean;
  /**
   * Size of loading spinner (default: 20)
   */
  loadingSize?: number;
}

/**
 * RTL-compatible Button component that properly handles icon positioning
 * in Hebrew (RTL) layout.
 *
 * This component wraps MUI Button and fixes the icon overlap issue
 * that occurs with startIcon/endIcon in RTL mode.
 *
 * @example
 * ```tsx
 * <RtlButton startIcon={<AddIcon />} variant="contained">
 *   אזור חדש
 * </RtlButton>
 * ```
 */
export default function RtlButton({
  startIcon,
  endIcon,
  loading = false,
  loadingSize = 20,
  children,
  sx,
  disabled,
  ...props
}: RtlButtonProps) {
  const locale = useLocale();
  const isRTL = locale === 'he';

  // Show loading spinner if loading prop is true
  const displayStartIcon = loading ? (
    <CircularProgress size={loadingSize} color="inherit" />
  ) : (
    startIcon
  );

  // In RTL, we need to swap start and end icons
  const actualStartIcon = isRTL ? endIcon : displayStartIcon;
  const actualEndIcon = isRTL ? displayStartIcon : endIcon;

  return (
    <Button
      {...props}
      disabled={disabled || loading}
      sx={{
        display: 'flex',
        gap: startIcon || endIcon ? 1 : 0,
        ...sx,
      }}
    >
      {actualStartIcon}
      {children}
      {actualEndIcon}
    </Button>
  );
}
