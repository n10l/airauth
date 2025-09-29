'use client';

/**
 * useSession hook for accessing authentication session
 */

import { useEffect } from 'react';
import { useSessionContext } from '../providers/session-provider';
import type { UseSessionOptions, UseSessionReturn } from '../types';

/**
 * Hook to access the current session
 *
 * @example
 * ```tsx
 * import { useSession } from '@airauth/react'
 *
 * export function Profile() {
 *   const { data: session, status } = useSession()
 *
 *   if (status === 'loading') return <div>Loading...</div>
 *   if (status === 'unauthenticated') return <div>Not logged in</div>
 *
 *   return <div>Welcome {session?.user?.name}</div>
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With required session (redirects if not authenticated)
 * const { data: session } = useSession({
 *   required: true,
 *   onUnauthenticated() {
 *     router.push('/login')
 *   }
 * })
 * ```
 */
export function useSession<R extends boolean = false>(
  options?: UseSessionOptions & { required?: R }
): UseSessionReturn<R> {
  const { session, status, update } = useSessionContext();

  const {
    required = false,
    onUnauthenticated,
    refetchInterval,
    refetchOnWindowFocus,
  } = options || {};

  // Handle required session
  useEffect(() => {
    if (required && status === 'unauthenticated' && onUnauthenticated) {
      onUnauthenticated();
    }
  }, [required, status, onUnauthenticated]);

  // Type assertion for required sessions
  if (required) {
    return {
      data: session,
      status: status === 'unauthenticated' ? 'loading' : status,
      update,
    } as UseSessionReturn<R>;
  }

  return {
    data: session,
    status,
    update,
  } as UseSessionReturn<R>;
}
