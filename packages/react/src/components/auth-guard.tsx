'use client';

/**
 * Auth Guard component for protecting content
 */

import React, { useEffect } from 'react';
import { useSession } from '../hooks/use-session';
import { useRouter } from 'next/navigation';
import type { AuthGuardProps } from '../types';

/**
 * Auth Guard component to protect content
 *
 * @example
 * ```tsx
 * import { AuthGuard } from '@airauth/react'
 *
 * // Basic usage
 * <AuthGuard>
 *   <ProtectedContent />
 * </AuthGuard>
 *
 * // With role requirement
 * <AuthGuard requiredRole="admin">
 *   <AdminPanel />
 * </AuthGuard>
 *
 * // With custom fallback
 * <AuthGuard
 *   fallback={<div>Please login to continue</div>}
 *   loadingComponent={<Spinner />}
 * >
 *   <ProtectedContent />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({
  children,
  fallback = null,
  loadingComponent = <div>Loading...</div>,
  requiredRole,
  redirectTo = '/auth/signin',
  onUnauthenticated,
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      if (onUnauthenticated) {
        onUnauthenticated();
      } else if (redirectTo) {
        router.push(redirectTo);
      }
    }
  }, [status, redirectTo, onUnauthenticated, router]);

  // Loading state
  if (status === 'loading') {
    return <>{loadingComponent}</>;
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return <>{fallback}</>;
  }

  // Check role if required
  if (requiredRole && session?.user) {
    const userRole = (session.user as any).role;

    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(userRole)) {
        return <>{fallback || <div>Insufficient permissions</div>}</>;
      }
    } else if (userRole !== requiredRole) {
      return <>{fallback || <div>Insufficient permissions</div>}</>;
    }
  }

  // Authenticated and authorized
  return <>{children}</>;
}
