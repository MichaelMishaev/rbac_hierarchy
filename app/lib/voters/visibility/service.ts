/**
 * Visibility Service - Main entry point for checking voter visibility
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles visibility checks
 * - Dependency Inversion: Depends on abstractions (VisibilityRule interface)
 */

import { PrismaClient } from '@prisma/client';
import type { Voter, UserContext, VisibilityResult } from '../core/types';
import { createDefaultVisibilityEngine, VoterVisibilityEngine } from './rules';

/**
 * User hierarchy information needed for visibility checks
 */
interface UserHierarchyInfo {
  role: string;
  areaManagerId?: string;
  cityId?: string;
  activistCoordinatorId?: string;
}

/**
 * Service for checking voter visibility based on organizational hierarchy
 */
export class VoterVisibilityService {
  private engine?: VoterVisibilityEngine;

  constructor(private prisma: PrismaClient) {}

  /**
   * Initialize the visibility engine (lazy initialization)
   */
  private async getEngine(): Promise<VoterVisibilityEngine> {
    if (!this.engine) {
      this.engine = await createDefaultVisibilityEngine(
        this.getUserHierarchy.bind(this)
      );
    }
    return this.engine;
  }

  /**
   * Get user hierarchy information for visibility checks
   */
  private async getUserHierarchy(userId: string): Promise<UserHierarchyInfo | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        areaManager: {
          select: { id: true },
        },
        coordinatorOf: {
          select: { id: true, cityId: true },
        },
        activistCoordinatorOf: {
          select: { id: true, cityId: true },
        },
        activistProfile: {
          select: {
            activistCoordinatorId: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      role: user.role,
      areaManagerId: user.areaManager?.id,
      cityId: user.coordinatorOf?.[0]?.cityId || user.activistCoordinatorOf?.[0]?.cityId,
      activistCoordinatorId: user.activistProfile?.activistCoordinatorId || undefined,
    };
  }

  /**
   * Check if a viewer can see a specific voter
   */
  async canSeeVoter(viewer: UserContext, voter: Voter): Promise<VisibilityResult> {
    const engine = await this.getEngine();
    return engine.canSee(viewer, voter);
  }

  /**
   * Filter a list of voters to only those the viewer can see
   */
  async filterVisibleVoters(
    viewer: UserContext,
    voters: Voter[]
  ): Promise<Voter[]> {
    const engine = await this.getEngine();
    const results = await Promise.all(
      voters.map(async (voter) => ({
        voter,
        result: await engine.canSee(viewer, voter),
      }))
    );

    return results.filter((r) => r.result.canSee).map((r) => r.voter);
  }

  /**
   * Get visibility filter for Prisma queries (optimization)
   * Instead of fetching all and filtering, build the WHERE clause
   */
  getVisibilityFilter(viewer: UserContext): Record<string, unknown> {
    // SuperAdmin sees all
    if (viewer.role === 'SUPERADMIN') {
      return {};
    }

    // Build OR conditions for upward visibility chain
    const orConditions: Record<string, unknown>[] = [];

    // User can see voters they inserted
    orConditions.push({ insertedByUserId: viewer.userId });

    // Area Manager can see voters inserted by anyone in their area
    if (viewer.role === 'AREA_MANAGER' && viewer.areaManagerId) {
      orConditions.push({
        insertedBy: {
          OR: [
            // City Coordinators in their area
            {
              coordinatorOf: {
                some: {
                  city: {
                    areaManagerId: viewer.areaManagerId,
                  },
                },
              },
            },
            // Activist Coordinators in their area
            {
              activistCoordinatorOf: {
                some: {
                  city: {
                    areaManagerId: viewer.areaManagerId,
                  },
                },
              },
            },
          ],
        },
      });
    }

    // City Coordinator can see voters inserted by activist coordinators in their city
    if (viewer.role === 'CITY_COORDINATOR' && viewer.cityId) {
      orConditions.push({
        insertedBy: {
          activistCoordinatorOf: {
            some: {
              cityId: viewer.cityId,
            },
          },
        },
      });
    }

    // Activist Coordinator can see voters inserted by:
    // 1. Themselves (already in orConditions)
    // 2. Activists they supervise
    if (viewer.role === 'ACTIVIST_COORDINATOR' && viewer.activistCoordinatorId) {
      orConditions.push({
        insertedBy: {
          activistProfile: {
            activistCoordinatorId: viewer.activistCoordinatorId,
          },
        },
      });
    }

    return orConditions.length > 0 ? { OR: orConditions } : { insertedByUserId: viewer.userId };
  }
}
