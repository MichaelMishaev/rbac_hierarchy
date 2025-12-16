/**
 * Geocoding utility for converting city/neighborhood names to coordinates
 * Uses Nominatim (OpenStreetMap's free geocoding API)
 */

interface GeocodingResult {
  lat: number;
  lon: number;
  display_name: string;
}

interface CachedCoordinate {
  latitude: number;
  longitude: number;
}

// In-memory cache to avoid redundant API calls
const geocodeCache = new Map<string, CachedCoordinate>();

/**
 * Geocode a location name to coordinates using Nominatim API
 * @param locationName - City or neighborhood name (e.g., "תל אביב" or "פלורנטין, תל אביב")
 * @param country - Country code (default: "IL" for Israel)
 * @returns Coordinates or null if geocoding fails
 */
export async function geocodeLocation(
  locationName: string,
  country: string = 'IL'
): Promise<CachedCoordinate | null> {
  const cacheKey = `${locationName}_${country}`;

  // Check cache first
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    // Nominatim API expects queries in format: "location, country"
    const query = encodeURIComponent(`${locationName}, ${country}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&accept-language=he`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ElectionCampaignManagementSystem/1.0', // Required by Nominatim
      },
    });

    if (!response.ok) {
      console.warn(`[Geocoding] Failed to geocode "${locationName}": HTTP ${response.status}`);
      return null;
    }

    const results: GeocodingResult[] = await response.json();

    if (results.length === 0) {
      console.warn(`[Geocoding] No results for "${locationName}"`);
      return null;
    }

    const coords = {
      latitude: results[0].lat,
      longitude: results[0].lon,
    };

    // Cache the result
    geocodeCache.set(cacheKey, coords);

    return coords;
  } catch (error) {
    console.error(`[Geocoding] Error geocoding "${locationName}":`, error);
    return null;
  }
}

/**
 * Calculate center point (centroid) from multiple coordinates
 * Used for area managers (center of their cities)
 */
export function calculateCentroid(
  coordinates: Array<{ latitude: number; longitude: number }>
): { latitude: number; longitude: number } | null {
  if (coordinates.length === 0) return null;

  const sum = coordinates.reduce(
    (acc, coord) => ({
      latitude: acc.latitude + coord.latitude,
      longitude: acc.longitude + coord.longitude,
    }),
    { latitude: 0, longitude: 0 }
  );

  return {
    latitude: sum.latitude / coordinates.length,
    longitude: sum.longitude / coordinates.length,
  };
}

/**
 * Offset coordinates slightly to avoid overlapping markers
 * Used when multiple entities share the same location
 */
export function offsetCoordinates(
  baseCoords: { latitude: number; longitude: number },
  offsetIndex: number,
  radiusKm: number = 0.5
): { latitude: number; longitude: number } {
  // Convert km to degrees (approximate, works for Israel)
  const offsetDegrees = radiusKm / 111; // 111 km ≈ 1 degree

  // Distribute offsets in a circle pattern
  const angle = (offsetIndex * 2 * Math.PI) / 8; // 8 positions around circle

  return {
    latitude: baseCoords.latitude + offsetDegrees * Math.cos(angle),
    longitude: baseCoords.longitude + offsetDegrees * Math.sin(angle),
  };
}

/**
 * Get default coordinates for Israel (fallback) - LAND center, not sea
 */
export function getIsraelCenter(): { latitude: number; longitude: number } {
  return {
    latitude: 31.7683, // Jerusalem area (safe land coordinates)
    longitude: 35.2137,
  };
}

/**
 * Validate coordinates are within Israel land boundaries (not sea)
 * Rough bounding box for Israel land area
 */
export function isValidIsraelCoordinate(
  coords: { latitude: number; longitude: number }
): boolean {
  const { latitude, longitude } = coords;

  // Israel land boundaries (approximate)
  const MIN_LAT = 29.5; // Southern border (Eilat)
  const MAX_LAT = 33.3; // Northern border (Metula)
  const MIN_LON = 34.3; // Western coast (adjusted to exclude sea)
  const MAX_LON = 35.9; // Eastern border (Golan Heights)

  // Check if within bounding box
  if (
    latitude < MIN_LAT ||
    latitude > MAX_LAT ||
    longitude < MIN_LON ||
    longitude > MAX_LON
  ) {
    return false;
  }

  // Additional check: exclude Mediterranean Sea area
  // If too far west (close to sea), likely invalid
  if (longitude < 34.5 && latitude > 31.5 && latitude < 33.0) {
    return false; // Likely in the sea (Tel Aviv coast area)
  }

  return true;
}

/**
 * Get safe fallback coordinates for a city
 * Uses known city centers for major Israeli cities
 */
export function getCityFallbackCoordinates(cityName: string): {
  latitude: number;
  longitude: number;
} {
  const cityCenters: Record<string, { latitude: number; longitude: number }> = {
    'תל אביב': { latitude: 32.0853, longitude: 34.7818 },
    'tel aviv': { latitude: 32.0853, longitude: 34.7818 },
    'תל אביב-יפו': { latitude: 32.0853, longitude: 34.7818 },

    'ירושלים': { latitude: 31.7683, longitude: 35.2137 },
    'jerusalem': { latitude: 31.7683, longitude: 35.2137 },

    'חיפה': { latitude: 32.7940, longitude: 34.9896 },
    'haifa': { latitude: 32.7940, longitude: 34.9896 },

    'באר שבע': { latitude: 31.2518, longitude: 34.7913 },
    'beer sheva': { latitude: 31.2518, longitude: 34.7913 },

    'רמת גן': { latitude: 32.0809, longitude: 34.8237 },
    'ramat gan': { latitude: 32.0809, longitude: 34.8237 },

    'פתח תקווה': { latitude: 32.0853, longitude: 34.8878 },
    'petah tikva': { latitude: 32.0853, longitude: 34.8878 },

    'נתניה': { latitude: 32.3215, longitude: 34.8532 },
    'netanya': { latitude: 32.3215, longitude: 34.8532 },
  };

  const normalized = cityName.toLowerCase().trim();
  return cityCenters[normalized] || getIsraelCenter();
}
