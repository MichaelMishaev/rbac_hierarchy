/**
 * Visibility Rules with Open/Closed Principle
 *
 * SOLID Principles:
 * - Open/Closed: New rules can be added WITHOUT modifying existing ones
 * - Single Responsibility: Each rule checks ONE visibility condition
 * - Liskov Substitution: All rules implement the same interface
 *
 * Rules are executed in priority order (highest first)
 */

import type { Voter, UserContext, VisibilityResult } from '../core/types';

/**
 * Base interface for all visibility rules (OCP + LSP)
 */
export interface VisibilityRule {
  /**
   * Unique name for debugging and logging
   */
  readonly name: string;

  /**
   * Priority (higher = executed first)
   * 1 = SuperAdmin (always execute first)
   * 2 = Direct inserter
   * 3 = Hierarchical rules
   */
  readonly priority: number;

  /**
   * Check if viewer can see the voter
   * Returns null if rule doesn't apply, VisibilityResult if it does
   */
  canSee(viewer: UserContext, voter: Voter): Promise<VisibilityResult | null>;
}

// ============================================
// PRIORITY 1: SUPERADMIN RULE
// ============================================

/**
 * Rule: SuperAdmin can see ALL voters
 */
export class SuperAdminVisibilityRule implements VisibilityRule {
  readonly name = 'SuperAdminRule';
  readonly priority = 1;

  async canSee(viewer: UserContext, voter: Voter): Promise<VisibilityResult | null> {
    if (viewer.role === 'SUPERADMIN') {
      return {
        canSee: true,
        reason: 'SuperAdmin has full system access',
        ruleName: this.name,
      };
    }
    return null; // Rule doesn't apply
  }
}

// ============================================
// PRIORITY 2: DIRECT INSERTER RULE
// ============================================

/**
 * Rule: User can see voters they inserted themselves
 */
export class DirectInserterVisibilityRule implements VisibilityRule {
  readonly name = 'DirectInserterRule';
  readonly priority = 2;

  async canSee(viewer: UserContext, voter: Voter): Promise<VisibilityResult | null> {
    if (voter.insertedByUserId === viewer.userId) {
      return {
        canSee: true,
        reason: 'User inserted this voter',
        ruleName: this.name,
      };
    }
    return null;
  }
}

// ============================================
// PRIORITY 3: HIERARCHICAL RULES
// ============================================

/**
 * Rule: Area Manager can see voters inserted by:
 * - City Coordinators in their area
 * - Activist Coordinators in their area
 * - Themselves
 */
export class AreaManagerVisibilityRule implements VisibilityRule {
  readonly name = 'AreaManagerRule';
  readonly priority = 3;

  constructor(
    private getUserHierarchy: (userId: string) => Promise<{
      role: string;
      areaManagerId?: string;
      cityId?: string;
    } | null>
  ) {}

  async canSee(viewer: UserContext, voter: Voter): Promise<VisibilityResult | null> {
    if (viewer.role !== 'AREA_MANAGER') {
      return null; // Rule doesn't apply
    }

    // Get the hierarchy of the person who inserted the voter
    const inserterHierarchy = await this.getUserHierarchy(voter.insertedByUserId);
    if (!inserterHierarchy) {
      return { canSee: false, reason: 'Inserter not found', ruleName: this.name };
    }

    // Area Manager can see voters inserted by anyone in their area
    if (inserterHierarchy.areaManagerId === viewer.areaManagerId) {
      return {
        canSee: true,
        reason: 'Voter inserted by someone in your area',
        ruleName: this.name,
      };
    }

    return { canSee: false, reason: 'Voter not in your area', ruleName: this.name };
  }
}

/**
 * Rule: City Coordinator can see voters inserted by:
 * - Activist Coordinators in their city
 * - Themselves
 */
export class CityCoordinatorVisibilityRule implements VisibilityRule {
  readonly name = 'CityCoordinatorRule';
  readonly priority = 3;

  constructor(
    private getUserHierarchy: (userId: string) => Promise<{
      role: string;
      cityId?: string;
    } | null>
  ) {}

  async canSee(viewer: UserContext, voter: Voter): Promise<VisibilityResult | null> {
    if (viewer.role !== 'CITY_COORDINATOR') {
      return null; // Rule doesn't apply
    }

    // Get the hierarchy of the person who inserted the voter
    const inserterHierarchy = await this.getUserHierarchy(voter.insertedByUserId);
    if (!inserterHierarchy) {
      return { canSee: false, reason: 'Inserter not found', ruleName: this.name };
    }

    // City Coordinator can see voters inserted by anyone in their city
    if (inserterHierarchy.cityId === viewer.cityId) {
      return {
        canSee: true,
        reason: 'Voter inserted by someone in your city',
        ruleName: this.name,
      };
    }

    return { canSee: false, reason: 'Voter not in your city', ruleName: this.name };
  }
}

/**
 * Rule: Activist Coordinator can see voters inserted by:
 * - Themselves
 * - Activists they supervise (via activistCoordinator relation)
 */
export class ActivistCoordinatorVisibilityRule implements VisibilityRule {
  readonly name = 'ActivistCoordinatorRule';
  readonly priority = 3;

  constructor(
    private getUserHierarchy: (userId: string) => Promise<{
      role: string;
      areaManagerId?: string;
      cityId?: string;
      activistCoordinatorId?: string;
    } | null>
  ) {}

  async canSee(viewer: UserContext, voter: Voter): Promise<VisibilityResult | null> {
    if (viewer.role !== 'ACTIVIST_COORDINATOR') {
      return null; // Rule doesn't apply
    }

    // 1. Can see voters they inserted themselves
    if (voter.insertedByUserId === viewer.userId) {
      return {
        canSee: true,
        reason: 'You inserted this voter',
        ruleName: this.name,
      };
    }

    // 2. Can see voters inserted by activists they supervise
    const inserterHierarchy = await this.getUserHierarchy(voter.insertedByUserId);
    if (!inserterHierarchy) {
      return { canSee: false, reason: 'Inserter not found', ruleName: this.name };
    }

    // Check if inserter is an ACTIVIST supervised by this coordinator
    if (inserterHierarchy.role === 'ACTIVIST' && inserterHierarchy.activistCoordinatorId) {
      // Compare coordinator IDs
      if (inserterHierarchy.activistCoordinatorId === viewer.activistCoordinatorId) {
        return {
          canSee: true,
          reason: 'Voter inserted by activist under your supervision',
          ruleName: this.name,
        };
      }
    }

    return {
      canSee: false,
      reason: 'Voter not in your supervision chain',
      ruleName: this.name,
    };
  }
}

// ============================================
// FUTURE EXTENSIBILITY (OCP in action)
// ============================================

/**
 * Example: Election Day rule (can be added later without modifying existing rules)
 * On election day, City Coordinators can see ALL voters in their city
 */
export class ElectionDayVisibilityRule implements VisibilityRule {
  readonly name = 'ElectionDayRule';
  readonly priority = 0; // Lower priority, only applies on special day

  private isElectionDay(): boolean {
    const today = new Date();
    // Example: April 10, 2025
    return today.getDate() === 10 && today.getMonth() === 3 && today.getFullYear() === 2025;
  }

  async canSee(viewer: UserContext, voter: Voter): Promise<VisibilityResult | null> {
    if (!this.isElectionDay()) {
      return null; // Rule doesn't apply
    }

    if (viewer.role === 'CITY_COORDINATOR' && voter.insertedByCityName === viewer.cityId) {
      return {
        canSee: true,
        reason: 'Election Day: City Coordinators can see all city voters',
        ruleName: this.name,
      };
    }

    return null;
  }
}

// ============================================
// RULE ENGINE
// ============================================

/**
 * Visibility Engine that applies rules in priority order (OCP + Strategy Pattern)
 */
export class VoterVisibilityEngine {
  private rules: VisibilityRule[] = [];

  constructor(rules: VisibilityRule[]) {
    // Sort rules by priority (highest first)
    this.rules = rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check if viewer can see voter by applying rules in priority order
   * Returns as soon as a rule gives a definitive answer
   */
  async canSee(viewer: UserContext, voter: Voter): Promise<VisibilityResult> {
    for (const rule of this.rules) {
      const result = await rule.canSee(viewer, voter);

      if (result !== null) {
        // Rule gave a definitive answer
        return result;
      }
    }

    // No rule allowed visibility
    return {
      canSee: false,
      reason: 'No visibility rule matched',
      ruleName: 'DefaultDeny',
    };
  }

  /**
   * Add a new rule dynamically (OCP: extend without modifying)
   */
  addRule(rule: VisibilityRule): void {
    this.rules.push(rule);
    // Re-sort by priority
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove a rule by name
   */
  removeRule(name: string): void {
    this.rules = this.rules.filter((r) => r.name !== name);
  }
}

// ============================================
// DEFAULT RULE SET
// ============================================

/**
 * Factory function to create default visibility engine with standard rules
 */
export async function createDefaultVisibilityEngine(
  getUserHierarchy: (userId: string) => Promise<{
    role: string;
    areaManagerId?: string;
    cityId?: string;
    activistCoordinatorId?: string;
  } | null>
): Promise<VoterVisibilityEngine> {
  const rules: VisibilityRule[] = [
    new SuperAdminVisibilityRule(),
    new DirectInserterVisibilityRule(),
    new AreaManagerVisibilityRule(getUserHierarchy),
    new CityCoordinatorVisibilityRule(getUserHierarchy),
    new ActivistCoordinatorVisibilityRule(getUserHierarchy),
    // Future: new ElectionDayVisibilityRule(),
  ];

  return new VoterVisibilityEngine(rules);
}
