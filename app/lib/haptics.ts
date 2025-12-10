/**
 * Haptic Feedback Library for Mobile
 *
 * Provides tactile feedback for user interactions on mobile devices
 * Falls back gracefully on desktop
 *
 * Usage:
 * ```tsx
 * import { haptics } from '@/lib/haptics';
 *
 * <Button onClick={() => {
 *   haptics.success();
 *   handleSubmit();
 * }}>
 *   שמור
 * </Button>
 * ```
 */

export const haptics = {
  /**
   * Light tap (10ms) - For subtle feedback like button hovers
   */
  light: () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium tap (50ms) - For button clicks, selections
   */
  medium: () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  },

  /**
   * Heavy tap (100ms) - For important actions, warnings
   */
  heavy: () => {
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  },

  /**
   * Success pattern (50-30-50ms) - For successful operations
   */
  success: () => {
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }
  },

  /**
   * Error pattern (50-100-50-100-50ms) - For errors, failures
   */
  error: () => {
    if (navigator.vibrate) {
      navigator.vibrate([50, 100, 50, 100, 50]);
    }
  },

  /**
   * Warning pattern (100-50-100ms) - For warnings, confirmations
   */
  warning: () => {
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  },

  /**
   * Selection pattern (30ms) - For list item selection, swipes
   */
  selection: () => {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  },

  /**
   * Check if vibration is supported
   */
  isSupported: (): boolean => {
    return 'vibrate' in navigator;
  }
};

/**
 * Trigger haptic feedback with toast notification
 * Combines visual + tactile feedback
 */
export function hapticToast(
  type: 'success' | 'error' | 'warning',
  message: string,
  toast: any // react-hot-toast instance
) {
  switch (type) {
    case 'success':
      haptics.success();
      toast.success(message);
      break;
    case 'error':
      haptics.error();
      toast.error(message);
      break;
    case 'warning':
      haptics.warning();
      toast(message, { icon: '⚠️' });
      break;
  }
}
