/**
 * Type definitions for @airauth/react
 */

import type { Session, User } from '@airauth/core';
import type { ReactNode } from 'react';

// ============================================================================
// Provider Types
// ============================================================================

export interface SessionProviderProps {
  children: ReactNode;
  session?: Session | null;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
  refetchWhenOffline?: boolean;
  onSessionChange?: (session: Session | null) => void;
}

export interface SessionContextValue {
  session: Session | null | undefined;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  update: (data?: Partial<Session>) => Promise<Session | null>;
  refetch: () => Promise<Session | null>;
}

// ============================================================================
// Hook Types
// ============================================================================

export interface UseSessionOptions {
  required?: boolean;
  onUnauthenticated?: () => void;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
}

export interface UseSessionReturn<R extends boolean = false> {
  data: R extends true ? Session : Session | null;
  status: R extends true
    ? 'authenticated' | 'loading'
    : 'authenticated' | 'unauthenticated' | 'loading';
  update: (data?: Partial<Session>) => Promise<Session | null>;
}

export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (provider: string, options?: SignInOptions) => Promise<void>;
  signOut: (options?: SignOutOptions) => Promise<void>;
  update: (data?: Partial<Session>) => Promise<Session | null>;
}

export interface SignInOptions {
  callbackUrl?: string;
  redirect?: boolean;
  email?: string;
  password?: string;
  [key: string]: any;
}

export interface SignOutOptions {
  callbackUrl?: string;
  redirect?: boolean;
}

// ============================================================================
// Component Types
// ============================================================================

export interface SignInProps {
  provider?: string;
  providers?: string[];
  callbackUrl?: string;
  className?: string;
  children?: ReactNode;
  onSuccess?: (session: Session) => void;
  onError?: (error: Error) => void;
}

export interface SignOutProps {
  callbackUrl?: string;
  className?: string;
  children?: ReactNode;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
  requiredRole?: string | string[];
  redirectTo?: string;
  onUnauthenticated?: () => void;
}
