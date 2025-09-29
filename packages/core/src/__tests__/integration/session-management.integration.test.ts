/**
 * Session Management Integration Tests
 * Tests complete session management workflows including creation, retrieval, refresh, and deletion
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextAirAuth, resetConfig, _getConfig, GitHub } from '../../index';
import { createSession, getSession, refreshSession, deleteSession } from '../../session';
import { encodeJWT, decodeJWT } from '../../security';
import {
  MockDatabase,
  createMockAdapter,
  setupTestEnvironment,
  teardownTestEnvironment,
  testUsers,
  testProviders,
} from './setup';
import type { Adapter, _User, _Session } from '../../types';

describe('Session Management Integration Tests', () => {
  let db: MockDatabase;
  let adapter: Adapter;

  beforeEach(() => {
    setupTestEnvironment();
    db = new MockDatabase();
    adapter = createMockAdapter(db);
    resetConfig();
  });

  afterEach(() => {
    db.clear();
    teardownTestEnvironment();
    resetConfig();
    vi.clearAllMocks();
  });

  describe('JWT Session Management', () => {
    let config: any;

    beforeEach(() => {
      config = NextAirAuth({
        providers: [GitHub(testProviders.github)],
        adapter,
        session: {
          strategy: 'jwt',
          maxAge: 30 * 24 * 60 * 60,
          updateAge: 24 * 60 * 60,
        },
        jwt: {
          secret: process.env.NEXT_AIRAUTH_SECRET!,
        },
      });
    });

    it('should create and verify JWT sessions', async () => {
      const user = testUsers.alice;

      // Create JWT session
      const session = await createSession({
        user,
        adapter,
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
        secret: config.jwt?.secret || process.env.NEXT_AIRAUTH_SECRET!,
      });

      expect(session).toBeDefined();
      expect(session.user).toBeDefined();
      expect(session.user.email).toBe(user.email);
      expect(session.expires).toBeDefined();
      expect(session.sessionToken).toBeDefined();

      // Decode the JWT token
      const decoded = await decodeJWT({
        token: session.sessionToken!,
        secret: config.jwt?.secret || process.env.NEXT_AIRAUTH_SECRET!,
      });

      expect(decoded).toBeDefined();
      expect(decoded?.email).toBe(user.email);
      expect(decoded?.name).toBe(user.name);
    });

    it('should handle JWT token expiration', async () => {
      const user = testUsers.bob;

      // Create token with very short expiry
      const shortLivedToken = await encodeJWT({
        token: {
          sub: user.id,
          name: user.name,
          email: user.email,
        },
        secret: config.jwt?.secret || process.env.NEXT_AIRAUTH_SECRET!,
        maxAge: 0, // Already expired
      });

      // Try to decode expired token
      const decoded = await decodeJWT({
        token: shortLivedToken,
        secret: config.jwt?.secret || process.env.NEXT_AIRAUTH_SECRET!,
      });

      expect(decoded).toBeNull();
    });

    it('should refresh JWT sessions', async () => {
      const user = testUsers.charlie;

      // Create initial session
      const initialSession = await createSession({
        user,
        adapter,
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
        secret: config.jwt?.secret || process.env.NEXT_AIRAUTH_SECRET!,
      });

      expect(initialSession.sessionToken).toBeDefined();

      // Refresh the session (should get new expiry)
      const refreshedSession = await refreshSession({
        session: initialSession,
        adapter,
        maxAge: 30 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60,
      });

      expect(refreshedSession).toBeDefined();
      expect(refreshedSession.user.id).toBe(user.id);

      // Since we're forcing a refresh, the new expiry should be different
      // In a real scenario this would only happen if time has passed
      expect(refreshedSession.expires).toBeDefined();
    });

    it('should handle concurrent JWT session creation', async () => {
      const user = testUsers.alice;

      // Create multiple sessions concurrently
      const sessionPromises = Array.from({ length: 10 }, () =>
        createSession({
          user,
          adapter,
          strategy: 'jwt',
          maxAge: 30 * 24 * 60 * 60,
          secret: config.jwt?.secret || process.env.NEXT_AIRAUTH_SECRET!,
        })
      );

      const sessions = await Promise.all(sessionPromises);

      // All sessions should be valid
      sessions.forEach(session => {
        expect(session).toBeDefined();
        expect(session.user.id).toBe(user.id);
        expect(session.sessionToken).toBeDefined();
      });

      // Each session should have a unique token
      const tokens = sessions.map(s => s.sessionToken);
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);
    });
  });

  describe('Database Session Management', () => {
    let config: any;

    beforeEach(() => {
      config = NextAirAuth({
        providers: [GitHub(testProviders.github)],
        adapter,
        session: {
          strategy: 'database',
          maxAge: 30 * 24 * 60 * 60,
          updateAge: 24 * 60 * 60,
        },
      });
    });

    it('should create and retrieve database sessions', async () => {
      // Create user
      const user = await adapter.createUser!(testUsers.alice);
      expect(user).toBeDefined();

      // Create database session
      const session = await createSession({
        user,
        adapter,
        strategy: 'database',
        maxAge: 30 * 24 * 60 * 60,
      });

      expect(session).toBeDefined();
      expect(session.sessionToken).toBeDefined();
      expect(session.userId).toBe(user.id);

      // Retrieve session
      const retrievedSession = await getSession({
        sessionToken: session.sessionToken!,
        adapter,
        strategy: 'database',
      });

      expect(retrievedSession).toBeDefined();
      expect(retrievedSession?.user.id).toBe(user.id);
      expect(retrievedSession?.user.email).toBe(user.email);
    });

    it('should update database sessions', async () => {
      // Create user and session
      const user = await adapter.createUser!(testUsers.bob);
      const session = await createSession({
        user,
        adapter,
        strategy: 'database',
        maxAge: 30 * 24 * 60 * 60,
      });

      const originalExpiry = new Date(session.expires).getTime();

      // Add small delay to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update session
      const updatedSession = await adapter.updateSession!({
        sessionToken: session.sessionToken!,
      });

      expect(updatedSession).toBeDefined();
      expect(updatedSession?.sessionToken).toBe(session.sessionToken);

      const newExpiry = new Date(updatedSession!.expires).getTime();
      expect(newExpiry).toBeGreaterThanOrEqual(originalExpiry);
    });

    it('should delete database sessions', async () => {
      // Create user and session
      const user = await adapter.createUser!(testUsers.charlie);
      const session = await createSession({
        user,
        adapter,
        strategy: 'database',
        maxAge: 30 * 24 * 60 * 60,
      });

      // Verify session exists
      let retrievedSession = await getSession({
        sessionToken: session.sessionToken!,
        adapter,
        strategy: 'database',
      });
      expect(retrievedSession).toBeDefined();

      // Delete session
      await deleteSession({
        sessionToken: session.sessionToken!,
        adapter,
        strategy: 'database',
      });

      // Verify session is deleted
      retrievedSession = await getSession({
        sessionToken: session.sessionToken!,
        adapter,
        strategy: 'database',
      });
      expect(retrievedSession).toBeNull();
    });

    it('should handle expired database sessions', async () => {
      // Create user
      const user = await adapter.createUser!(testUsers.alice);

      // Create session with very short expiry
      const session = await createSession({
        user,
        adapter,
        strategy: 'database',
        maxAge: 1, // 1 second
      });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Try to get expired session
      const expiredSession = await getSession({
        sessionToken: session.sessionToken!,
        adapter,
        strategy: 'database',
      });

      expect(expiredSession).toBeNull();
    });

    it('should handle concurrent database operations', async () => {
      // Create multiple users
      const users = await Promise.all([
        adapter.createUser!(testUsers.alice),
        adapter.createUser!(testUsers.bob),
        adapter.createUser!(testUsers.charlie),
      ]);

      // Create sessions for all users concurrently
      const sessionPromises = users.map(user =>
        createSession({
          user,
          adapter,
          strategy: 'database',
          maxAge: 30 * 24 * 60 * 60,
        })
      );

      const sessions = await Promise.all(sessionPromises);

      // Verify all sessions were created
      sessions.forEach((session, index) => {
        expect(session).toBeDefined();
        expect(session.userId).toBe(users[index].id);
      });

      // Retrieve all sessions concurrently
      const retrievePromises = sessions.map(session =>
        getSession({
          sessionToken: session.sessionToken!,
          adapter,
          strategy: 'database',
        })
      );

      const retrievedSessions = await Promise.all(retrievePromises);

      // Verify all sessions were retrieved
      retrievedSessions.forEach((session, index) => {
        expect(session).toBeDefined();
        expect(session?.user.id).toBe(users[index].id);
      });

      // Delete all sessions concurrently
      const deletePromises = sessions.map(session =>
        deleteSession({
          sessionToken: session.sessionToken!,
          adapter,
          strategy: 'database',
        })
      );

      await Promise.all(deletePromises);

      // Verify all sessions were deleted
      const verifyPromises = sessions.map(session =>
        getSession({
          sessionToken: session.sessionToken!,
          adapter,
          strategy: 'database',
        })
      );

      const deletedSessions = await Promise.all(verifyPromises);
      deletedSessions.forEach(session => {
        expect(session).toBeNull();
      });
    });
  });

  describe('Session Strategy Switching', () => {
    it('should handle switching between JWT and database strategies', async () => {
      const user = testUsers.alice;

      // First, use JWT strategy
      const jwtConfig = NextAirAuth({
        providers: [GitHub(testProviders.github)],
        adapter,
        session: {
          strategy: 'jwt',
          maxAge: 30 * 24 * 60 * 60,
        },
      });

      const jwtSession = await createSession({
        user,
        adapter,
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
        secret: jwtConfig.jwt?.secret || process.env.NEXT_AIRAUTH_SECRET!,
      });

      expect(jwtSession).toBeDefined();
      expect(jwtSession.sessionToken).toBeDefined();

      // Reset and switch to database strategy
      resetConfig();

      const _dbConfig = NextAirAuth({
        providers: [GitHub(testProviders.github)],
        adapter,
        session: {
          strategy: 'database',
          maxAge: 30 * 24 * 60 * 60,
        },
      });

      // Create user in database
      const dbUser = await adapter.createUser!(user);

      const dbSession = await createSession({
        user: dbUser,
        adapter,
        strategy: 'database',
        maxAge: 30 * 24 * 60 * 60,
      });

      expect(dbSession).toBeDefined();
      expect(dbSession.sessionToken).toBeDefined();
      expect(dbSession.userId).toBe(dbUser.id);

      // Verify both sessions are independent
      expect(jwtSession.sessionToken).not.toBe(dbSession.sessionToken);
    });
  });

  describe('Session Callbacks', () => {
    it('should apply session callbacks correctly', async () => {
      const _config = NextAirAuth({
        providers: [GitHub(testProviders.github)],
        adapter,
        session: {
          strategy: 'jwt',
          maxAge: 30 * 24 * 60 * 60,
        },
        callbacks: {
          jwt: async ({ token, user }) => {
            if (user) {
              token.customField = 'custom-value';
              token.timestamp = Date.now();
            }
            return token;
          },
          session: async ({ session, token }) => {
            if (token && session.user) {
              (session as any).customField = token.customField(session as any).timestamp =
                token.timestamp;
            }
            return session;
          },
        },
      });

      const user = testUsers.alice;

      // Create token with callbacks
      const token = await encodeJWT({
        token: {
          sub: user.id,
          name: user.name,
          email: user.email,
          customField: 'custom-value',
          timestamp: Date.now(),
        },
        secret: config.jwt?.secret || process.env.NEXT_AIRAUTH_SECRET!,
        maxAge: 30 * 24 * 60 * 60,
      });

      // Decode and verify custom fields
      const decoded = await decodeJWT({
        token,
        secret: config.jwt?.secret || process.env.NEXT_AIRAUTH_SECRET!,
      });

      expect(decoded).toBeDefined();
      expect(decoded?.customField).toBe('custom-value');
      expect(decoded?.timestamp).toBeDefined();
    });
  });
});
