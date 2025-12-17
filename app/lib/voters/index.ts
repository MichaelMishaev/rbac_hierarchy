/**
 * Voter Management System - Main Entry Point
 *
 * SOLID Architecture with complete separation of concerns:
 * - Core: Types, invariants, domain models
 * - Visibility: OCP-based visibility rules
 * - Repository: LSP-compliant data access (Prisma ↔ InMemory)
 * - Actions: DIP-based server actions
 */

// Core exports
export * from './core/types';
export * from './core/invariants';

// Visibility exports
export * from './visibility/rules';
export * from './visibility/service';

// Repository exports
export * from './repository/interfaces';
export * from './repository/prisma-repository';
export * from './repository/in-memory-repository';

// Server actions exports
export * from './actions/voter-actions';
export * from './actions/repository-factory';
export * from './actions/context';
