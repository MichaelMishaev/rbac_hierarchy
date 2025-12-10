'use client';

import { animated } from '@react-spring/web';
import { Button, ButtonProps } from '@mui/material';
import { useInteractiveButton } from '@/app/hooks/useSpringAnimation';
import { haptics } from '@/lib/haptics';

/**
 * AnimatedButton Component
 *
 * Button with physics-based spring animations (2025 UX standard)
 * Features:
 * - Hover scale effect (1.05x)
 * - Press feedback (0.95x scale)
 * - Elevated shadow on hover
 * - Haptic feedback on mobile
 * - Smooth spring physics transitions
 *
 * @example
 * <AnimatedButton variant="contained" onClick={handleClick}>
 *   לחץ כאן
 * </AnimatedButton>
 */

interface AnimatedButtonProps extends ButtonProps {
  /** Enable haptic feedback on mobile (default: true) */
  enableHaptics?: boolean;
  /** Animation intensity (default: 'normal') */
  intensity?: 'subtle' | 'normal' | 'strong';
}

const AnimatedMuiButton = animated(Button);

export default function AnimatedButton({
  onClick,
  enableHaptics = true,
  intensity = 'normal',
  children,
  sx,
  ...props
}: AnimatedButtonProps) {
  const { scale, boxShadow, y, bind } = useInteractiveButton();

  // Adjust animation intensity
  const scaleMultiplier = intensity === 'subtle' ? 0.5 : intensity === 'strong' ? 1.5 : 1;
  const adjustedScale = scale.to((s) => 1 + (s - 1) * scaleMultiplier);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Trigger haptic feedback on mobile
    if (enableHaptics) {
      haptics.light();
    }

    // Call original onClick
    onClick?.(e);
  };

  return (
    <AnimatedMuiButton
      {...bind()}
      onClick={handleClick}
      sx={{
        ...sx,
        willChange: 'transform, box-shadow',
        transformOrigin: 'center',
      }}
      style={{
        scale: adjustedScale,
        boxShadow,
        y,
      }}
      {...props}
    >
      {children}
    </AnimatedMuiButton>
  );
}

/**
 * AnimatedIconButton Component
 *
 * Icon button with bounce animation on click
 */
import { IconButton, IconButtonProps } from '@mui/material';
import { useIconBounce } from '@/app/hooks/useSpringAnimation';

interface AnimatedIconButtonProps extends IconButtonProps {
  enableHaptics?: boolean;
}

const AnimatedMuiIconButton = animated(IconButton);

export function AnimatedIconButton({
  onClick,
  enableHaptics = true,
  children,
  sx,
  ...props
}: AnimatedIconButtonProps) {
  const { scale, trigger } = useIconBounce();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    trigger();

    if (enableHaptics) {
      haptics.light();
    }

    onClick?.(e);
  };

  return (
    <AnimatedMuiIconButton
      onClick={handleClick}
      sx={{
        ...sx,
        willChange: 'transform',
      }}
      style={{
        scale,
      }}
      {...props}
    >
      {children}
    </AnimatedMuiIconButton>
  );
}

/**
 * AnimatedFab Component
 *
 * Floating Action Button with hover elevation
 */
import { Fab, FabProps } from '@mui/material';
import { useButtonHover } from '@/app/hooks/useSpringAnimation';

interface AnimatedFabProps extends FabProps {
  enableHaptics?: boolean;
}

const AnimatedMuiFab = animated(Fab);

export function AnimatedFab({
  onClick,
  enableHaptics = true,
  children,
  sx,
  ...props
}: AnimatedFabProps) {
  const { scale, boxShadow, bind } = useButtonHover();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (enableHaptics) {
      haptics.medium();
    }

    onClick?.(e);
  };

  return (
    <AnimatedMuiFab
      {...bind()}
      onClick={handleClick}
      sx={{
        ...sx,
        willChange: 'transform, box-shadow',
      }}
      style={{
        scale,
        boxShadow,
      }}
      {...props}
    >
      {children}
    </AnimatedMuiFab>
  );
}
