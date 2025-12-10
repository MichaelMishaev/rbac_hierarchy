'use client';

/**
 * InteractiveBox Component (2025 UX Standard)
 *
 * Adds micro-interactions and visual feedback to any Box
 * - Ripple effect on click
 * - Hover states (lift, glow, scale)
 * - Focus states (WCAG 2.2 compliant)
 * - Loading states
 * - Success/Error states
 *
 * Use this to make any container interactive and delightful
 */

import React, { useState } from 'react';
import { Box, BoxProps, CircularProgress } from '@mui/material';
import { animated, useSpring } from '@react-spring/web';
import { CheckCircle as CheckIcon, Error as ErrorIcon } from '@mui/icons-material';
import { colors } from '@/lib/design-system';
import { createRipple, focusGlow } from '@/lib/micro-interactions';
import { haptics } from '@/lib/haptics';

type InteractionType = 'lift' | 'glow' | 'scale' | 'none';
type StateType = 'idle' | 'loading' | 'success' | 'error';

interface InteractiveBoxProps extends Omit<BoxProps, 'onClick'> {
  /** Type of hover interaction */
  interaction?: InteractionType;
  /** Enable ripple effect on click */
  ripple?: boolean;
  /** Enable haptic feedback */
  haptic?: boolean;
  /** Current state */
  state?: StateType;
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void | Promise<void>;
  /** Children */
  children?: React.ReactNode;
}

const AnimatedBox = animated(Box);

export default function InteractiveBox({
  interaction = 'lift',
  ripple = true,
  haptic = true,
  state = 'idle',
  onClick,
  children,
  sx,
  ...props
}: InteractiveBoxProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [internalState, setInternalState] = useState<StateType>(state);

  // Animation spring
  const spring = useSpring({
    scale: isPressed ? 0.98 : isHovered && interaction === 'scale' ? 1.03 : 1,
    y: isHovered && interaction === 'lift' ? -4 : 0,
    boxShadow:
      isHovered && interaction === 'glow'
        ? `0 0 20px ${colors.primary.main}40`
        : '0 2px 8px rgba(0, 0, 0, 0.1)',
    config: { tension: 300, friction: 20 },
  });

  const handleClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    // Ripple effect
    if (ripple) {
      createRipple(e);
    }

    // Haptic feedback
    if (haptic) {
      haptics.light();
    }

    // Execute onClick if provided
    if (onClick) {
      setInternalState('loading');
      try {
        await onClick(e);
        setInternalState('success');
        if (haptic) haptics.success();
        setTimeout(() => setInternalState('idle'), 2000);
      } catch (error) {
        setInternalState('error');
        if (haptic) haptics.error();
        setTimeout(() => setInternalState('idle'), 2000);
      }
    }
  };

  const currentState = state !== 'idle' ? state : internalState;

  return (
    <AnimatedBox
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        transition: 'all 0.2s ease',
        ...focusGlow,
        ...sx,
      }}
      style={
        interaction !== 'none'
          ? {
              scale: spring.scale,
              y: spring.y,
              boxShadow: spring.boxShadow,
            }
          : undefined
      }
      {...props}
    >
      {/* Content */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>{children}</Box>

      {/* State Overlays */}
      {currentState === 'loading' && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            zIndex: 2,
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}

      {currentState === 'success' && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.pastel.greenLight,
            zIndex: 2,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <CheckIcon sx={{ color: colors.success, fontSize: 48 }} />
        </Box>
      )}

      {currentState === 'error' && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.pastel.redLight,
            zIndex: 2,
            animation: 'shake 0.5s ease',
          }}
        >
          <ErrorIcon sx={{ color: colors.error, fontSize: 48 }} />
        </Box>
      )}

      {/* Ripple container */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-10px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(10px);
          }
        }
      `}</style>
    </AnimatedBox>
  );
}

/**
 * Quick presets for common use cases
 */

// Card with lift effect
export function InteractiveCard({
  children,
  onClick,
  ...props
}: Omit<InteractiveBoxProps, 'interaction'>) {
  return (
    <InteractiveBox interaction="lift" onClick={onClick} {...props}>
      {children}
    </InteractiveBox>
  );
}

// Button-like box with scale effect
export function InteractiveButton({
  children,
  onClick,
  ...props
}: Omit<InteractiveBoxProps, 'interaction'>) {
  return (
    <InteractiveBox interaction="scale" onClick={onClick} {...props}>
      {children}
    </InteractiveBox>
  );
}

// Glowing hover effect
export function InteractiveGlow({
  children,
  onClick,
  ...props
}: Omit<InteractiveBoxProps, 'interaction'>) {
  return (
    <InteractiveBox interaction="glow" onClick={onClick} {...props}>
      {children}
    </InteractiveBox>
  );
}
