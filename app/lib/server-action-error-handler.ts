/**
 * Global Error Handler for Server Actions
 *
 * Wraps server actions with automatic error logging to database.
 * Catches all errors, logs them to error_logs table, then re-throws for client handling.
 *
 * Usage:
 *
 * import { withServerActionErrorHandler } from '@/lib/server-action-error-handler';
 *
 * export async function myAction(data: SomeInput) {
 *   return withServerActionErrorHandler(async () => {
 *     // Your action logic here
 *     return { success: true };
 *   }, 'myAction');
 * }
 */

import { logger, extractSessionContext } from './logger';
import { auth } from './auth';

/**
 * Wrap server action with error handler
 *
 * @param action - The async function containing your server action logic
 * @param actionName - Name of the action for logging (e.g., 'createUser', 'updateCity')
 * @returns The result of the action, or throws the error after logging
 */
export async function withServerActionErrorHandler<T>(
  action: () => Promise<T>,
  actionName: string
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    const session = await auth();
    const err = error instanceof Error ? error : new Error(String(error));

    // Log to database with session context
    logger.error(`Server action failed: ${actionName}`, err, {
      ...extractSessionContext(session),
      metadata: {
        actionName,
        source: 'server_action',
      },
    });

    // Re-throw for client handling (preserves existing error handling behavior)
    throw err;
  }
}
