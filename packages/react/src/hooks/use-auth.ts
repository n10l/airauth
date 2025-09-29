'use client';

/**
 * useAuth hook for authentication actions
 */

import { useCallback } from 'react';
import { useSessionContext } from '../providers/session-provider';
import type { UseAuthReturn, SignInOptions, SignOutOptions } from '../types';

/**
 * Hook for authentication actions
 *
 * @example
 * ```tsx
 * import { useAuth } from '@airauth/react'
 *
 * export function LoginButton() {
 *   const { signIn, signOut, isAuthenticated, isLoading } = useAuth()
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   if (isAuthenticated) {
 *     return <button onClick={() => signOut()}>Sign Out</button>
 *   }
 *
 *   return <button onClick={() => signIn('github')}>Sign In with GitHub</button>
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const { session, status, update } = useSessionContext();

  /**
   * Sign in with provider
   */
  const signIn = useCallback(async (provider: string, options?: SignInOptions): Promise<void> => {
    const { callbackUrl = window.location.href, redirect = true, ...credentials } = options || {};

    try {
      const params = new URLSearchParams({
        callbackUrl,
      });

      if (provider === 'credentials') {
        // Handle credentials sign-in
        const response = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider,
            credentials,
          }),
        });

        if (!response.ok) {
          throw new Error('Sign in failed');
        }

        if (redirect) {
          window.location.href = callbackUrl;
        }
      } else {
        // OAuth sign-in
        if (redirect) {
          window.location.href = `/api/auth/signin/${provider}?${params.toString()}`;
        } else {
          // Open in popup window for non-redirect flow
          const width = 500;
          const height = 600;
          const left = window.screenX + (window.outerWidth - width) / 2;
          const top = window.screenY + (window.outerHeight - height) / 2;

          window.open(
            `/api/auth/signin/${provider}?${params.toString()}`,
            'Sign In',
            `width=${width},height=${height},left=${left},top=${top}`
          );
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }, []);

  /**
   * Sign out
   */
  const signOut = useCallback(async (options?: SignOutOptions): Promise<void> => {
    const { callbackUrl = '/', redirect = true } = options || {};

    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ callbackUrl }),
      });

      if (!response.ok) {
        throw new Error('Sign out failed');
      }

      if (redirect) {
        window.location.href = callbackUrl;
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, []);

  return {
    user: session?.user || null,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    signIn,
    signOut,
    update,
  };
}
