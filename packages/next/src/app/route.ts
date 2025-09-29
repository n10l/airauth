/**
 * App Router Route Handler for Next.js 13+
 * Usage: app/api/auth/[...nextauth]/route.ts
 */

import { NextAirAuth } from '../index';
import type { NextAirAuthOptions } from '../index';

/**
 * Create route handlers for App Router
 *
 * @example
 * ```ts
 * // app/api/auth/[...nextauth]/route.ts
 * import { handlers } from '@/auth'
 *
 * export const { GET, POST } = handlers
 * ```
 */
export function createAppRouteHandlers(options: NextAirAuthOptions) {
  const { handlers } = NextAirAuth(options);

  return {
    GET: handlers.GET,
    POST: handlers.POST,
  };
}

/**
 * Helper to create auth configuration for App Router
 */
export function createAuthConfig(options: NextAirAuthOptions) {
  return NextAirAuth(options);
}
