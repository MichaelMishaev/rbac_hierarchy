'use client';

/**
 * Dynamic Framer Motion Components
 *
 * 🚀 PERFORMANCE: These components use dynamic imports to code-split
 * framer-motion (~350KB) from the main bundle. They only load when
 * animations are actually needed.
 *
 * Usage:
 *   import { MotionDiv, MotionBox } from '@/app/components/ui/DynamicMotion';
 *
 *   <MotionDiv
 *     initial={{ opacity: 0 }}
 *     animate={{ opacity: 1 }}
 *   >
 *     Content
 *   </MotionDiv>
 *
 * @module components/ui/DynamicMotion
 */

import dynamic from 'next/dynamic';
import { forwardRef, ComponentPropsWithoutRef } from 'react';
import type { HTMLMotionProps } from 'framer-motion';

// Skeleton component shown while motion loads
const MotionSkeleton = forwardRef<HTMLDivElement, { children?: React.ReactNode }>(
  ({ children, ...props }, ref) => (
    <div ref={ref} {...props}>
      {children}
    </div>
  )
);
MotionSkeleton.displayName = 'MotionSkeleton';

// Dynamic import of motion.div with SSR disabled
const DynamicMotionDiv = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.div),
  {
    ssr: false,
    loading: () => <div />,
  }
);

// Dynamic import of motion.span
const DynamicMotionSpan = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.span),
  {
    ssr: false,
    loading: () => <span />,
  }
);

// Dynamic import of motion.button
const DynamicMotionButton = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.button),
  {
    ssr: false,
    loading: () => <button />,
  }
);

// Dynamic import of AnimatePresence
export const AnimatePresence = dynamic(
  () => import('framer-motion').then((mod) => mod.AnimatePresence),
  { ssr: false }
);

// Type-safe wrappers
type MotionDivProps = HTMLMotionProps<'div'> & { children?: React.ReactNode };
type MotionSpanProps = HTMLMotionProps<'span'> & { children?: React.ReactNode };
type MotionButtonProps = HTMLMotionProps<'button'> & { children?: React.ReactNode };

/**
 * Dynamically loaded motion.div
 * Use this instead of direct framer-motion import for better code splitting
 */
export const MotionDiv = forwardRef<HTMLDivElement, MotionDivProps>(
  (props, ref) => <DynamicMotionDiv ref={ref} {...props} />
);
MotionDiv.displayName = 'MotionDiv';

/**
 * Dynamically loaded motion.span
 */
export const MotionSpan = forwardRef<HTMLSpanElement, MotionSpanProps>(
  (props, ref) => <DynamicMotionSpan ref={ref} {...props} />
);
MotionSpan.displayName = 'MotionSpan';

/**
 * Dynamically loaded motion.button
 */
export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  (props, ref) => <DynamicMotionButton ref={ref} {...props} />
);
MotionButton.displayName = 'MotionButton';

// Export common animation variants for reuse
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

// Default transition
export const defaultTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
};

// Stagger children transition
export const staggerTransition = {
  duration: 0.6,
  ease: [0.4, 0, 0.2, 1],
  staggerChildren: 0.1,
};
