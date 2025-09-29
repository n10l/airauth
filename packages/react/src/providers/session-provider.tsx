'use client';

/**
 * Session Provider for React context
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { Session } from '@airauth/core';
import type { SessionProviderProps, SessionContextValue } from '../types';

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

/**
 * Session Provider component
 * Wraps your app and provides session context
 *
 * @example
 * ```tsx
 * // app/layout.tsx or _app.tsx
 * import { SessionProvider } from '@airauth/react'
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <SessionProvider>
 *       {children}
 *     </SessionProvider>
 *   )
 * }
 * ```
 */
export function SessionProvider({
  children,
  session: initialSession,
  refetchInterval = 0,
  refetchOnWindowFocus = true,
  refetchWhenOffline = false,
  onSessionChange,
}: SessionProviderProps) {
  const [session, setSession] = useState<Session | null | undefined>(initialSession);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>(
    initialSession === undefined ? 'loading' : initialSession ? 'authenticated' : 'unauthenticated'
  );

  const intervalRef = useRef<NodeJS.Timeout>();
  const visibilityHandlerRef = useRef<() => void>();

  /**
   * Fetch session from API
   */
  const fetchSession = useCallback(async (): Promise<Session | null> => {
    try {
      console.log('[SessionProvider] Fetching session...');
      const response = await fetch('/api/auth/session');

      if (!response.ok) {
        console.error('[SessionProvider] Failed to fetch session:', response.status);
        throw new Error('Failed to fetch session');
      }

      const data = await response.json();
      console.log('[SessionProvider] Session data received:', data);
      const newSession = data as Session | null;

      setSession(newSession);
      setStatus(newSession ? 'authenticated' : 'unauthenticated');

      if (onSessionChange) {
        onSessionChange(newSession);
      }

      return newSession;
    } catch (error) {
      console.error('Session fetch error:', error);
      setSession(null);
      setStatus('unauthenticated');

      if (onSessionChange) {
        onSessionChange(null);
      }

      return null;
    }
  }, [onSessionChange]);

  /**
   * Update session data
   */
  const update = useCallback(
    async (data?: Partial<Session>): Promise<Session | null> => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data || {}),
        });

        if (!response.ok) {
          throw new Error('Failed to update session');
        }

        const updatedSession = (await response.json()) as Session | null;

        setSession(updatedSession);
        setStatus(updatedSession ? 'authenticated' : 'unauthenticated');

        if (onSessionChange) {
          onSessionChange(updatedSession);
        }

        return updatedSession;
      } catch (error) {
        console.error('Session update error:', error);
        return null;
      }
    },
    [onSessionChange]
  );

  /**
   * Initial session fetch
   */
  useEffect(() => {
    console.log('[SessionProvider] Mount effect - initialSession:', initialSession);
    if (initialSession === undefined) {
      console.log('[SessionProvider] Fetching initial session...');
      fetchSession();
    }
  }, [fetchSession]);

  /**
   * Refetch interval
   */
  useEffect(() => {
    if (refetchInterval > 0) {
      intervalRef.current = setInterval(() => {
        if (!refetchWhenOffline && !navigator.onLine) {
          return;
        }
        fetchSession();
      }, refetchInterval * 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, refetchWhenOffline, fetchSession]);

  /**
   * Refetch on window focus
   */
  useEffect(() => {
    if (refetchOnWindowFocus) {
      visibilityHandlerRef.current = () => {
        if (document.visibilityState === 'visible') {
          fetchSession();
        }
      };

      document.addEventListener('visibilitychange', visibilityHandlerRef.current);

      return () => {
        if (visibilityHandlerRef.current) {
          document.removeEventListener('visibilitychange', visibilityHandlerRef.current);
        }
      };
    }
  }, [refetchOnWindowFocus, fetchSession]);

  const value: SessionContextValue = {
    session,
    status,
    update,
    refetch: fetchSession,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/**
 * Hook to access session context
 * Must be used within SessionProvider
 */
export function useSessionContext(): SessionContextValue {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }

  return context;
}
