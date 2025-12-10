'use client';

import { useSpring, useSpringValue, config } from '@react-spring/web';
import { useState } from 'react';

/**
 * React Spring Animation Hooks
 *
 * Physics-based animations for modern UX (2025 standards)
 * Provides smooth, natural motion with spring physics
 */

// ==========================================
// Button Animations
// ==========================================

/**
 * Hover animation for buttons with scale and elevation
 *
 * @example
 * const { scale, boxShadow, bind } = useButtonHover();
 * <animated.button {...bind()} style={{ scale, boxShadow }}>
 */
export function useButtonHover() {
  const [isHovered, setIsHovered] = useState(false);

  const spring = useSpring({
    scale: isHovered ? 1.05 : 1,
    boxShadow: isHovered
      ? '0 8px 24px rgba(97, 97, 255, 0.25)'
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
    config: config.wobbly, // Natural spring physics
  });

  const bind = () => ({
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  });

  return { ...spring, bind, isHovered };
}

/**
 * Press animation for buttons (click feedback)
 *
 * @example
 * const { scale, bind } = useButtonPress();
 * <animated.button {...bind()} style={{ scale }}>
 */
export function useButtonPress() {
  const [isPressed, setIsPressed] = useState(false);

  const spring = useSpring({
    scale: isPressed ? 0.95 : 1,
    config: { tension: 300, friction: 10 }, // Snappy response
  });

  const bind = () => ({
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    onMouseLeave: () => setIsPressed(false),
  });

  return { ...spring, bind, isPressed };
}

/**
 * Combined hover + press animation for interactive buttons
 *
 * @example
 * const { scale, boxShadow, bind } = useInteractiveButton();
 * <animated.button {...bind()} style={{ scale, boxShadow }}>
 */
export function useInteractiveButton() {
  const [state, setState] = useState({ hovered: false, pressed: false });

  const spring = useSpring({
    scale: state.pressed ? 0.95 : state.hovered ? 1.05 : 1,
    boxShadow: state.hovered
      ? '0 8px 24px rgba(97, 97, 255, 0.25)'
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
    y: state.pressed ? 2 : 0,
    config: config.wobbly,
  });

  const bind = () => ({
    onMouseEnter: () => setState((s) => ({ ...s, hovered: true })),
    onMouseLeave: () => setState({ hovered: false, pressed: false }),
    onMouseDown: () => setState((s) => ({ ...s, pressed: true })),
    onMouseUp: () => setState((s) => ({ ...s, pressed: false })),
  });

  return { ...spring, bind, state };
}

// ==========================================
// Card Animations
// ==========================================

/**
 * Hover animation for cards with lift effect
 *
 * @example
 * const { y, boxShadow, bind } = useCardHover();
 * <animated.div {...bind()} style={{ y, boxShadow }}>
 */
export function useCardHover() {
  const [isHovered, setIsHovered] = useState(false);

  const spring = useSpring({
    y: isHovered ? -8 : 0,
    boxShadow: isHovered
      ? '0 12px 32px rgba(0, 0, 0, 0.15)'
      : '0 2px 8px rgba(0, 0, 0, 0.08)',
    config: config.gentle,
  });

  const bind = () => ({
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  });

  return { ...spring, bind, isHovered };
}

// ==========================================
// Icon Animations
// ==========================================

/**
 * Rotate animation for icons (e.g., refresh button)
 *
 * @param rotating - External control for rotation
 * @example
 * const { rotate } = useIconRotate(isLoading);
 * <animated.div style={{ rotate }}>
 */
export function useIconRotate(rotating: boolean = false) {
  const rotate = useSpringValue(0, {
    config: { duration: 1000 },
  });

  if (rotating) {
    rotate.start(360, {
      loop: true,
      config: { duration: 1000 },
    });
  } else {
    rotate.stop();
    rotate.set(0);
  }

  return { rotate: rotate.to((r) => `${r}deg`) };
}

/**
 * Bounce animation for icons on interaction
 *
 * @example
 * const { scale, trigger } = useIconBounce();
 * <animated.div style={{ scale }} onClick={trigger}>
 */
export function useIconBounce() {
  const [key, setKey] = useState(0);

  const spring = useSpring({
    from: { scale: 1 },
    to: { scale: 1 },
    reset: true,
    config: config.wobbly,
    ...(key > 0 && {
      from: { scale: 1 },
      to: [{ scale: 1.2 }, { scale: 1 }],
    }),
  });

  const trigger = () => setKey((k) => k + 1);

  return { ...spring, trigger };
}

// ==========================================
// List Animations
// ==========================================

/**
 * Stagger animation for list items appearing
 *
 * @param index - Item index in list
 * @param delay - Base delay in ms
 * @example
 * const { opacity, x } = useStaggeredAppear(index);
 * <animated.div style={{ opacity, x }}>
 */
export function useStaggeredAppear(index: number, delay: number = 50) {
  const spring = useSpring({
    from: { opacity: 0, x: -20 },
    to: { opacity: 1, x: 0 },
    delay: index * delay,
    config: config.gentle,
  });

  return spring;
}

// ==========================================
// Form Animations
// ==========================================

/**
 * Shake animation for form validation errors
 *
 * @example
 * const { x, trigger } = useShakeError();
 * <animated.div style={{ x }}>
 * {error && trigger()}
 */
export function useShakeError() {
  const [key, setKey] = useState(0);

  const spring = useSpring({
    from: { x: 0 },
    to: { x: 0 },
    reset: true,
    config: { tension: 300, friction: 10 },
    ...(key > 0 && {
      from: { x: 0 },
      to: [
        { x: -10 },
        { x: 10 },
        { x: -10 },
        { x: 10 },
        { x: -5 },
        { x: 5 },
        { x: 0 },
      ],
    }),
  });

  const trigger = () => setKey((k) => k + 1);

  return { ...spring, trigger };
}

/**
 * Success animation for form submission
 *
 * @example
 * const { scale, opacity } = useSuccessAnimation(isSuccess);
 * <animated.div style={{ scale, opacity }}>
 */
export function useSuccessAnimation(success: boolean) {
  const spring = useSpring({
    scale: success ? 1 : 0,
    opacity: success ? 1 : 0,
    config: config.wobbly,
  });

  return spring;
}

// ==========================================
// Modal/Dialog Animations
// ==========================================

/**
 * Fade + Scale animation for modals
 *
 * @param isOpen - Modal open state
 * @example
 * const { opacity, scale } = useModalAnimation(isOpen);
 * <animated.div style={{ opacity, scale }}>
 */
export function useModalAnimation(isOpen: boolean) {
  const spring = useSpring({
    opacity: isOpen ? 1 : 0,
    scale: isOpen ? 1 : 0.9,
    config: config.stiff,
  });

  return spring;
}

// ==========================================
// Notification Animations
// ==========================================

/**
 * Slide-in animation for notifications/toasts
 *
 * @param isVisible - Visibility state
 * @param direction - Slide direction
 * @example
 * const { x, opacity } = useSlideIn(isVisible, 'right');
 * <animated.div style={{ x, opacity }}>
 */
export function useSlideIn(
  isVisible: boolean,
  direction: 'left' | 'right' | 'top' | 'bottom' = 'right'
) {
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
  const distance = direction === 'left' || direction === 'top' ? -100 : 100;

  const spring = useSpring({
    [axis]: isVisible ? 0 : distance,
    opacity: isVisible ? 1 : 0,
    config: config.gentle,
  });

  return spring;
}

// ==========================================
// Loading Animations
// ==========================================

/**
 * Pulse animation for loading states
 *
 * @example
 * const { scale, opacity } = usePulse();
 * <animated.div style={{ scale, opacity }}>
 */
export function usePulse() {
  const spring = useSpring({
    from: { scale: 1, opacity: 1 },
    to: async (next) => {
      while (true) {
        await next({ scale: 1.1, opacity: 0.7 });
        await next({ scale: 1, opacity: 1 });
      }
    },
    config: { duration: 1000 },
  });

  return spring;
}
