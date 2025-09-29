/* eslint-disable no-console */
/**
 * Example: Complete session management with JWT and automatic refresh
 * Demonstrates secure session handling with token refresh
 * Note: Console statements are used for demonstration purposes
 */
import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  getSessionManager,
  withSession,
  requireAuth,
  requireRole,
  getSessionWithRefresh,
  autoRefreshSession,
  getBackgroundRefreshManager,
  Session,
} from '../index';
import { GitHub } from '../providers';

// ============================================================================
// Configuration with JWT Session Strategy (Example)
// ============================================================================

/**
 * Example NextAirAuth configuration with JWT sessions:
 *
 * const config = NextAirAuth({
 *   providers: [
 *     GitHub({
 *       clientId: process.env.GITHUB_CLIENT_ID!,
 *       clientSecret: process.env.GITHUB_CLIENT_SECRET!,
 *     }),
 *   ],
 *   session: {
 *     strategy: 'jwt',
 *     maxAge: 30 * 24 * 60 * 60, // 30 days
 *   },
 *   jwt: {
 *     secret: process.env.NEXTAUTH_SECRET!,
 *     maxAge: 30 * 24 * 60 * 60,
 *   },
 *   callbacks: {
 *     jwt: async ({ token, user, account }) => {
 *       if (user) {
 *         token.role = user.role || 'user'
 *       }
 *       return token
 *     },
 *     session: async ({ session, token }) => {
 *       session.user.role = token.role || 'user'
 *       return session
 *     },
 *   },
 * })
 */

// ============================================================================
// App Router Examples
// ============================================================================

/**
 * Example: Protected API route with automatic session loading
 */
export async function protectedApiRoute(request: NextRequest) {
  return withSession(request, async authRequest => {
    if (!authRequest.auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { user } = authRequest.auth;

    return NextResponse.json({
      message: 'Protected data',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      sessionExpires: authRequest.auth.expires,
    });
  });
}

/**
 * Example: Admin-only route with role checking
 */
export async function adminOnlyRoute(request: NextRequest) {
  return requireRole(request, 'admin', async (authRequest, session) => {
    return NextResponse.json({
      message: 'Admin-only data',
      user: session.user,
      adminFeatures: ['user-management', 'system-settings'],
    });
  });
}

/**
 * Example: Route with automatic token refresh
 */
export async function routeWithRefresh(request: NextRequest) {
  const githubProvider = GitHub({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  });

  return withSession(request, async authRequest => {
    if (!authRequest.auth) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // Automatically refresh tokens if needed
    const refreshedSession = await getSessionWithRefresh(authRequest, githubProvider);

    const session = refreshedSession || authRequest.auth;

    return NextResponse.json({
      message: 'Data with fresh tokens',
      user: session.user,
      hasValidTokens: !!session.accessToken,
      tokenRefreshed: refreshedSession !== authRequest.auth,
    });
  });
}

// ============================================================================
// Pages Router Examples
// ============================================================================

/**
 * Example: Pages Router API with session
 */
export function createPagesApiHandler() {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    const sessionManager = getSessionManager();

    try {
      const session = await sessionManager.getSession(req);

      if (!session) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if session needs refresh
      const githubProvider = GitHub({
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      });

      const refreshedSession = await autoRefreshSession(session, githubProvider);
      const currentSession = refreshedSession || session;

      res.json({
        user: currentSession.user,
        sessionExpires: currentSession.expires,
        tokenRefreshed: refreshedSession !== session,
      });
    } catch (error) {
      res.status(500).json({ error: 'Session error' });
    }
  };
}

// ============================================================================
// Session Management Examples
// ============================================================================

/**
 * Example: Manual session operations
 */
export class SessionOperations {
  private sessionManager = getSessionManager();

  /**
   * Create new session after OAuth login
   */
  async createUserSession(
    user: { id: string; name?: string; email?: string; [key: string]: unknown },
    account: { provider: string; providerAccountId: string; [key: string]: unknown },
    response: NextResponse
  ) {
    try {
      const session = await this.sessionManager.createSession(user, account, response);

      console.log('✅ Session created:', {
        userId: session.user.id,
        expires: session.expires,
        hasTokens: !!(session.accessToken && session.refreshToken),
      });

      return session;
    } catch (error) {
      console.error('❌ Session creation failed:', error);
      throw error;
    }
  }

  /**
   * Update session with new data
   */
  async updateUserSession(
    request: NextRequest,
    response: NextResponse,
    updates: Record<string, unknown>
  ) {
    try {
      const currentSession = await this.sessionManager.getSession(request);
      if (!currentSession) {
        throw new Error('No active session');
      }

      const updatedSession = await this.sessionManager.updateSession(
        currentSession,
        updates,
        response
      );

      console.log('✅ Session updated:', {
        userId: updatedSession.user.id,
        changes: Object.keys(updates),
      });

      return updatedSession;
    } catch (error) {
      console.error('❌ Session update failed:', error);
      throw error;
    }
  }

  /**
   * Sign out and destroy session
   */
  async signOut(request: NextRequest, response: NextResponse) {
    try {
      await this.sessionManager.deleteSession(request, response);

      console.log('✅ Session destroyed');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  }
}

// ============================================================================
// Background Token Refresh Example
// ============================================================================

/**
 * Example: Set up background token refresh
 */
export function setupBackgroundRefresh() {
  const backgroundManager = getBackgroundRefreshManager();

  // Enable background refresh
  backgroundManager.setEnabled(true);

  const githubProvider = GitHub({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  });

  // Example: Start background refresh for a user session
  function startUserBackgroundRefresh(sessionId: string, session: Session) {
    backgroundManager.startBackgroundRefresh(
      sessionId,
      session,
      githubProvider,
      refreshedSession => {
        console.log('🔄 Background refresh completed:', {
          userId: refreshedSession.user.id,
          newExpiry: refreshedSession.expires,
        });

        // Here you could update the session in your storage
        // or notify the client about the refresh
      }
    );
  }

  // Clean up on app shutdown
  process.on('SIGTERM', () => {
    backgroundManager.stopAll();
  });

  return { startUserBackgroundRefresh };
}

// ============================================================================
// Session Debugging and Monitoring
// ============================================================================

/**
 * Example: Session debugging endpoint
 */
export async function sessionDebugRoute(request: NextRequest) {
  const sessionManager = getSessionManager();

  try {
    const session = await sessionManager.getSession(request);

    if (!session) {
      return NextResponse.json({
        hasSession: false,
        message: 'No active session',
      });
    }

    const now = Date.now();
    const expiresAt = new Date(session.expires).getTime();
    const timeUntilExpiry = Math.max(0, expiresAt - now);
    const isExpired = timeUntilExpiry === 0;

    return NextResponse.json({
      hasSession: true,
      isExpired,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      session: {
        expires: session.expires,
        timeUntilExpiry: Math.floor(timeUntilExpiry / 1000), // seconds
        hasAccessToken: !!session.accessToken,
        hasRefreshToken: !!session.refreshToken,
        hasError: !!session.error,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        hasSession: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Complete Session Flow Example
// ============================================================================

/**
 * Example: Complete authentication flow with session management
 */
export class CompleteAuthFlow {
  private sessionManager = getSessionManager();
  private sessionOps = new SessionOperations();

  /**
   * Handle OAuth callback and create session
   */
  async handleCallback(code: string, state: string, response: NextResponse) {
    try {
      // Complete OAuth flow (from previous examples)
      const { completeOAuthFlow } = await import('../oauth');
      const githubProvider = GitHub({
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      });

      const result = await completeOAuthFlow(
        githubProvider,
        code,
        state,
        'https://myapp.com/api/auth/callback/github'
      );

      // Create session with OAuth tokens
      const user: {
        [key: string]: unknown;
        id: string;
        name?: string;
        email?: string;
      } = {
        id: result.user.id,
        ...(result.user.name && { name: result.user.name }),
        ...(result.user.email && { email: result.user.email }),
      };
      const session = await this.sessionOps.createUserSession(
        user,
        {
          provider: 'github',
          providerAccountId: result.user.id,
          access_token: result.tokens.access_token,
          refresh_token: result.tokens.refresh_token,
        },
        response
      );

      // Set up background refresh
      const { startUserBackgroundRefresh } = setupBackgroundRefresh();
      startUserBackgroundRefresh(session.user.id, session);

      return {
        success: true,
        user: session.user,
        redirectUrl: '/',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        redirectUrl: '/auth/error',
      };
    }
  }

  /**
   * Handle protected route access
   */
  async handleProtectedRoute(request: NextRequest) {
    return requireAuth(request, async (authRequest, session) => {
      // Automatically refresh tokens if needed
      const githubProvider = GitHub({
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      });

      const refreshedSession = await getSessionWithRefresh(authRequest, githubProvider);

      const currentSession = refreshedSession || session;

      return NextResponse.json({
        message: 'Welcome to protected area',
        user: currentSession.user,
        sessionInfo: {
          expires: currentSession.expires,
          hasValidTokens: !!currentSession.accessToken,
          wasRefreshed: refreshedSession !== session,
        },
      });
    });
  }
}

export const authFlowExample = new CompleteAuthFlow();
