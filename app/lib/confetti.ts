/**
 * Confetti Animations for Success States
 *
 * Celebrates user achievements with confetti bursts
 *
 * Usage:
 * ```tsx
 * import { celebrateSuccess } from '@/lib/confetti';
 *
 * const handleTaskComplete = () => {
 *   celebrateSuccess();
 *   toast.success('משימה הושלמה!');
 * };
 * ```
 */

import confetti from 'canvas-confetti';

/**
 * Basic confetti burst from center
 */
export function celebrateSuccess() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#6161FF', '#00C875', '#FDAB3D', '#FF158A', '#A25DDC']
  });
}

/**
 * Confetti burst from specific element (e.g., button that was clicked)
 */
export function celebrateFromElement(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  confetti({
    particleCount: 50,
    spread: 60,
    origin: { x, y },
    colors: ['#6161FF', '#00C875', '#FDAB3D']
  });
}

/**
 * Continuous confetti rain (for major achievements)
 */
export function confettiRain(duration: number = 3000) {
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#6161FF', '#00C875', '#FF158A']
    });

    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#FDAB3D', '#A25DDC', '#0086C0']
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

/**
 * Firework burst (for campaign milestones)
 */
export function celebrateFireworks() {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval: any = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#6161FF', '#00C875', '#FDAB3D']
    });

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#FF158A', '#A25DDC', '#0086C0']
    });
  }, 250);
}

/**
 * School pride effect (two confetti cannons from sides)
 */
export function celebrateSchoolPride() {
  const end = Date.now() + 3 * 1000;

  const colors = ['#6161FF', '#00C875'];

  (function frame() {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors
    });

    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}
