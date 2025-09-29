/* eslint-disable no-console */
/**
 * Session middleware for automatic session management
 * Handles session loading, refresh, and cleanup
 */
import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest, NextApiResponse } from 'next';
import { Session, AuthRequest, AuthApiRequest } from '../types';
import { getSessionManager, shouldRefreshSession, isSessionExpired } from './index';
import { getConfig } from '../core';

// ============================================================================
// Session Middleware for App Router
// ============================================================================

/**
 * Middleware to automatically load and refresh sessions
 */
export async function withSession(
  request: NextRequest,
  handler: (request: AuthRequest) => Promise<NextResponse> | NextResponse
): Promise<NextResponse> {
  const sessionManager = getSessionManager();
  const config = getConfig();

  // Load session
  let session: Session | null = null;
  try {
    session = await sessionManager.getSession(request);
  } catch (error) {
    if (config.debug) {
      console.warn('[NextAirAuth] Session loading failed:', error);
    }
  }

  // Check if session is expired
  if (session && isSessionExpired(session)) {
    session = null;
  }

  // Create authenticated request
  const authRequest = request as AuthRequest;
  authRequest.auth = session;

  // Execute handler
  const response = await handler(authRequest);

  // Handle session refresh if needed
  if (session && shouldRefreshSession(session, config.session?.updateAge)) {
    try {
      const refreshedSession = await sessionManager.refreshSession(session);
      if (refreshedSession) {
        await sessionManager.updateSession(session, refreshedSession, response);
      }
    } catch (error) {
      if (config.debug) {
        console.warn('[NextAirAuth] Session refresh failed:', error);
      }
    }
  }

  return response;
}

// ============================================================================
// Session Middleware for Pages Router
// ============================================================================

/**
 * Middleware for Pages Router API routes
 */
export async function withApiSession(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: (req: AuthApiRequest, res: NextApiResponse) => Promise<void> | void
): Promise<void> {
  const sessionManager = getSessionManager();
  const config = getConfig();

  // Load session
  let session: Session | null = null;
  try {
    session = await sessionManager.getSession(req);
  } catch (error) {
    if (config.debug) {
      console.warn('[NextAirAuth] Session loading failed:', error);
    }
  }

  // Check if session is expired
  if (session && isSessionExpired(session)) {
    session = null;
  }

  // Create authenticated request
  const authRequest = req as AuthApiRequest;
  authRequest.auth = session;

  // Execute handler
  await handler(authRequest, res);

  // Handle session refresh if needed
  if (session && shouldRefreshSession(session, config.session?.updateAge)) {
    try {
      const refreshedSession = await sessionManager.refreshSession(session);
      if (refreshedSession) {
        await sessionManager.updateSession(session, refreshedSession, res);
      }
    } catch (error) {
      if (config.debug) {
        console.warn('[NextAirAuth] Session refresh failed:', error);
      }
    }
  }
}

// ============================================================================
// Session Loading Utilities
// ============================================================================

/**
 * Get session from request (App Router)
 */
export async function getSession(request: NextRequest): Promise<Session | null> {
  const sessionManager = getSessionManager();

  try {
    const session = await sessionManager.getSession(request);

    if (session && isSessionExpired(session)) {
      return null;
    }

    return session;
  } catch (error) {
    return null;
  }
}

/**
 * Get session from API request (Pages Router)
 */
export async function getApiSession(req: NextApiRequest): Promise<Session | null> {
  const sessionManager = getSessionManager();

  try {
    const session = await sessionManager.getSession(req);

    if (session && isSessionExpired(session)) {
      return null;
    }

    return session;
  } catch (error) {
    return null;
  }
}

// ============================================================================
// Session Update Utilities
// ============================================================================

/**
 * Update session (App Router)
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse,
  update: Partial<Session>
): Promise<Session | null> {
  const sessionManager = getSessionManager();

  try {
    const currentSession = await sessionManager.getSession(request);
    if (!currentSession) return null;

    return await sessionManager.updateSession(currentSession, update, response);
  } catch (error) {
    return null;
  }
}

/**
 * Update API session (Pages Router)
 */
export async function updateApiSession(
  req: NextApiRequest,
  res: NextApiResponse,
  update: Partial<Session>
): Promise<Session | null> {
  const sessionManager = getSessionManager();

  try {
    const currentSession = await sessionManager.getSession(req);
    if (!currentSession) return null;

    return await sessionManager.updateSession(currentSession, update, res);
  } catch (error) {
    return null;
  }
}

// ============================================================================
// Session Destruction
// ============================================================================

/**
 * Sign out and destroy session (App Router)
 */
export async function signOut(request: NextRequest, response: NextResponse): Promise<void> {
  const sessionManager = getSessionManager();

  try {
    await sessionManager.deleteSession(request, response);
  } catch (error) {
    const config = getConfig();
    if (config.debug) {
      console.warn('[NextAirAuth] Session deletion failed:', error);
    }
  }
}

/**
 * Sign out and destroy API session (Pages Router)
 */
export async function signOutApi(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const sessionManager = getSessionManager();

  try {
    await sessionManager.deleteSession(req, res);
  } catch (error) {
    const config = getConfig();
    if (config.debug) {
      console.warn('[NextAirAuth] Session deletion failed:', error);
    }
  }
}

// ============================================================================
// Session Validation
// ============================================================================

/**
 * Require authenticated session (App Router)
 */
export async function requireAuth(
  request: NextRequest,
  handler: (request: AuthRequest, session: Session) => Promise<NextResponse> | NextResponse
): Promise<NextResponse> {
  return withSession(request, async authRequest => {
    if (!authRequest.auth) {
      const config = getConfig();
      const signInUrl = config.pages?.signIn || '/auth/signin';
      const callbackUrl = encodeURIComponent(request.url);

      return NextResponse.redirect(new URL(`${signInUrl}?callbackUrl=${callbackUrl}`, request.url));
    }

    return handler(authRequest, authRequest.auth);
  });
}

/**
 * Require authenticated session (Pages Router)
 */
export async function requireApiAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: (req: AuthApiRequest, res: NextApiResponse, session: Session) => Promise<void> | void
): Promise<void> {
  return withApiSession(req, res, async (authRequest, response) => {
    if (!authRequest.auth) {
      response.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHENTICATED',
      });
      return;
    }

    return handler(authRequest, response, authRequest.auth);
  });
}

// ============================================================================
// Role-based Access Control
// ============================================================================

/**
 * Require specific role (App Router)
 */
export async function requireRole(
  request: NextRequest,
  requiredRole: string | string[],
  handler: (request: AuthRequest, session: Session) => Promise<NextResponse> | NextResponse
): Promise<NextResponse> {
  return requireAuth(request, async (authRequest, session) => {
    const userRole = session.user.role;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!userRole || !roles.includes(userRole)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    return handler(authRequest, session);
  });
}

/**
 * Require specific role (Pages Router)
 */
export async function requireApiRole(
  req: NextApiRequest,
  res: NextApiResponse,
  requiredRole: string | string[],
  handler: (req: AuthApiRequest, res: NextApiResponse, session: Session) => Promise<void> | void
): Promise<void> {
  return requireApiAuth(req, res, async (authRequest, response, session) => {
    const userRole = session.user.role;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!userRole || !roles.includes(userRole)) {
      response.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        requiredRole: roles,
        userRole,
      });
      return;
    }

    return handler(authRequest, response, session);
  });
}

// ============================================================================
// Session Debugging
// ============================================================================

/**
 * Debug session information
 */
export async function debugSession(request: NextRequest | NextApiRequest): Promise<{
  hasSession: boolean;
  isExpired: boolean;
  shouldRefresh: boolean;
  user?: { id: string; name?: string; email?: string; [key: string]: unknown };
  expiresAt?: string;
  timeUntilExpiry?: number;
  error?: string;
}> {
  const sessionManager = getSessionManager();
  const config = getConfig();

  try {
    const session = await sessionManager.getSession(request);

    if (!session) {
      return { hasSession: false, isExpired: false, shouldRefresh: false };
    }

    const expired = isSessionExpired(session);
    const shouldRefresh = shouldRefreshSession(session, config.session?.updateAge);
    const expiresAt = session.expires;
    const timeUntilExpiry = expiresAt
      ? Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
      : 0;

    return {
      hasSession: true,
      isExpired: expired,
      shouldRefresh,
      user: (() => {
        const user: {
          [key: string]: unknown;
          id: string;
          name?: string;
          email?: string;
        } = {
          id: session.user.id,
        };

        if (session.user.name) {
          user.name = session.user.name;
        }

        if (session.user.email) {
          user.email = session.user.email;
        }

        return user;
      })(),
      expiresAt,
      timeUntilExpiry,
    };
  } catch (error) {
    return {
      hasSession: false,
      isExpired: false,
      shouldRefresh: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
