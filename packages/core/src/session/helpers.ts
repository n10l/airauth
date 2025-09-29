/**
 * Session Management Helper Functions
 * Provides high-level functions for session creation, retrieval, refresh, and deletion
 */
import { User, Session, Adapter } from '../types';
import { encodeJWT, decodeJWT } from '../security';
import { nanoid } from 'nanoid';

interface CreateSessionOptions {
  user: User;
  adapter?: Adapter;
  strategy: 'jwt' | 'database';
  maxAge: number;
  secret?: string;
  updateAge?: number;
}

interface GetSessionOptions {
  sessionToken: string;
  adapter?: Adapter;
  strategy: 'jwt' | 'database';
  secret?: string;
}

interface RefreshSessionOptions {
  session: Session;
  adapter?: Adapter;
  maxAge: number;
  updateAge: number;
}

interface DeleteSessionOptions {
  sessionToken: string;
  adapter?: Adapter;
  strategy: 'jwt' | 'database';
}

/**
 * Create a new session
 */
export async function createSession({
  user,
  adapter,
  strategy,
  maxAge,
  secret,
}: CreateSessionOptions): Promise<Session> {
  const expires = new Date(Date.now() + maxAge * 1000);

  if (strategy === 'jwt') {
    // Create JWT session
    const token = await encodeJWT({
      token: {
        sub: user.id,
        name: user.name ?? null,
        email: user.email ?? null,
        picture: user.image ?? null,
      },
      secret: secret!,
      maxAge,
    });

    return {
      user,
      expires: expires.toISOString(),
      sessionToken: token,
    };
  } else {
    // Create database session
    if (!adapter?.createSession) {
      throw new Error('Database adapter is required for database sessions');
    }

    const sessionToken = nanoid(32);
    const session = await adapter.createSession({
      sessionToken,
      userId: user.id,
      expires,
    });

    return {
      user,
      expires:
        typeof session.expires === 'string' ? session.expires : ((session.expires as any) instanceof Date ? (session.expires as any).toISOString() : String(session.expires)),
      sessionToken: session.sessionToken!,
    };
  }
}

/**
 * Get an existing session
 */
export async function getSession({
  sessionToken,
  adapter,
  strategy,
  secret,
}: GetSessionOptions): Promise<Session | null> {
  if (strategy === 'jwt') {
    // Decode JWT session
    const decoded = await decodeJWT({
      token: sessionToken,
      secret: secret!,
    });

    if (!decoded) {
      return null;
    }

    // Check if expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null;
    }

    return {
      user: {
        id: decoded.sub!,
        name: decoded.name as string,
        email: decoded.email as string,
        image: decoded.picture as string | null,
      },
      expires: new Date(decoded.exp! * 1000).toISOString(),
      sessionToken,
    };
  } else {
    // Get database session
    if (!adapter?.getSessionAndUser) {
      throw new Error('Database adapter is required for database sessions');
    }

    const result = await adapter.getSessionAndUser(sessionToken);
    if (!result) {
      return null;
    }

    // Check if expired
    const expires = new Date(result.session.expires);
    if (expires < new Date()) {
      // Delete expired session
      if (adapter.deleteSession) {
        await adapter.deleteSession(sessionToken);
      }
      return null;
    }

    return {
      user: result.user,
      expires:
        typeof result.session.expires === 'string'
          ? result.session.expires
          : ((result.session.expires as any) instanceof Date ? (result.session.expires as any).toISOString() : String(result.session.expires)),
      sessionToken: result.session.sessionToken!,
    };
  }
}

/**
 * Refresh an existing session
 */
export async function refreshSession({
  session,
  adapter,
  maxAge,
  updateAge,
}: RefreshSessionOptions): Promise<Session> {
  const expires = new Date(session.expires);
  const now = new Date();
  const timeLeft = expires.getTime() - now.getTime();

  // Check if session should be refreshed
  if (timeLeft > updateAge * 1000) {
    // No need to refresh yet
    return session;
  }

  // Calculate new expiry
  const newExpires = new Date(now.getTime() + maxAge * 1000);

  if (session.user && adapter?.updateSession) {
    // Update database session
    const updated = await adapter.updateSession({
      sessionToken: session.sessionToken!,
    });

    if (updated) {
      return {
        ...session,
        expires: typeof updated.expires === 'string' ? updated.expires : ((updated.expires as any) instanceof Date ? (updated.expires as any).toISOString() : String(updated.expires)),
      };
    }
  }

  // Return session with new expiry
  return {
    ...session,
    expires: newExpires.toISOString(),
  };
}

/**
 * Delete a session
 */
export async function deleteSession({
  sessionToken,
  adapter,
  strategy,
}: DeleteSessionOptions): Promise<void> {
  if (strategy === 'database' && adapter?.deleteSession) {
    await adapter.deleteSession(sessionToken);
  }
  // For JWT sessions, the token will naturally expire
  // Client should clear the cookie/storage
}

// Re-export for convenience
export { encodeJWT, decodeJWT } from '../security';
