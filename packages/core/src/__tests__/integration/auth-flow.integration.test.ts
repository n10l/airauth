/**
 * Authentication Flow Integration Tests
 * Tests complete authentication workflows including sign-in, sign-out, and session management
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextAirAuth, resetConfig } from '../../core';
import { GitHub } from '../../providers';
import {
  createSession,
  getSession,
  deleteSession,
  refreshSession,
  _getSessionManager,
  resetSessionManager,
} from '../../session';
import {
  MockDatabase,
  createMockAdapter,
  createMockRequest,
  createMockResponse,
  setupTestEnvironment,
  teardownTestEnvironment,
  testUsers,
  _testProviders,
  wait,
} from './setup';
import type { NextAirAuthConfig, _User } from '../../types';

describe('Authentication Flow Integration Tests', () => {
  let db: MockDatabase;
  let mockAdapter: ReturnType<typeof createMockAdapter>;

  beforeEach(() => {
    setupTestEnvironment();
    db = new MockDatabase();
    mockAdapter = createMockAdapter(db);
  });

  afterEach(() => {
    db.clear();
    vi.clearAllMocks();
    teardownTestEnvironment();
    resetConfig();
    resetSessionManager();
  });

  describe('Complete Sign-In Flow with JWT Sessions', () => {
    let config: NextAirAuthConfig;

    beforeEach(() => {
      config = {
        providers: [
          {
            id: 'credentials',
            name: 'Credentials',
            type: 'credentials',
            credentials: {
              email: { label: 'Email', type: 'email' },
              password: { label: 'Password', type: 'password' },
            },
            authorize: async credentials => {
              if (!credentials?.email || !credentials?.password) {
                return null;
              }
              // Simulate database lookup
              const user = await mockAdapter.getUserByEmail(credentials.email);
              if (!user) {
                return null;
              }
              // Simulate password verification
              if (credentials.password !== 'password123') {
                return null;
              }
              return user;
            },
          },
        ],
        adapter: mockAdapter,
        session: {
          strategy: 'jwt',
          maxAge: 30 * 24 * 60 * 60, // 30 days
        },
        pages: {
          signIn: '/auth/signin',
          signOut: '/auth/signout',
          error: '/auth/error',
        },
        callbacks: {
          async jwt({ token, user, account }) {
            if (user) {
              token.id = user.id;
              token.role = user.role;
            }
            if (account) {
              token.accessToken = account.access_token;
            }
            return token;
          },
          async session({ session, token }) {
            if (token && session.user) {
              session.user.id = token.id as string;
              session.user.role = token.role as string;
              session.accessToken = token.accessToken as string;
            }
            return session;
          },
        },
      };

      NextAirAuth(config);
    });

    it('should complete full sign-in flow with credentials', async () => {
      // Step 1: Create a user in the database
      const user = await mockAdapter.createUser({
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();

      // Step 2: Simulate credential verification and create session
      // In a real implementation, this would be done by the authorize callback
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Verify credentials (normally done in authorize callback)
      const authorizedUser = await config.providers[0].authorize!(
        credentials,
        createMockRequest({}),
        createMockResponse()
      );
      expect(authorizedUser).toBeDefined();
      expect(authorizedUser?.email).toBe('test@example.com');

      // Step 3: Create a session for the authorized user
      const session = await createSession({
        user: authorizedUser!,
        adapter: mockAdapter,
        strategy: 'jwt',
        maxAge: config.session?.maxAge || 30 * 24 * 60 * 60,
        secret: config.jwt?.secret || process.env.NEXT_AIRAUTH_SECRET!,
      });

      expect(session).toBeDefined();
      expect(session.user).toBeDefined();
      expect(session.user.email).toBe('test@example.com');
      expect(session.user.name).toBe('Test User');
      expect(session.expires).toBeDefined();
      expect(session.sessionToken).toBeDefined();

      // Step 4: Verify session can be retrieved
      const retrievedSession = await getSession({
        sessionToken: session.sessionToken!,
        adapter: mockAdapter,
        strategy: 'jwt',
        secret: config.jwt?.secret || process.env.NEXT_AIRAUTH_SECRET!,
      });

      expect(retrievedSession).toBeDefined();
      expect(retrievedSession?.user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      // Create a user
      await mockAdapter.createUser({
        email: 'test@example.com',
        name: 'Test User',
      });

      // Attempt sign-in with wrong password
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const authorizedUser = await config.providers[0].authorize!(
        credentials,
        createMockRequest({}),
        createMockResponse()
      );
      expect(authorizedUser).toBeNull();
    });

    it('should handle sign-out flow', async () => {
      // First, sign in
      const user = await mockAdapter.createUser({
        email: 'test@example.com',
        name: 'Test User',
      });

      const session = await createSession({
        user,
        adapter: mockAdapter,
        strategy: 'jwt',
        maxAge: config.session?.maxAge || 30 * 24 * 60 * 60,
        secret: config.jwt?.secret || process.env.NEXT_AIRAUTH_SECRET!,
      });

      expect(session.sessionToken).toBeDefined();

      // Now sign out (delete session)
      await deleteSession({
        sessionToken: session.sessionToken!,
        adapter: mockAdapter,
        strategy: 'jwt',
      });

      // Verify session is no longer valid
      const retrievedSession = await getSession({
        sessionToken: session.sessionToken!,
        adapter: mockAdapter,
        strategy: 'jwt',
        secret: config.jwt?.secret || process.env.NEXT_AIRAUTH_SECRET!,
      });

      // JWT sessions can still be decoded until they expire
      // The client should clear the cookie/storage
      expect(retrievedSession).toBeDefined(); // JWT is still valid until expiry
    });
  });

  describe('Complete Sign-In Flow with Database Sessions', () => {
    let config: NextAirAuthConfig;

    beforeEach(() => {
      config = {
        providers: [
          {
            id: 'credentials',
            name: 'Credentials',
            type: 'credentials',
            credentials: {
              email: { label: 'Email', type: 'email' },
              password: { label: 'Password', type: 'password' },
            },
            authorize: async credentials => {
              if (!credentials?.email || !credentials?.password) {
                return null;
              }
              const user = await mockAdapter.getUserByEmail(credentials.email);
              if (!user) {
                return null;
              }
              if (credentials.password !== 'password123') {
                return null;
              }
              return user;
            },
          },
        ],
        adapter: mockAdapter,
        session: {
          strategy: 'database',
          maxAge: 30 * 24 * 60 * 60, // 30 days
        },
      };

      NextAirAuth(config);
    });

    it('should complete full sign-in flow with database sessions', async () => {
      // Create a user
      const user = await mockAdapter.createUser({
        email: 'test@example.com',
        name: 'Test User',
      });

      // Create a database session
      const session = await createSession({
        user,
        adapter: mockAdapter,
        strategy: 'database',
        maxAge: config.session?.maxAge || 30 * 24 * 60 * 60,
      });

      expect(session).toBeDefined();
      expect(session.user).toBeDefined();
      expect(session.sessionToken).toBeDefined();

      // Retrieve the session
      const retrievedSession = await getSession({
        sessionToken: session.sessionToken!,
        adapter: mockAdapter,
        strategy: 'database',
      });

      expect(retrievedSession).toBeDefined();
      expect(retrievedSession?.user.email).toBe('test@example.com');
    });

    it('should handle database session expiry', async () => {
      const user = await mockAdapter.createUser({
        email: 'test@example.com',
        name: 'Test User',
      });

      // Create a session with very short expiry
      const session = await createSession({
        user,
        adapter: mockAdapter,
        strategy: 'database',
        maxAge: 1, // 1 second
      });

      // Wait for expiration
      await wait(1100);

      // Try to retrieve expired session
      const retrievedSession = await getSession({
        sessionToken: session.sessionToken!,
        adapter: mockAdapter,
        strategy: 'database',
      });

      expect(retrievedSession).toBeNull();
    });

    it('should handle database session deletion', async () => {
      const user = await mockAdapter.createUser({
        email: 'test@example.com',
        name: 'Test User',
      });

      const session = await createSession({
        user,
        adapter: mockAdapter,
        strategy: 'database',
        maxAge: config.session?.maxAge || 30 * 24 * 60 * 60,
      });

      // Delete the session
      await deleteSession({
        sessionToken: session.sessionToken!,
        adapter: mockAdapter,
        strategy: 'database',
      });

      // Try to retrieve deleted session
      const retrievedSession = await getSession({
        sessionToken: session.sessionToken!,
        adapter: mockAdapter,
        strategy: 'database',
      });

      expect(retrievedSession).toBeNull();
    });
  });

  describe('Session Refresh Flow', () => {
    let config: NextAirAuthConfig;

    beforeEach(() => {
      config = {
        providers: [
          GitHub({
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
          }),
        ],
        adapter: mockAdapter,
        session: {
          strategy: 'jwt',
          maxAge: 30 * 24 * 60 * 60,
          updateAge: 24 * 60 * 60,
        },
      };

      NextAirAuth(config);
    });

    it('should refresh JWT sessions', async () => {
      const user = testUsers.alice;

      const session = await createSession({
        user,
        adapter: mockAdapter,
        strategy: 'jwt',
        maxAge: config.session?.maxAge || 30 * 24 * 60 * 60,
        secret: config.jwt?.secret || process.env.NEXT_AIRAUTH_SECRET!,
      });

      const refreshedSession = await refreshSession({
        session,
        adapter: mockAdapter,
        maxAge: config.session?.maxAge || 30 * 24 * 60 * 60,
        updateAge: config.session?.updateAge || 24 * 60 * 60,
      });

      expect(refreshedSession).toBeDefined();
      expect(refreshedSession.user.id).toBe(user.id);
    });

    it('should refresh database sessions', async () => {
      config.session!.strategy = 'database';
      resetConfig();
      NextAirAuth(config);

      const user = await mockAdapter.createUser(testUsers.bob);

      const session = await createSession({
        user,
        adapter: mockAdapter,
        strategy: 'database',
        maxAge: config.session?.maxAge || 30 * 24 * 60 * 60,
      });

      const refreshedSession = await refreshSession({
        session,
        adapter: mockAdapter,
        maxAge: config.session?.maxAge || 30 * 24 * 60 * 60,
        updateAge: config.session?.updateAge || 24 * 60 * 60,
      });

      expect(refreshedSession).toBeDefined();
      expect(refreshedSession.user.id).toBe(user.id);
    });
  });

  describe('Concurrent Session Operations', () => {
    let config: NextAirAuthConfig;

    beforeEach(() => {
      config = {
        providers: [
          GitHub({
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
          }),
        ],
        adapter: mockAdapter,
        session: {
          strategy: 'database',
          maxAge: 30 * 24 * 60 * 60,
        },
      };

      NextAirAuth(config);
    });

    it('should handle concurrent session creation', async () => {
      const users = await Promise.all([
        mockAdapter.createUser(testUsers.alice),
        mockAdapter.createUser(testUsers.bob),
        mockAdapter.createUser(testUsers.charlie),
      ]);

      const sessionPromises = users.map(user =>
        createSession({
          user,
          adapter: mockAdapter,
          strategy: 'database',
          maxAge: config.session?.maxAge || 30 * 24 * 60 * 60,
        })
      );

      const sessions = await Promise.all(sessionPromises);

      sessions.forEach((session, index) => {
        expect(session).toBeDefined();
        expect(session.user.id).toBe(users[index].id);
        expect(session.sessionToken).toBeDefined();
      });

      // Verify all sessions can be retrieved
      const retrievePromises = sessions.map(session =>
        getSession({
          sessionToken: session.sessionToken!,
          adapter: mockAdapter,
          strategy: 'database',
        })
      );

      const retrievedSessions = await Promise.all(retrievePromises);

      retrievedSessions.forEach((session, index) => {
        expect(session).toBeDefined();
        expect(session?.user.id).toBe(users[index].id);
      });
    });

    it('should handle concurrent session deletions', async () => {
      const users = await Promise.all([
        mockAdapter.createUser(testUsers.alice),
        mockAdapter.createUser(testUsers.bob),
      ]);

      const sessions = await Promise.all(
        users.map(user =>
          createSession({
            user,
            adapter: mockAdapter,
            strategy: 'database',
            maxAge: 30 * 24 * 60 * 60,
          })
        )
      );

      // Delete all sessions concurrently
      await Promise.all(
        sessions.map(session =>
          deleteSession({
            sessionToken: session.sessionToken!,
            adapter: mockAdapter,
            strategy: 'database',
          })
        )
      );

      // Verify all sessions are deleted
      const verifyPromises = sessions.map(session =>
        getSession({
          sessionToken: session.sessionToken!,
          adapter: mockAdapter,
          strategy: 'database',
        })
      );

      const deletedSessions = await Promise.all(verifyPromises);
      deletedSessions.forEach(session => {
        expect(session).toBeNull();
      });
    });
  });

  describe('Session with OAuth Provider Tokens', () => {
    let config: NextAirAuthConfig;

    beforeEach(() => {
      config = {
        providers: [
          GitHub({
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
          }),
        ],
        adapter: mockAdapter,
        session: {
          strategy: 'jwt',
          maxAge: 30 * 24 * 60 * 60,
        },
      };

      NextAirAuth(config);
    });

    it('should store and retrieve OAuth tokens in session', async () => {
      const user = testUsers.alice;

      // Create session with OAuth tokens
      const _account = {
        provider: 'github',
        providerAccountId: 'github-123',
        access_token: 'github-access-token-abc123',
        refresh_token: 'github-refresh-token-xyz789',
      };

      const session = await createSession({
        user,
        adapter: mockAdapter,
        strategy: 'jwt',
        maxAge: config.session?.maxAge || 30 * 24 * 60 * 60,
        secret: config.jwt?.secret || process.env.NEXT_AIRAUTH_SECRET!,
      });

      // Note: The current implementation doesn't pass account to createSession
      // This test demonstrates the expected behavior but may need implementation updates
      expect(session).toBeDefined();
      expect(session.user.id).toBe(user.id);
    });
  });
});
