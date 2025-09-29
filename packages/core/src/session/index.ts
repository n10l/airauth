/**
 * Session management system with JWT and database strategies
 * Handles session creation, validation, refresh, and cleanup
 */
import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest, NextApiResponse } from 'next';
import { Session, User, JWT, Adapter, NextAirAuthError } from '../types';
import { encodeJWT, decodeJWT, generateSessionToken, addTime, isExpired } from '../security';
import { getSessionCookie, setSessionCookie, deleteSessionCookie } from '../security/cookies';
import { getConfig } from '../core';

// ============================================================================
// Session Strategy Interface
// ============================================================================

export interface SessionStrategy {
  createSession(
    user: User,
    account?: { provider: string; providerAccountId: string; [key: string]: unknown }
  ): Promise<Session>;
  getSession(request: NextRequest | NextApiRequest): Promise<Session | null>;
  updateSession(session: Session, update: Partial<Session>): Promise<Session>;
  deleteSession(
    request: NextRequest | NextApiRequest,
    response: NextResponse | NextApiResponse
  ): Promise<void>;
  refreshSession?(session: Session): Promise<Session>;
}

// ============================================================================
// JWT Session Strategy
// ============================================================================

export class JWTSessionStrategy implements SessionStrategy {
  private secret: string;
  private maxAge: number;
  private updateAge: number;

  constructor(options: { secret: string; maxAge?: number; updateAge?: number }) {
    this.secret = options.secret;
    this.maxAge = options.maxAge || 30 * 24 * 60 * 60; // 30 days
    this.updateAge = options.updateAge || 24 * 60 * 60; // 24 hours
  }

  async createSession(
    user: User,
    account?: { provider: string; providerAccountId: string; [key: string]: unknown }
  ): Promise<Session> {
    const now = Math.floor(Date.now() / 1000);
    const expires = now + this.maxAge;

    const jwtPayload: JWT = {
      sub: user.id,
      name: user.name ?? null,
      email: user.email ?? null,
      picture: user.image ?? null,
      iat: now,
      exp: expires,
      // Include account tokens if available
      ...(account?.access_token ? { accessToken: account.access_token } : {}),
      ...(account?.refresh_token ? { refreshToken: account.refresh_token } : {}),
    };

    if (user.role) {
      jwtPayload.role = user.role;
    }

    const _token = await encodeJWT({
      // TODO: Store or return the encoded JWT
      token: jwtPayload,
      secret: this.secret,
      maxAge: this.maxAge,
    });
    void _token; // Intentionally unused - placeholder for future JWT storage

    const session: Session = {
      user,
      expires: new Date(expires * 1000).toISOString(),
    };

    if (typeof account?.access_token === 'string') {
      session.accessToken = account.access_token;
    }

    if (typeof account?.refresh_token === 'string') {
      session.refreshToken = account.refresh_token;
    }

    return session;
  }

  async getSession(request: NextRequest | NextApiRequest): Promise<Session | null> {
    const sessionToken = getSessionCookie(request);
    if (!sessionToken) return null;

    try {
      const jwt = await decodeJWT({
        token: sessionToken,
        secret: this.secret,
      });

      if (!jwt || !jwt.sub) return null;

      // Check if token is expired
      if (jwt.exp && jwt.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      const user: User = {
        id: jwt.sub,
        name: jwt.name || null,
        email: jwt.email || null,
        image: jwt.picture || null,
        ...(jwt.role && { role: jwt.role }),
      };

      const session: Session = {
        user,
        expires: new Date(jwt.exp! * 1000).toISOString(),
      };

      if (typeof jwt.accessToken === 'string') {
        session.accessToken = jwt.accessToken;
      }

      if (typeof jwt.refreshToken === 'string') {
        session.refreshToken = jwt.refreshToken;
      }

      return session;
    } catch (error) {
      // Invalid JWT
      return null;
    }
  }

  async updateSession(session: Session, update: Partial<Session>): Promise<Session> {
    const updatedSession = { ...session, ...update };

    // Update the JWT with new information
    const now = Math.floor(Date.now() / 1000);
    const shouldUpdate =
      session.expires && new Date(session.expires).getTime() - Date.now() < this.updateAge * 1000;

    if (shouldUpdate) {
      const expires = now + this.maxAge;
      updatedSession.expires = new Date(expires * 1000).toISOString();
    }

    return updatedSession;
  }

  async deleteSession(
    request: NextRequest | NextApiRequest,
    response: NextResponse | NextApiResponse
  ): Promise<void> {
    deleteSessionCookie(response);
  }

  async refreshSession(session: Session): Promise<Session> {
    const now = Math.floor(Date.now() / 1000);
    const expires = now + this.maxAge;

    const jwtPayload: JWT = {
      sub: session.user.id,
      name: session.user.name || null,
      email: session.user.email || null,
      picture: session.user.image || null,
      ...(session.user.role && { role: session.user.role }),
      iat: now,
      exp: expires,
      ...(session.accessToken && { accessToken: session.accessToken }),
      ...(session.refreshToken && { refreshToken: session.refreshToken }),
    };

    const _token = await encodeJWT({
      // TODO: Store or return the encoded JWT
      token: jwtPayload,
      secret: this.secret,
      maxAge: this.maxAge,
    });
    void _token; // Intentionally unused - placeholder for future JWT storage

    return {
      ...session,
      expires: new Date(expires * 1000).toISOString(),
    };
  }
}

// ============================================================================
// Database Session Strategy
// ============================================================================

export class DatabaseSessionStrategy implements SessionStrategy {
  private adapter: Adapter;
  private maxAge: number;

  constructor(options: { adapter: Adapter; maxAge?: number }) {
    this.adapter = options.adapter;
    this.maxAge = options.maxAge || 30 * 24 * 60 * 60; // 30 days
  }

  async createSession(
    user: User,
    account?: { provider: string; providerAccountId: string; [key: string]: unknown }
  ): Promise<Session> {
    if (!this.adapter.createSession) {
      throw new NextAirAuthError(
        'Database adapter does not support session creation',
        'ADAPTER_ERROR'
      );
    }

    const sessionToken = generateSessionToken();
    const expires = addTime(new Date(), this.maxAge);

    const _dbSession = await this.adapter.createSession({
      // TODO: Use dbSession in response
      sessionToken,
      userId: user.id,
      expires,
    });
    void _dbSession; // Intentionally unused - placeholder for database session usage

    const session: Session = {
      user,
      expires: expires.toISOString(),
    };

    if (typeof account?.access_token === 'string') {
      session.accessToken = account.access_token;
    }

    if (typeof account?.refresh_token === 'string') {
      session.refreshToken = account.refresh_token;
    }

    return session;
  }

  async getSession(request: NextRequest | NextApiRequest): Promise<Session | null> {
    const sessionToken = getSessionCookie(request);
    if (!sessionToken) return null;

    if (!this.adapter.getSessionAndUser) {
      throw new NextAirAuthError(
        'Database adapter does not support session retrieval',
        'ADAPTER_ERROR'
      );
    }

    try {
      const result = await this.adapter.getSessionAndUser(sessionToken);
      if (!result) return null;

      const { session, user } = result;

      // Check if session is expired
      if (isExpired(new Date(session.expires))) {
        // Clean up expired session
        if (this.adapter.deleteSession) {
          await this.adapter.deleteSession(sessionToken);
        }
        return null;
      }

      return {
        user,
        expires: session.expires,
        ...(session.accessToken && { accessToken: session.accessToken }),
        ...(session.refreshToken && { refreshToken: session.refreshToken }),
      };
    } catch (error) {
      return null;
    }
  }

  async updateSession(_session: Session, _update: Partial<Session>): Promise<Session> {
    if (!this.adapter.updateSession) {
      throw new NextAirAuthError(
        'Database adapter does not support session updates',
        'ADAPTER_ERROR'
      );
    }

    // This method needs to be refactored to accept request parameter
    throw new NextAirAuthError(
      'Database session update requires request context',
      'IMPLEMENTATION_ERROR'
    );
  }

  async deleteSession(
    request: NextRequest | NextApiRequest,
    response: NextResponse | NextApiResponse
  ): Promise<void> {
    const sessionToken = getSessionCookie(request);

    if (sessionToken && this.adapter.deleteSession) {
      await this.adapter.deleteSession(sessionToken);
    }

    deleteSessionCookie(response);
  }
}

// ============================================================================
// Session Manager
// ============================================================================

export class SessionManager {
  private strategy: SessionStrategy;

  constructor(strategy: SessionStrategy) {
    this.strategy = strategy;
  }

  async createSession(
    user: User,
    account?: { provider: string; providerAccountId: string; [key: string]: unknown },
    response?: NextResponse | NextApiResponse
  ): Promise<Session> {
    const session = await this.strategy.createSession(user, account);

    // Set session cookie if response is provided
    if (response) {
      const config = getConfig();
      const maxAge = config.session?.maxAge || 30 * 24 * 60 * 60;

      if (config.session?.strategy === 'jwt') {
        // For JWT strategy, create and set the JWT token
        const jwtPayload: JWT = {
          sub: user.id,
          name: user.name || null,
          email: user.email || null,
          picture: user.image || null,
          ...(user.role && { role: user.role }),
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + maxAge,
        };

        const token = await encodeJWT({
          token: jwtPayload,
          secret: config.jwt?.secret!,
          maxAge,
        });

        setSessionCookie(response, token, maxAge);
      } else {
        // For database strategy, the session token is already created
        // We need to get it from the adapter somehow - this needs refactoring
      }
    }

    return session;
  }

  async getSession(request: NextRequest | NextApiRequest): Promise<Session | null> {
    return this.strategy.getSession(request);
  }

  async updateSession(
    session: Session,
    update: Partial<Session>,
    response?: NextResponse | NextApiResponse
  ): Promise<Session> {
    const updatedSession = await this.strategy.updateSession(session, update);

    // Update session cookie if response is provided and strategy supports refresh
    if (response && this.strategy.refreshSession) {
      const refreshedSession = await this.strategy.refreshSession(updatedSession);

      const config = getConfig();
      if (config.session?.strategy === 'jwt') {
        const maxAge = config.session?.maxAge || 30 * 24 * 60 * 60;

        const jwtPayload: JWT = {
          sub: refreshedSession.user.id,
          name: refreshedSession.user.name || null,
          email: refreshedSession.user.email || null,
          picture: refreshedSession.user.image || null,
          ...(refreshedSession.user.role && { role: refreshedSession.user.role }),
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + maxAge,
        };

        const token = await encodeJWT({
          token: jwtPayload,
          secret: config.jwt?.secret!,
          maxAge,
        });

        setSessionCookie(response, token, maxAge);
      }

      return refreshedSession;
    }

    return updatedSession;
  }

  async deleteSession(
    request: NextRequest | NextApiRequest,
    response: NextResponse | NextApiResponse
  ): Promise<void> {
    await this.strategy.deleteSession(request, response);
  }

  async refreshSession(session: Session): Promise<Session | null> {
    if (!this.strategy.refreshSession) {
      return session;
    }

    try {
      return await this.strategy.refreshSession(session);
    } catch (error) {
      return null;
    }
  }
}

// ============================================================================
// Session Factory
// ============================================================================

export function createSessionManager(): SessionManager {
  const config = getConfig();
  const strategy = config.session?.strategy || 'jwt';

  if (strategy === 'jwt') {
    const secret = config.jwt?.secret;
    if (!secret) {
      throw new NextAirAuthError(
        'JWT secret is required for JWT session strategy',
        'CONFIGURATION_ERROR'
      );
    }

    const jwtStrategy = new JWTSessionStrategy({
      secret,
      ...(config.session?.maxAge && { maxAge: config.session.maxAge }),
      ...(config.session?.updateAge && { updateAge: config.session.updateAge }),
    });

    return new SessionManager(jwtStrategy);
  } else {
    const adapter = config.adapter;
    if (!adapter) {
      throw new NextAirAuthError(
        'Database adapter is required for database session strategy',
        'CONFIGURATION_ERROR'
      );
    }

    const dbStrategy = new DatabaseSessionStrategy({
      adapter,
      ...(config.session?.maxAge && { maxAge: config.session.maxAge }),
    });

    return new SessionManager(dbStrategy);
  }
}

// ============================================================================
// Session Utilities
// ============================================================================

/**
 * Check if session needs refresh
 */
export function shouldRefreshSession(session: Session, updateAge: number = 24 * 60 * 60): boolean {
  if (!session.expires) return false;

  const expiresAt = new Date(session.expires).getTime();
  const now = Date.now();
  const timeUntilExpiry = expiresAt - now;
  const updateThreshold = updateAge * 1000; // Convert to milliseconds

  return timeUntilExpiry < updateThreshold;
}

/**
 * Validate session expiry
 */
export function isSessionExpired(session: Session): boolean {
  if (!session.expires) return false;
  return isExpired(new Date(session.expires));
}

/**
 * Get session duration in seconds
 */
export function getSessionDuration(session: Session): number {
  if (!session.expires) return 0;

  const expiresAt = new Date(session.expires).getTime();
  const now = Date.now();

  return Math.max(0, Math.floor((expiresAt - now) / 1000));
}

/**
 * Create session from JWT payload
 */
export function createSessionFromJWT(jwt: JWT): Session {
  const user: User = {
    id: jwt.sub!,
    name: jwt.name || null,
    email: jwt.email || null,
    image: jwt.picture || null,
    ...(jwt.role && { role: jwt.role }),
  };

  const session: Session = {
    user,
    expires: jwt.exp
      ? new Date(jwt.exp * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  if (typeof jwt.accessToken === 'string') {
    session.accessToken = jwt.accessToken;
  }

  if (typeof jwt.refreshToken === 'string') {
    session.refreshToken = jwt.refreshToken;
  }

  return session;
}

/**
 * Create JWT from session
 */
export function createJWTFromSession(session: Session): JWT {
  const expiresAt = session.expires
    ? Math.floor(new Date(session.expires).getTime() / 1000)
    : undefined;

  return {
    sub: session.user.id,
    name: session.user.name || null,
    email: session.user.email || null,
    picture: session.user.image || null,
    ...(session.user.role && { role: session.user.role }),
    iat: Math.floor(Date.now() / 1000),
    exp: expiresAt || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    ...(session.accessToken && { accessToken: session.accessToken }),
    ...(session.refreshToken && { refreshToken: session.refreshToken }),
  };
}

// ============================================================================
// Session Cleanup
// ============================================================================

/**
 * Clean up expired sessions (for database strategy)
 */
export async function cleanupExpiredSessions(adapter: Adapter): Promise<number> {
  if (!adapter.deleteSession) {
    return 0;
  }

  // This would need to be implemented in the adapter
  // For now, return 0 as we don't have a generic way to query expired sessions
  return 0;
}

// ============================================================================
// Export Session Manager Instance
// ============================================================================

let globalSessionManager: SessionManager | null = null;

export function getSessionManager(): SessionManager {
  if (!globalSessionManager) {
    globalSessionManager = createSessionManager();
  }
  return globalSessionManager;
}

export function resetSessionManager(): void {
  globalSessionManager = null;
}

// ============================================================================
// Export Middleware Functions
// ============================================================================
export {
  withSession,
  withApiSession,
  requireAuth,
  requireApiAuth,
  requireRole,
  requireApiRole,
  debugSession as getSessionInfo,
} from './middleware';

export {
  refreshAccessToken,
  shouldRefreshToken,
  getSessionWithRefresh,
  autoRefreshSession,
  getBackgroundRefreshManager,
} from './refresh';

// Export session helpers
export { createSession, getSession, refreshSession, deleteSession } from './helpers';
