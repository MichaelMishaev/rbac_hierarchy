import { z } from 'zod';
import { wikiCache } from './cache/wiki-cache';

/**
 * Server Action Wrapper - Enforces best practices for server actions
 *
 * Features:
 * - Automatic Zod validation
 * - Cache invalidation after mutations
 * - Error handling and logging
 * - Type-safe input/output
 *
 * @example
 * ```typescript
 * const updateWikiPage = createServerAction(
 *   z.object({ pageId: z.string(), content: z.string() }),
 *   async ({ pageId, content }) => {
 *     await prisma.wikiPage.update({ where: { id: pageId }, data: { content } });
 *     return { success: true };
 *   },
 *   { invalidate: [/^wiki:categories/, /^wiki:popular/] }
 * );
 * ```
 */

export type ServerActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type CacheConfig = {
  /**
   * Cache key patterns to invalidate after successful action
   * Uses regex patterns to match cache keys
   */
  invalidate?: RegExp[];

  /**
   * Whether to log errors to console (default: true)
   * Set to false for expected errors (e.g., validation failures)
   */
  logErrors?: boolean;
};

/**
 * Creates a type-safe server action with automatic validation and cache invalidation
 *
 * @param schema - Zod schema for input validation
 * @param handler - Async function to execute (receives validated input)
 * @param cacheConfig - Optional cache invalidation configuration
 * @returns Server action function with standardized error handling
 */
export function createServerAction<TInput, TOutput>(
  schema: z.Schema<TInput>,
  handler: (input: TInput) => Promise<TOutput>,
  cacheConfig?: CacheConfig
) {
  return async (input: unknown): Promise<ServerActionResult<TOutput>> => {
    try {
      // 1. Validate input with Zod
      const validatedInput = schema.parse(input);

      // 2. Execute handler with validated input
      const result = await handler(validatedInput);

      // 3. Invalidate caches after successful mutation
      if (cacheConfig?.invalidate) {
        for (const pattern of cacheConfig.invalidate) {
          wikiCache.invalidatePattern(pattern);
        }
      }

      return { success: true, data: result };
    } catch (error) {
      // Log errors unless explicitly disabled
      if (cacheConfig?.logErrors !== false) {
        console.error('[ServerAction] Error:', error);
      }

      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
        };
      }

      // Handle generic errors
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  };
}

/**
 * Creates a server action without input validation (for actions with no parameters)
 *
 * @example
 * ```typescript
 * const getWikiStats = createServerActionNoInput(
 *   async () => {
 *     const count = await prisma.wikiPage.count();
 *     return { count };
 *   }
 * );
 * ```
 */
export function createServerActionNoInput<TOutput>(
  handler: () => Promise<TOutput>,
  cacheConfig?: CacheConfig
) {
  return createServerAction(z.void(), handler, cacheConfig);
}
