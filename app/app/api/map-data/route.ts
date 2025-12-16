import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, getUserCorporations } from '@/lib/auth';
import {
  geocodeLocation,
  calculateCentroid,
  offsetCoordinates,
  getIsraelCenter,
  isValidIsraelCoordinate,
  getCityFallbackCoordinates,
} from '@/lib/geocoding';

export async function GET(_request: Request) {
  try {
    let user;
    try {
      user = await getCurrentUser();
    } catch (authError) {
      console.error('[Map Data API] Authentication error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Please log in again' },
        { status: 401 }
      );
    }

    const userCorps = getUserCorporations(user);

    // Debug logging for Area Manager filtering
    console.log('[Map API] User role:', user.role);
    console.log('[Map API] User corporations filter:', userCorps);
    if (user.role === 'AREA_MANAGER') {
      console.log('[Map API] Area Manager cities:', user.areaManager?.cities.map(c => c.name));
    }

    // Fetch all entities based on user permissions
    const [sites, corporations, areaManagers, managers, supervisors, workers] = await Promise.all([
      // Sites with GPS coordinates
      prisma.neighborhood.findMany({
        where: userCorps === 'all' ? {} : { cityId: { in: userCorps } },
        include: {
          cityRelation: {
            select: {
              id: true,
              name: true,
            },
          },
          activists: {
            select: {
              id: true,
              fullName: true,
              isActive: true,
            },
          },
          activistCoordinatorAssignments: {
            include: {
              activistCoordinator: {
                include: {
                  user: {
                    select: {
                      id: true,
                      fullName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),

      // Corporations
      prisma.city.findMany({
        where: userCorps === 'all' ? {} : { id: { in: userCorps } },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          _count: {
            select: {
              neighborhoods: true,
              coordinators: true,
              activistCoordinators: true,
            },
          },
        },
      }),

      // Area Managers (SuperAdmin only - Area Managers should NOT see other Area Managers)
      user.isSuperAdmin
        ? prisma.areaManager.findMany({
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                },
              },
              cities: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          })
        : [], // Empty array for non-SuperAdmin (including Area Managers)

      // City Coordinators
      prisma.cityCoordinator.findMany({
        where: userCorps === 'all' ? {} : { cityId: { in: userCorps } },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          city: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      // Activist Coordinators
      prisma.activistCoordinator.findMany({
        where: userCorps === 'all' ? {} : { cityId: { in: userCorps } },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          city: {
            select: {
              id: true,
              name: true,
            },
          },
          neighborhoodAssignments: {
            include: {
              neighborhood: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  latitude: true,
                  longitude: true,
                  cityRelation: true,
                },
              },
            },
          },
        },
      }),

      // Workers summary (count only, not individual records for performance)
      prisma.activist.groupBy({
        by: ['neighborhoodId', 'isActive'],
        where: {
          neighborhood: userCorps === 'all' ? {} : { cityId: { in: userCorps } },
        },
        _count: true,
      }),
    ]);

    // Step 1: Geocode cities (for city coordinators positioning)
    const cityCoordsMap = new Map<string, { latitude: number; longitude: number }>();

    for (const city of corporations) {
      let coords = await geocodeLocation(city.name, 'IL');

      // Validate coordinates are not in the sea
      if (coords && !isValidIsraelCoordinate(coords)) {
        console.warn(
          `[Map API] Invalid coordinates for city "${city.name}": ${coords.latitude}, ${coords.longitude} (likely in sea)`
        );
        coords = null; // Force fallback
      }

      // Fallback to known city centers
      if (!coords) {
        coords = getCityFallbackCoordinates(city.name);
        console.log(`[Map API] Using fallback coordinates for city "${city.name}"`);
      }

      cityCoordsMap.set(city.id, coords);
    }

    // Step 2: Geocode neighborhoods (if they don't have coordinates)
    const neighborhoodCoordsMap = new Map<string, { latitude: number; longitude: number }>();

    for (const site of sites) {
      let coords: { latitude: number; longitude: number } | null = null;

      // Check existing coordinates
      if (site.latitude && site.longitude) {
        const existingCoords = {
          latitude: site.latitude,
          longitude: site.longitude,
        };

        // Validate existing coordinates
        if (isValidIsraelCoordinate(existingCoords)) {
          coords = existingCoords;
        } else {
          console.warn(
            `[Map API] Invalid existing coordinates for neighborhood "${site.name}": ${site.latitude}, ${site.longitude} (likely in sea)`
          );
        }
      }

      // Geocode if no valid coords yet
      if (!coords) {
        const geocoded = await geocodeLocation(`${site.name}, ${site.cityRelation.name}`, 'IL');

        if (geocoded && isValidIsraelCoordinate(geocoded)) {
          coords = geocoded;
        } else if (geocoded) {
          console.warn(
            `[Map API] Invalid geocoded coordinates for neighborhood "${site.name}": ${geocoded.latitude}, ${geocoded.longitude} (likely in sea)`
          );
        }
      }

      // Fallback to city center with offset
      if (!coords) {
        const cityCoords = cityCoordsMap.get(site.cityId);
        if (cityCoords) {
          const offsetIndex = Array.from(neighborhoodCoordsMap.values()).filter(
            (c) => c.latitude === cityCoords.latitude && c.longitude === cityCoords.longitude
          ).length;
          coords = offsetCoordinates(cityCoords, offsetIndex, 1);
          console.log(
            `[Map API] Using city center offset for neighborhood "${site.name}" (offset ${offsetIndex})`
          );
        }
      }

      if (coords) {
        neighborhoodCoordsMap.set(site.id, coords);
      }
    }

    // Step 3: Format neighborhoods for map
    const formattedSites = sites
      .map((site) => {
        const coords = neighborhoodCoordsMap.get(site.id);
        if (!coords) return null;

        const activeCount = site.activists.filter((a) => a.isActive).length;
        const inactiveCount = site.activists.filter((a) => !a.isActive).length;

        return {
          id: site.id,
          name: site.name,
          address: site.address,
          country: site.country,
          latitude: coords.latitude,
          longitude: coords.longitude,
          phone: site.phone,
          email: site.email,
          isActive: site.isActive,
          city: site.cityRelation,
          activists: {
            active: activeCount,
            inactive: inactiveCount,
            total: site.activists.length,
          },
          activistCoordinators: site.activistCoordinatorAssignments.map((sa: any) => ({
            id: sa.activistCoordinator.id,
            name: sa.activistCoordinator.user?.fullName || 'N/A',
            email: sa.activistCoordinator.user?.email || 'N/A',
          })),
        };
      })
      .filter(Boolean);

    // Step 4: Format city coordinators with city center coordinates
    console.log(`[Map API] Formatting ${managers.length} city coordinators`);
    console.log('[Map API] City coordinator city IDs:', managers.map(m => `${m.city.name} (${m.cityId})`));

    const formattedManagers = managers
      .map((manager) => {
        // Skip if user data is missing
        if (!manager.user) {
          console.warn(`[Map API] Skipping city coordinator ${manager.id} - missing user data`);
          return null;
        }

        const cityCoords = cityCoordsMap.get(manager.cityId);
        // Validate city coordinates before using (could be in sea)
        if (!cityCoords || !isValidIsraelCoordinate(cityCoords)) {
          console.warn(`[Map API] Invalid or missing city coordinates for manager ${manager.id} in city ${manager.cityId}`);
          return null;
        }

        // Offset slightly to avoid overlap with neighborhoods
        const offsetIndex = managers.filter((m) => m.cityId === manager.cityId).indexOf(manager);

        return {
          id: manager.id,
          userId: manager.userId,
          fullName: manager.user.fullName,
          email: manager.user.email,
          phone: manager.user.phone,
          city: manager.city,
          latitude: Number(cityCoords.latitude),
          longitude: Number(cityCoords.longitude) + offsetIndex * 0.01, // Small offset
          type: 'city_coordinator' as const,
        };
      })
      .filter(Boolean);

    console.log(`[Map API] Formatted ${formattedManagers.length} city coordinators for response`);

    // Step 5: Format activist coordinators with neighborhood coordinates
    const formattedActivistCoordinators = supervisors
      .map((supervisor) => {
        // Skip if user data is missing
        if (!supervisor.user) {
          console.warn(`[Map API] Skipping activist coordinator ${supervisor.id} - missing user data`);
          return null;
        }

        const neighborhoods = supervisor.neighborhoodAssignments.map((na) => na.neighborhood);

        // Use first assigned neighborhood's coordinates, or city center
        let coords: { latitude: number; longitude: number } | null = null;

        if (neighborhoods.length > 0) {
          const firstNeighborhood = neighborhoods[0];
          coords = firstNeighborhood ? neighborhoodCoordsMap.get(firstNeighborhood.id) || null : null;
        }

        if (!coords) {
          // Fallback to city center with offset
          const cityCoords = cityCoordsMap.get(supervisor.cityId);
          // Validate city coordinates before using (could be in sea)
          if (cityCoords && isValidIsraelCoordinate(cityCoords)) {
            coords = cityCoords;
          }
        }

        if (!coords) return null;

        // Offset to avoid overlap with city coordinators
        const offsetIndex = supervisors.filter((s) => s.cityId === supervisor.cityId).indexOf(supervisor);

        return {
          id: supervisor.id,
          userId: supervisor.userId,
          fullName: supervisor.user.fullName,
          email: supervisor.user.email,
          phone: supervisor.user.phone,
          city: supervisor.city,
          neighborhoods: neighborhoods.map((n) => ({ id: n.id, name: n.name, address: n.address })),
          latitude: Number(coords.latitude) + offsetIndex * 0.008,
          longitude: Number(coords.longitude) - offsetIndex * 0.008,
          type: 'activist_coordinator' as const,
        };
      })
      .filter(Boolean);

    // Step 6: Format area managers with centroid of their cities
    const formattedAreaManagers = areaManagers
      .map((areaManager) => {
        const cityCoords = areaManager.cities
          .map((city) => cityCoordsMap.get(city.id))
          .filter(Boolean) as Array<{ latitude: number; longitude: number }>;

        const centroid = calculateCentroid(cityCoords) || getIsraelCenter();

        return {
          id: areaManager.id,
          userId: areaManager.userId,
          fullName: areaManager.user?.fullName || 'Unknown',
          email: areaManager.user?.email || '',
          phone: areaManager.user?.phone || null,
          cities: areaManager.cities,
          latitude: centroid.latitude,
          longitude: centroid.longitude,
          type: 'area_manager' as const,
        };
      })
      .filter(Boolean);

    // Calculate stats
    const stats = {
      totalSites: sites.length,
      activeSites: sites.filter((s) => s.isActive).length,
      totalCorporations: corporations.length,
      activeCorporations: corporations.filter((c) => c.isActive).length,
      totalManagers: managers.length,
      totalSupervisors: supervisors.length,
      totalAreaManagers: areaManagers.length,
      totalWorkers: workers.reduce((sum, group) => sum + group._count, 0),
      activeWorkers: workers
        .filter((group) => group.isActive)
        .reduce((sum, group) => sum + group._count, 0),
    };

    return NextResponse.json({
      neighborhoods: formattedSites,
      cities: corporations,
      areaManagers: formattedAreaManagers,
      managers: formattedManagers,
      activistCoordinators: formattedActivistCoordinators,
      stats,
      user: {
        id: user.id,
        name: user.fullName,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
      },
    });
  } catch (error) {
    console.error('Error fetching map data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch map data' },
      { status: 500 }
    );
  }
}
