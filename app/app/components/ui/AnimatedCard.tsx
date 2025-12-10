'use client';

import { animated } from '@react-spring/web';
import { Card, CardProps } from '@mui/material';
import { useCardHover } from '@/app/hooks/useSpringAnimation';

/**
 * AnimatedCard Component
 *
 * Card with physics-based lift animation on hover (2025 UX standard)
 * Features:
 * - Hover lift effect (-8px vertical translation)
 * - Elevated shadow on hover
 * - Smooth spring physics transitions
 * - Maintains MUI Card functionality
 *
 * @example
 * <AnimatedCard>
 *   <CardContent>תוכן הכרטיס</CardContent>
 * </AnimatedCard>
 *
 * @example With custom intensity
 * <AnimatedCard intensity="strong" onClick={handleClick}>
 *   <CardContent>כרטיס אינטראקטיבי</CardContent>
 * </AnimatedCard>
 */

interface AnimatedCardProps extends CardProps {
  /** Enable hover animation (default: true) */
  enableAnimation?: boolean;
  /** Animation lift intensity in pixels (default: 8) */
  intensity?: number;
  /** Make card clickable with cursor pointer (default: auto-detect from onClick) */
  clickable?: boolean;
}

const AnimatedMuiCard = animated(Card);

export default function AnimatedCard({
  enableAnimation = true,
  intensity = 8,
  clickable,
  onClick,
  children,
  sx,
  ...props
}: AnimatedCardProps) {
  const { y, boxShadow, bind, isHovered } = useCardHover();

  // Auto-detect clickable if onClick is provided
  const isClickable = clickable !== undefined ? clickable : !!onClick;

  // Adjust lift intensity
  const adjustedY = y.to((val) => (val / 8) * intensity);

  if (!enableAnimation) {
    return (
      <Card
        onClick={onClick}
        sx={{
          ...sx,
          ...(isClickable && { cursor: 'pointer' }),
        }}
        {...props}
      >
        {children}
      </Card>
    );
  }

  return (
    <AnimatedMuiCard
      {...bind()}
      onClick={onClick}
      sx={{
        ...sx,
        willChange: 'transform, box-shadow',
        ...(isClickable && { cursor: 'pointer' }),
      }}
      style={{
        y: adjustedY,
        boxShadow,
      }}
      {...props}
    >
      {children}
    </AnimatedMuiCard>
  );
}

/**
 * AnimatedListItem Component
 *
 * Animated list item with staggered appear effect
 */
import { ListItem, ListItemProps } from '@mui/material';
import { useStaggeredAppear } from '@/app/hooks/useSpringAnimation';

interface AnimatedListItemProps extends ListItemProps {
  /** Index in the list for stagger delay calculation */
  index: number;
  /** Base delay between items in ms (default: 50) */
  staggerDelay?: number;
  /** Enable stagger animation (default: true) */
  enableAnimation?: boolean;
}

const AnimatedMuiListItem = animated(ListItem);

export function AnimatedListItem({
  index,
  staggerDelay = 50,
  enableAnimation = true,
  children,
  sx,
  ...props
}: AnimatedListItemProps) {
  const { opacity, x } = useStaggeredAppear(index, staggerDelay);

  if (!enableAnimation) {
    return (
      <ListItem sx={sx} {...props}>
        {children}
      </ListItem>
    );
  }

  return (
    <AnimatedMuiListItem
      sx={{
        ...sx,
        willChange: 'opacity, transform',
      }}
      style={{
        opacity,
        x,
      }}
      {...props}
    >
      {children}
    </AnimatedMuiListItem>
  );
}
