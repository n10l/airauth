'use client';

/**
 * Sign Out component
 */

import React from 'react';
import { useAuth } from '../hooks/use-auth';
import type { SignOutProps } from '../types';

/**
 * Sign Out button component
 *
 * @example
 * ```tsx
 * import { SignOut } from '@airauth/react'
 *
 * // Basic usage
 * <SignOut />
 *
 * // With custom callback URL
 * <SignOut callbackUrl="/goodbye" />
 *
 * // Custom children
 * <SignOut>
 *   <span>Logout</span>
 * </SignOut>
 * ```
 */
export function SignOut({
  callbackUrl = '/',
  className = '',
  children,
  onSuccess,
  onError,
}: SignOutProps) {
  const { signOut, isAuthenticated } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl });
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
    }
  };

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <button className={className} onClick={handleSignOut} type='button'>
      {children || 'Sign out'}
    </button>
  );
}
