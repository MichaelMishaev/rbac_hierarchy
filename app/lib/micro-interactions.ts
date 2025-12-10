/**
 * Micro-Interactions Library (2025 UX Standard)
 *
 * Small, delightful animations that provide instant feedback
 * Makes the UI feel responsive, polished, and premium
 *
 * Based on 2025 industry standards (Linear, Notion, Vercel)
 */

import { keyframes } from '@mui/material';
import { colors } from './design-system';

// ==========================================
// RIPPLE EFFECT (Material Design 3 Style)
// ==========================================

/**
 * Creates a ripple effect at the click position
 * Usage: Add to onClick handler
 */
export function createRipple(event: React.MouseEvent<HTMLElement>) {
  const button = event.currentTarget;
  const rect = button.getBoundingClientRect();

  const circle = document.createElement('span');
  const diameter = Math.max(rect.width, rect.height);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.classList.add('ripple');

  const ripple = button.getElementsByClassName('ripple')[0];
  if (ripple) {
    ripple.remove();
  }

  button.appendChild(circle);

  // Remove after animation
  setTimeout(() => circle.remove(), 600);
}

/**
 * Ripple CSS to inject in global styles
 */
export const rippleStyles = `
  .ripple {
    position: absolute;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.6);
    animation: ripple-animation 0.6s ease-out;
    pointer-events: none;
  }

  @keyframes ripple-animation {
    from {
      transform: scale(0);
      opacity: 1;
    }
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;

// ==========================================
// LOADING STATES
// ==========================================

/**
 * Shimmer animation for loading states
 */
export const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

/**
 * Pulse animation for loading indicators
 */
export const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

/**
 * Spinner rotation
 */
export const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// ==========================================
// HOVER EFFECTS
// ==========================================

/**
 * Glow effect on hover
 */
export const glowHover = {
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    boxShadow: `0 0 20px ${colors.primary.main}40`,
  },
};

/**
 * Lift effect on hover (slight elevation)
 */
export const liftHover = {
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
};

/**
 * Scale effect on hover
 */
export const scaleHover = {
  transition: 'transform 0.2s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  },
};

/**
 * Border glow on hover
 */
export const borderGlow = {
  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    borderColor: colors.primary.main,
    boxShadow: `0 0 0 2px ${colors.primary.main}20`,
  },
};

// ==========================================
// FOCUS STATES (Accessibility)
// ==========================================

/**
 * Enhanced focus ring (WCAG 2.2 compliant)
 */
export const focusRing = {
  '&:focus-visible': {
    outline: `3px solid ${colors.primary.main}`,
    outlineOffset: '2px',
    borderRadius: '8px',
  },
};

/**
 * Subtle focus glow
 */
export const focusGlow = {
  '&:focus-visible': {
    boxShadow: `0 0 0 4px ${colors.primary.main}20`,
    outline: 'none',
  },
};

// ==========================================
// STATE TRANSITIONS
// ==========================================

/**
 * Success state animation (checkmark)
 */
export const successAnimation = keyframes`
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

/**
 * Error shake animation
 */
export const errorShake = keyframes`
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-10px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(10px);
  }
`;

/**
 * Bounce animation for notifications
 */
export const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-30px);
  }
  60% {
    transform: translateY(-15px);
  }
`;

// ==========================================
// SLIDE ANIMATIONS
// ==========================================

export const slideInRight = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

export const slideInLeft = keyframes`
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

export const slideInUp = keyframes`
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

export const slideInDown = keyframes`
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

// ==========================================
// FADE ANIMATIONS
// ==========================================

export const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

export const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

export const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// ==========================================
// SCALE ANIMATIONS
// ==========================================

export const scaleIn = keyframes`
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
`;

export const scaleOut = keyframes`
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0);
    opacity: 0;
  }
`;

// ==========================================
// ATTENTION SEEKERS
// ==========================================

/**
 * Wiggle animation to draw attention
 */
export const wiggle = keyframes`
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-5deg);
  }
  75% {
    transform: rotate(5deg);
  }
`;

/**
 * Heartbeat animation
 */
export const heartbeat = keyframes`
  0% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.3);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.3);
  }
  70% {
    transform: scale(1);
  }
`;

/**
 * Rubber band animation
 */
export const rubberBand = keyframes`
  from {
    transform: scale3d(1, 1, 1);
  }
  30% {
    transform: scale3d(1.25, 0.75, 1);
  }
  40% {
    transform: scale3d(0.75, 1.25, 1);
  }
  50% {
    transform: scale3d(1.15, 0.85, 1);
  }
  65% {
    transform: scale3d(0.95, 1.05, 1);
  }
  75% {
    transform: scale3d(1.05, 0.95, 1);
  }
  to {
    transform: scale3d(1, 1, 1);
  }
`;

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Add micro-interaction to any element
 */
export function addMicroInteraction(
  element: HTMLElement,
  type: 'ripple' | 'shake' | 'bounce' | 'wiggle'
) {
  switch (type) {
    case 'ripple':
      element.addEventListener('click', createRipple as any);
      break;
    case 'shake':
      element.style.animation = `${errorShake} 0.5s ease`;
      setTimeout(() => (element.style.animation = ''), 500);
      break;
    case 'bounce':
      element.style.animation = `${bounce} 1s ease`;
      setTimeout(() => (element.style.animation = ''), 1000);
      break;
    case 'wiggle':
      element.style.animation = `${wiggle} 0.5s ease`;
      setTimeout(() => (element.style.animation = ''), 500);
      break;
  }
}

/**
 * Smooth scroll with easing
 */
export function smoothScrollTo(
  element: HTMLElement,
  to: number,
  duration: number = 300
) {
  const start = element.scrollTop;
  const change = to - start;
  const startTime = performance.now();

  function animateScroll(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function (ease-in-out)
    const easing = progress < 0.5
      ? 2 * progress * progress
      : -1 + (4 - 2 * progress) * progress;

    element.scrollTop = start + change * easing;

    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  }

  requestAnimationFrame(animateScroll);
}
