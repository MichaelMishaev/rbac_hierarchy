/**
 * Smart Task Assignment Algorithm
 * Suggests optimal activists for task assignments based on:
 * - Geographic proximity to task location
 * - Current workload
 * - Recent activity/availability
 * - Skills/tags match (future)
 */

import { prisma } from './prisma';

export interface AssignmentCandidate {
  activistId: string;
  activistName: string;
  neighborhoodName: string;
  score: number;
  distance: number; // in meters
  currentLoad: number; // number of active tasks
  isAvailable: boolean; // currently checked in
}

export interface TaskLocation {
  lat: number;
  lng: number;
}

/**
 * Suggest best activists for a task based on multiple factors
 */
export async function suggestTaskAssignments(
  taskLocation: TaskLocation,
  neighborhoodId: string,
  count: number = 5
): Promise<AssignmentCandidate[]> {
  const activists = await prisma.activist.findMany({
    where: {
      neighborhoodId,
      isActive: true,
    },
    include: {
      neighborhood: {
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
        },
      },
      attendanceRecords: {
        where: { status: 'PRESENT' },
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  const candidates: AssignmentCandidate[] = [];

  for (const activist of activists) {
    // Calculate distance from task location to activist's neighborhood
    let distance = 0;
    let proximityScore = 0.5; // Default score

    if (activist.neighborhood?.latitude && activist.neighborhood?.longitude) {
      const neighborhoodLocation = {
        lat: activist.neighborhood.latitude,
        lng: activist.neighborhood.longitude,
      };
      distance = calculateDistance(taskLocation, neighborhoodLocation);

      // Proximity scoring (closer = better)
      // 0-500m: 1.0, 500m-1km: 0.8, 1-2km: 0.6, 2-5km: 0.4, >5km: 0.2
      if (distance <= 500) {
        proximityScore = 1.0;
      } else if (distance <= 1000) {
        proximityScore = 0.8;
      } else if (distance <= 2000) {
        proximityScore = 0.6;
      } else if (distance <= 5000) {
        proximityScore = 0.4;
      } else {
        proximityScore = 0.2;
      }
    }

    // Workload score
    // Note: Currently activists don't have direct task assignments in the schema
    // TaskAssignments are linked to Users (coordinators), not Activists
    // Future enhancement: Add task-activist relationship for direct workload tracking
    const workloadScore = 0.7; // Default good score (assume low workload)
    const currentLoad = 0; // No direct task counting available yet

    // Availability score (currently checked in = higher score)
    const isAvailable = activist.attendanceRecords.length > 0;
    const availabilityScore = isAvailable ? 1 : 0.3;

    // Weighted total score
    // Proximity: 50% (most important for field work)
    // Availability: 40% (critical to have someone ready)
    // Workload: 10% (less important since we can't track it yet)
    const score = (proximityScore * 0.5) + (availabilityScore * 0.4) + (workloadScore * 0.1);

    candidates.push({
      activistId: activist.id,
      activistName: activist.fullName,
      neighborhoodName: activist.neighborhood?.name || 'Unknown',
      score,
      distance: Math.round(distance),
      currentLoad,
      isAvailable,
    });
  }

  // Sort by score (highest first) and return top N
  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = point1.lat * Math.PI / 180;
  const φ2 = point2.lat * Math.PI / 180;
  const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
  const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Optimize route for multiple task locations (TSP approximation)
 * Uses nearest neighbor algorithm
 */
export function optimizeTaskRoute(
  locations: Array<{ id: string; lat: number; lng: number }>,
  startLocation: { lat: number; lng: number }
): string[] {
  if (locations.length === 0) return [];
  if (locations.length === 1) return [locations[0].id];

  const visited = new Set<string>();
  const route: string[] = [];
  let currentLocation = startLocation;

  while (visited.size < locations.length) {
    let nearestLocation = null;
    let minDistance = Infinity;

    for (const location of locations) {
      if (visited.has(location.id)) continue;

      const distance = calculateDistance(currentLocation, location);
      if (distance < minDistance) {
        minDistance = distance;
        nearestLocation = location;
      }
    }

    if (nearestLocation) {
      route.push(nearestLocation.id);
      visited.add(nearestLocation.id);
      currentLocation = nearestLocation;
    }
  }

  return route;
}
