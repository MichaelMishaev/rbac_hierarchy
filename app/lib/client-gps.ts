/**
 * Client-Side GPS Geolocation Hook - Phase 5
 *
 * React hook for accessing device GPS location using the browser
 * Geolocation API. Designed for mobile-first attendance tracking.
 *
 * Features:
 * - High-accuracy GPS mode
 * - Permission handling
 * - Error states
 * - Loading states
 * - Timeout handling
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================
// TYPES
// ============================================

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;      // meters
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: Date;
}

export interface GPSError {
  code: number;
  message: string;
  userFriendlyMessage: string;
}

export interface UseGPSLocationReturn {
  position: GPSPosition | null;
  loading: boolean;
  error: GPSError | null;
  requestLocation: () => Promise<GPSPosition>;
  clearError: () => void;
  hasPermission: boolean | null; // null = unknown, true = granted, false = denied
}

// ============================================
// CONSTANTS
// ============================================

const GPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,    // Use GPS instead of WiFi/cell towers
  timeout: 10000,              // 10 seconds timeout
  maximumAge: 300000,          // Accept cached position up to 5 minutes old
};

const ERROR_MESSAGES: Record<number, string> = {
  1: 'Location access denied. Please enable location permissions.',
  2: 'Location unavailable. Please check your device settings.',
  3: 'Location request timed out. Please try again.',
};

// ============================================
// MAIN HOOK
// ============================================

/**
 * React hook for GPS location tracking
 *
 * @returns GPS location state and control functions
 *
 * @example
 * function MyComponent() {
 *   const { position, loading, error, requestLocation } = useGPSLocation();
 *
 *   const handleGetLocation = async () => {
 *     try {
 *       const pos = await requestLocation();
 *       console.log(`You are at ${pos.latitude}, ${pos.longitude}`);
 *     } catch (err) {
 *       console.error('GPS error:', err);
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleGetLocation} disabled={loading}>
 *       {loading ? 'Getting location...' : 'Get My Location'}
 *     </button>
 *   );
 * }
 */
export function useGPSLocation(): UseGPSLocationReturn {
  const [position, setPosition] = useState<GPSPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GPSError | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const watchIdRef = useRef<number | null>(null);

  // Check if Geolocation API is available
  const isGeolocationAvailable =
    typeof window !== 'undefined' &&
    'geolocation' in navigator;

  // Check permission status on mount
  useEffect(() => {
    if (!isGeolocationAvailable) {
      setHasPermission(false);
      setError({
        code: 0,
        message: 'Geolocation not supported',
        userFriendlyMessage: 'Your device does not support location services.',
      });
      return;
    }

    // Check permission status if Permissions API is available
    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setHasPermission(result.state === 'granted');

          // Listen for permission changes
          result.addEventListener('change', () => {
            setHasPermission(result.state === 'granted');
          });
        })
        .catch(() => {
          // Permissions API not fully supported, will check on first request
          setHasPermission(null);
        });
    }
  }, [isGeolocationAvailable]);

  // Request GPS location once
  const requestLocation = useCallback((): Promise<GPSPosition> => {
    return new Promise((resolve, reject) => {
      if (!isGeolocationAvailable) {
        const err: GPSError = {
          code: 0,
          message: 'Geolocation not supported',
          userFriendlyMessage: 'Your device does not support location services.',
        };
        setError(err);
        reject(err);
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const gpsPosition: GPSPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: new Date(pos.timestamp),
          };

          setPosition(gpsPosition);
          setLoading(false);
          setHasPermission(true);
          resolve(gpsPosition);
        },
        (err) => {
          const gpsError: GPSError = {
            code: err.code,
            message: err.message,
            userFriendlyMessage: ERROR_MESSAGES[err.code] || 'Unknown location error',
          };

          setError(gpsError);
          setLoading(false);

          if (err.code === 1) {
            setHasPermission(false);
          }

          reject(gpsError);
        },
        GPS_OPTIONS
      );
    });
  }, [isGeolocationAvailable]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    position,
    loading,
    error,
    requestLocation,
    clearError,
    hasPermission,
  };
}

// ============================================
// STANDALONE FUNCTIONS
// ============================================

/**
 * Capture GPS location once (for attendance check-in)
 *
 * @returns Promise with GPS position
 * @throws GPSError if location capture fails
 *
 * @example
 * try {
 *   const position = await captureAttendanceLocation();
 *   console.log(`Checked in at ${position.latitude}, ${position.longitude}`);
 * } catch (error) {
 *   console.error('Failed to get location:', error.userFriendlyMessage);
 * }
 */
export async function captureAttendanceLocation(): Promise<GPSPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject({
        code: 0,
        message: 'Geolocation not supported',
        userFriendlyMessage: 'Your device does not support location services.',
      });
      return;
    }

    // Use high accuracy and short timeout for attendance
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,           // 10 seconds
      maximumAge: 60000,        // Accept 1 minute old location
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          altitudeAccuracy: pos.coords.altitudeAccuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: new Date(pos.timestamp),
        });
      },
      (err) => {
        reject({
          code: err.code,
          message: err.message,
          userFriendlyMessage: ERROR_MESSAGES[err.code] || 'Unknown location error',
        });
      },
      options
    );
  });
}

/**
 * Request location permission (non-blocking)
 *
 * @returns Promise that resolves when permission is granted
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    await captureAttendanceLocation();
    return true;
  } catch (error: any) {
    if (error.code === 1) {
      return false; // Permission denied
    }
    throw error; // Other errors
  }
}

/**
 * Check if device has GPS capability
 *
 * @returns true if GPS is available
 */
export function hasGPSCapability(): boolean {
  return (
    typeof window !== 'undefined' &&
    'geolocation' in navigator
  );
}

/**
 * Format GPS accuracy for display
 *
 * @param accuracy - Accuracy in meters
 * @returns Formatted string with quality indicator
 *
 * @example
 * formatGPSAccuracy(10);  // "10m (Excellent)"
 * formatGPSAccuracy(50);  // "50m (Good)"
 * formatGPSAccuracy(150); // "150m (Poor)"
 */
export function formatGPSAccuracy(accuracy: number): string {
  let quality: string;

  if (accuracy <= 10) {
    quality = 'Excellent';
  } else if (accuracy <= 50) {
    quality = 'Good';
  } else if (accuracy <= 100) {
    quality = 'Fair';
  } else {
    quality = 'Poor';
  }

  return `${Math.round(accuracy)}m (${quality})`;
}

/**
 * Get GPS quality indicator color
 *
 * @param accuracy - Accuracy in meters
 * @returns Color string (green, orange, red)
 */
export function getGPSQualityColor(accuracy: number): string {
  if (accuracy <= 50) {
    return '#4caf50'; // green
  } else if (accuracy <= 100) {
    return '#ff9800'; // orange
  } else {
    return '#f44336'; // red
  }
}

/**
 * Calculate estimated time to get GPS fix
 *
 * @param previousAttempts - Number of previous failed attempts
 * @returns Estimated seconds until GPS fix
 */
export function estimateGPSFixTime(previousAttempts: number = 0): number {
  // First attempt: 2-5 seconds
  // Subsequent attempts: add 2 seconds per attempt (up to 30 seconds)
  const baseTime = 5;
  const additionalTime = Math.min(previousAttempts * 2, 25);
  return baseTime + additionalTime;
}

// ============================================
// EXPORTS
// ============================================

export const GPS = {
  useLocation: useGPSLocation,
  captureLocation: captureAttendanceLocation,
  requestPermission: requestLocationPermission,
  hasCapability: hasGPSCapability,
  formatAccuracy: formatGPSAccuracy,
  getQualityColor: getGPSQualityColor,
  estimateFixTime: estimateGPSFixTime,
};
