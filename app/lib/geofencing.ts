/**
 * Geofencing Utilities - Phase 5
 *
 * Provides GPS distance calculations and geofence validation
 * for attendance tracking and location verification.
 *
 * Uses Haversine formula for accurate distance calculation
 * between two GPS coordinates on Earth's surface.
 */

import { prisma } from './prisma';

// ============================================
// TYPES
// ============================================

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeofenceResult {
  isWithin: boolean;        // Is location within geofence?
  distance: number;         // Distance in meters
  accuracyOk: boolean;      // Is GPS accuracy acceptable?
  message?: string;         // User-friendly message
}

export interface GeofenceConfig {
  radiusMeters: number;     // Geofence radius (default: 100m)
  accuracyThreshold: number; // Max acceptable GPS accuracy (default: 50m)
}

// ============================================
// CONSTANTS
// ============================================

const EARTH_RADIUS_METERS = 6371000; // Earth's radius in meters

const DEFAULT_GEOFENCE_CONFIG: GeofenceConfig = {
  radiusMeters: 100,       // 100 meters default radius
  accuracyThreshold: 50,   // 50 meters max accuracy
};

// Israel coordinates range (for validation)
const ISRAEL_BOUNDS = {
  minLatitude: 29.5,
  maxLatitude: 33.3,
  minLongitude: 34.2,
  maxLongitude: 35.9,
};

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 *
 * @param point1 - First coordinate (latitude, longitude)
 * @param point2 - Second coordinate (latitude, longitude)
 * @returns Distance in meters
 *
 * @example
 * const distance = calculateDistance(
 *   { latitude: 32.0853, longitude: 34.7818 }, // Tel Aviv
 *   { latitude: 32.0749, longitude: 34.7753 }  // nearby location
 * );
 * console.log(distance); // ~1200 meters
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  // Validate coordinates
  if (!isValidCoordinate(point1) || !isValidCoordinate(point2)) {
    throw new Error('Invalid coordinates provided');
  }

  // Convert degrees to radians
  const lat1 = degreesToRadians(point1.latitude);
  const lat2 = degreesToRadians(point2.latitude);
  const deltaLat = degreesToRadians(point2.latitude - point1.latitude);
  const deltaLon = degreesToRadians(point2.longitude - point1.longitude);

  // Haversine formula
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_METERS * c;

  return Math.round(distance); // Return distance in meters, rounded
}

/**
 * Validate if a location is within the geofence of a target location
 *
 * @param actualLocation - User's actual GPS location
 * @param targetLocation - Target neighborhood/site location
 * @param config - Geofence configuration (optional)
 * @param accuracy - GPS accuracy in meters (optional)
 * @returns GeofenceResult with validation status and details
 *
 * @example
 * const result = validateGeofence(
 *   { latitude: 32.0853, longitude: 34.7818 }, // User location
 *   { latitude: 32.0850, longitude: 34.7820 }, // Neighborhood location
 *   { radiusMeters: 100, accuracyThreshold: 50 },
 *   25 // GPS accuracy
 * );
 * console.log(result.isWithin); // true
 * console.log(result.distance); // ~30 meters
 */
export function validateGeofence(
  actualLocation: Coordinates,
  targetLocation: Coordinates,
  config: Partial<GeofenceConfig> = {},
  accuracy?: number
): GeofenceResult {
  const fullConfig = { ...DEFAULT_GEOFENCE_CONFIG, ...config };

  // Calculate distance
  const distance = calculateDistance(actualLocation, targetLocation);

  // Check if GPS accuracy is acceptable
  const accuracyOk = !accuracy || accuracy <= fullConfig.accuracyThreshold;

  // Check if within geofence
  const isWithin = distance <= fullConfig.radiusMeters;

  // Generate user-friendly message
  let message: string;
  if (!accuracyOk) {
    message = `GPS accuracy is low (${accuracy}m). Location may not be accurate.`;
  } else if (!isWithin) {
    message = `You are ${distance}m away from the neighborhood (max: ${fullConfig.radiusMeters}m).`;
  } else {
    message = `Within geofence (${distance}m away)`;
  }

  return {
    isWithin,
    distance,
    accuracyOk,
    message,
  };
}

/**
 * Get geofence configuration for a specific neighborhood
 *
 * @param neighborhoodId - Neighborhood UUID
 * @returns Geofence configuration
 *
 * @example
 * const config = await getNeighborhoodGeofenceConfig('uuid-here');
 * console.log(config.radiusMeters); // 100 (or custom value)
 */
export async function getNeighborhoodGeofenceConfig(
  neighborhoodId: string
): Promise<GeofenceConfig> {
  const neighborhood = await prisma.neighborhood.findUnique({
    where: { id: neighborhoodId },
    select: { metadata: true },
  });

  // Extract GPS settings from metadata if available
  const metadata = neighborhood?.metadata as any;
  const geofenceRadius = metadata?.geofenceRadiusMeters ?? DEFAULT_GEOFENCE_CONFIG.radiusMeters;
  const accuracyThreshold = metadata?.gpsAccuracyThreshold ?? DEFAULT_GEOFENCE_CONFIG.accuracyThreshold;

  return {
    radiusMeters: geofenceRadius,
    accuracyThreshold,
  };
}

/**
 * Check if GPS tracking is required for a neighborhood
 *
 * @param neighborhoodId - Neighborhood UUID
 * @returns Whether GPS is required for check-in
 */
export async function isGPSRequiredForNeighborhood(
  neighborhoodId: string
): Promise<boolean> {
  const neighborhood = await prisma.neighborhood.findUnique({
    where: { id: neighborhoodId },
    select: { metadata: true },
  });

  const metadata = neighborhood?.metadata as any;
  return metadata?.requireGpsForCheckIn ?? false;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert degrees to radians
 */
function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Validate if coordinates are valid
 *
 * @param coord - Coordinates to validate
 * @returns true if valid, false otherwise
 */
export function isValidCoordinate(coord: Coordinates): boolean {
  if (!coord || typeof coord.latitude !== 'number' || typeof coord.longitude !== 'number') {
    return false;
  }

  // Check latitude range (-90 to 90)
  if (coord.latitude < -90 || coord.latitude > 90) {
    return false;
  }

  // Check longitude range (-180 to 180)
  if (coord.longitude < -180 || coord.longitude > 180) {
    return false;
  }

  return true;
}

/**
 * Validate if coordinates are within Israel bounds
 *
 * @param coord - Coordinates to validate
 * @returns true if within Israel, false otherwise
 */
export function isWithinIsraelBounds(coord: Coordinates): boolean {
  if (!isValidCoordinate(coord)) {
    return false;
  }

  return (
    coord.latitude >= ISRAEL_BOUNDS.minLatitude &&
    coord.latitude <= ISRAEL_BOUNDS.maxLatitude &&
    coord.longitude >= ISRAEL_BOUNDS.minLongitude &&
    coord.longitude <= ISRAEL_BOUNDS.maxLongitude
  );
}

/**
 * Format distance for display
 *
 * @param meters - Distance in meters
 * @returns Formatted string (e.g., "1.2 km" or "120 m")
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Calculate bearing (direction) between two points
 *
 * @param from - Starting coordinates
 * @param to - Ending coordinates
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(from: Coordinates, to: Coordinates): number {
  const lat1 = degreesToRadians(from.latitude);
  const lat2 = degreesToRadians(to.latitude);
  const deltaLon = degreesToRadians(to.longitude - from.longitude);

  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
           Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

  const bearing = Math.atan2(y, x);
  return (radiansToDegrees(bearing) + 360) % 360;
}

/**
 * Get compass direction from bearing
 *
 * @param bearing - Bearing in degrees (0-360)
 * @returns Compass direction (N, NE, E, SE, S, SW, W, NW)
 */
export function getCompassDirection(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Find all neighborhoods within a certain distance from a location
 *
 * @param location - User's current location
 * @param maxDistance - Maximum distance in meters
 * @param cityId - Optional city ID to filter
 * @returns Array of neighborhoods with distance
 */
export async function findNearbyNeighborhoods(
  location: Coordinates,
  maxDistance: number = 5000,
  cityId?: string
) {
  // Get all neighborhoods with GPS coordinates
  const neighborhoods = await prisma.neighborhood.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      isActive: true,
      ...(cityId ? { cityId } : {}),
    },
    select: {
      id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
      cityRelation: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Calculate distances and filter
  const neighborhoodsWithDistance = neighborhoods
    .map((neighborhood) => {
      const distance = calculateDistance(location, {
        latitude: neighborhood.latitude!,
        longitude: neighborhood.longitude!,
      });

      return {
        ...neighborhood,
        distance,
      };
    })
    .filter((n) => n.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);

  return neighborhoodsWithDistance;
}

/**
 * Detect if GPS coordinates look suspicious (potential spoofing)
 *
 * @param location - GPS coordinates to check
 * @param previousLocation - Previous GPS coordinates (optional)
 * @returns Suspicious flags and reasons
 */
export function detectSuspiciousGPS(
  location: Coordinates & { timestamp?: Date; accuracy?: number },
  previousLocation?: Coordinates & { timestamp?: Date }
): {
  isSuspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  // Check if coordinates are too precise (common spoofing pattern)
  if (location.latitude % 1 === 0 || location.longitude % 1 === 0) {
    reasons.push('Coordinates are exactly on integer values (unusual)');
  }

  // Check if accuracy is unusually good (< 5m often indicates spoofing)
  if (location.accuracy && location.accuracy < 5) {
    reasons.push('GPS accuracy is unusually high (< 5m)');
  }

  // Check if not within Israel bounds
  if (!isWithinIsraelBounds(location)) {
    reasons.push('Location is outside of Israel');
  }

  // Check for teleportation (if previous location exists)
  if (previousLocation && previousLocation.timestamp && location.timestamp) {
    const distance = calculateDistance(location, previousLocation);
    const timeElapsedSeconds =
      (location.timestamp.getTime() - previousLocation.timestamp.getTime()) / 1000;

    // Calculate speed in km/h
    const speedKmH = (distance / 1000) / (timeElapsedSeconds / 3600);

    // Flag if speed > 200 km/h (impossible without aircraft)
    if (speedKmH > 200) {
      reasons.push(`Impossible travel speed: ${speedKmH.toFixed(0)} km/h`);
    }
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
  };
}

// ============================================
// EXPORTS
// ============================================

export const Geofencing = {
  calculateDistance,
  validateGeofence,
  getNeighborhoodGeofenceConfig,
  isGPSRequiredForNeighborhood,
  findNearbyNeighborhoods,
  detectSuspiciousGPS,
  isValidCoordinate,
  isWithinIsraelBounds,
  formatDistance,
  calculateBearing,
  getCompassDirection,
  DEFAULT_CONFIG: DEFAULT_GEOFENCE_CONFIG,
};
