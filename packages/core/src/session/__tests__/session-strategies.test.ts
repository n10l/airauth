import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest, NextApiResponse } from 'next';
import { JWTSessionStrategy, DatabaseSessionStrategy } from '../index';
import type { User, Session, _Adapter } from '../../types';

// Import the security modules for mocking
import * as securityModule from '../../security';
import * as cookiesModule from '../../security/cookies';
import * as coreModule from '../../core';

// Mock the security modules
vi.mock('../../security', () => ({
  encodeJWT: vi.fn().mockResolvedValue('mocked-jwt-token'),
  decodeJWT: vi.fn(),
  generateSessionToken: vi.fn().mockReturnValue('session-token-123'),
  addTime: vi.fn().mockImplementation((date, seconds) => new Date(date.getTime() + seconds * 1000)),
  isExpired: vi.fn().mockReturnValue(false),
}));

vi.mock('../../security/cookies', () => ({
  getSessionCookie: vi.fn(),
  setSessionCookie: vi.fn(),
  deleteSessionCookie: vi.fn(),
}));

vi.mock('../../core', () => ({
  getConfig: vi.fn().mockReturnValue({}),
}));

describe('Session Strategies', () => {
  const mockUser: User = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    image: 'https://example.com/avatar.jpg',
    role: 'user',
  };

  const mockAccount = {
    provider: 'github',
    providerAccountId: '12345',
    access_token: 'access-token-123',
    refresh_token: 'refresh-token-123',
  };

  const mockRequest = {
    headers: new Map([['cookie', 'next-airauth.session-token=test-token']]),
  } as unknown as NextRequest;

  const mockApiRequest = {
    headers: { cookie: 'next-airauth.session-token=test-token' },
  } as NextApiRequest;

  const mockResponse = {
    headers: new Map(),
    cookies: {
      set: vi.fn(),
      delete: vi.fn(),
    },
  } as unknown as NextResponse;

  const mockApiResponse = {
    setHeader: vi.fn(),
    removeHeader: vi.fn(),
  } as unknown as NextApiResponse;

  describe('JWTSessionStrategy', () => {
    let strategy: JWTSessionStrategy;
    const secret = 'test-secret-key';

    beforeEach(() => {
      strategy = new JWTSessionStrategy({
        secret,
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60, // 24 hours
      });
      vi.clearAllMocks();
    });

    describe('Constructor', () => {
      it('should create strategy with default options', () => {
        const defaultStrategy = new JWTSessionStrategy({ secret });
        expect(defaultStrategy).toBeDefined();
      });

      it('should create strategy with custom options', () => {
        const customStrategy = new JWTSessionStrategy({
          secret,
          maxAge: 7 * 24 * 60 * 60, // 7 days
          updateAge: 12 * 60 * 60, // 12 hours
        });
        expect(customStrategy).toBeDefined();
      });
    });

    describe('createSession', () => {
      it('should create session with user only', async () => {
        const session = await strategy.createSession(mockUser);

        expect(session).toBeDefined();
        expect(session.user).toEqual(mockUser);
        expect(session.expires).toBeDefined();
        expect(new Date(session.expires).getTime()).toBeGreaterThan(Date.now());
      });

      it('should create session with user and account', async () => {
        const session = await strategy.createSession(mockUser, mockAccount);

        expect(session).toBeDefined();
        expect(session.user).toEqual(mockUser);
        expect(session.accessToken).toBe(mockAccount.access_token);
        expect(session.refreshToken).toBe(mockAccount.refresh_token);
        expect(session.expires).toBeDefined();
      });

      it('should create session without role when user has no role', async () => {
        const userWithoutRole = { ...mockUser, role: undefined };
        const session = await strategy.createSession(userWithoutRole);

        expect(session).toBeDefined();
        expect(session.user).toEqual(userWithoutRole);
      });

      it('should handle account without tokens', async () => {
        const accountWithoutTokens = {
          provider: 'github',
          providerAccountId: '12345',
        };
        const session = await strategy.createSession(mockUser, accountWithoutTokens);

        expect(session).toBeDefined();
        expect(session.accessToken).toBeUndefined();
        expect(session.refreshToken).toBeUndefined();
      });

      it('should handle account with non-string tokens', async () => {
        const accountWithInvalidTokens = {
          provider: 'github',
          providerAccountId: '12345',
          access_token: 123, // Non-string
          refresh_token: null, // Non-string
        };
        const session = await strategy.createSession(mockUser, accountWithInvalidTokens);

        expect(session).toBeDefined();
        expect(session.accessToken).toBeUndefined();
        expect(session.refreshToken).toBeUndefined();
      });
    });

    describe('getSession', () => {
      beforeEach(() => {
        vi.mocked(cookiesModule.getSessionCookie).mockReturnValue('test-token');
        vi.mocked(securityModule.decodeJWT).mockResolvedValue({
          sub: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          picture: mockUser.image,
          role: mockUser.role,
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
          iat: Math.floor(Date.now() / 1000),
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        });
      });

      it('should get valid session from NextRequest', async () => {
        const session = await strategy.getSession(mockRequest);

        expect(session).toBeDefined();
        expect(session!.user.id).toBe(mockUser.id);
        expect(session!.user.name).toBe(mockUser.name);
        expect(session!.user.email).toBe(mockUser.email);
        expect(session!.accessToken).toBe('access-token');
        expect(session!.refreshToken).toBe('refresh-token');
      });

      it('should get valid session from NextApiRequest', async () => {
        const session = await strategy.getSession(mockApiRequest);

        expect(session).toBeDefined();
        expect(session!.user).toMatchObject({
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
        });
      });

      it('should return null when no session cookie for JWT', async () => {
        vi.mocked(cookiesModule.getSessionCookie).mockReturnValue(null);

        const session = await strategy.getSession(mockRequest);

        expect(session).toBeNull();
      });

      it('should return null when JWT is invalid', async () => {
        vi.mocked(securityModule.decodeJWT).mockRejectedValue(new Error('Invalid JWT'));

        const session = await strategy.getSession(mockRequest);

        expect(session).toBeNull();
      });

      it('should return null when JWT has no sub', async () => {
        vi.mocked(securityModule.decodeJWT).mockResolvedValue({
          name: 'John',
          exp: Date.now() + 3600,
        });

        const session = await strategy.getSession(mockRequest);

        expect(session).toBeNull();
      });

      it('should return null when JWT is expired', async () => {
        vi.mocked(securityModule.decodeJWT).mockResolvedValue({
          sub: mockUser.id,
          exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        });

        const session = await strategy.getSession(mockRequest);

        expect(session).toBeNull();
      });

      it('should handle JWT with minimal user data', async () => {
        vi.mocked(securityModule.decodeJWT).mockResolvedValue({
          sub: 'user-456',
          exp: Math.floor(Date.now() / 1000) + 3600,
        });

        const session = await strategy.getSession(mockRequest);

        expect(session).toBeDefined();
        expect(session!.user.id).toBe('user-456');
        expect(session!.user.name).toBeNull();
        expect(session!.user.email).toBeNull();
      });
    });

    describe('updateSession', () => {
      it('should update session data', async () => {
        const originalSession: Session = {
          user: mockUser,
          expires: new Date(Date.now() + 86400000 * 20).toISOString(), // 20 days - not close to expiring
        };

        const updates = {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        };

        const updatedSession = await strategy.updateSession(originalSession, updates);

        expect(updatedSession.user).toEqual(originalSession.user);
        expect(updatedSession.accessToken).toBe(updates.accessToken);
        expect(updatedSession.refreshToken).toBe(updates.refreshToken);
        expect(updatedSession.expires).toBe(originalSession.expires); // Should not change when not close to expiring
      });

      it('should refresh expiry when session is close to expiring', async () => {
        const soonToExpireSession: Session = {
          user: mockUser,
          expires: new Date(Date.now() + 3600000).toISOString(), // 1 hour - close to expiring
        };

        const updatedSession = await strategy.updateSession(soonToExpireSession, {});

        expect(updatedSession.expires).not.toBe(soonToExpireSession.expires);
        expect(new Date(updatedSession.expires).getTime()).toBeGreaterThan(
          new Date(soonToExpireSession.expires).getTime()
        );
      });
    });

    describe('deleteSession', () => {
      it('should delete session cookie for NextRequest/NextResponse', async () => {
        await strategy.deleteSession(mockRequest, mockResponse);

        expect(cookiesModule.deleteSessionCookie).toHaveBeenCalledWith(mockResponse);
      });

      it('should delete session cookie for NextApiRequest/NextApiResponse', async () => {
        await strategy.deleteSession(mockApiRequest, mockApiResponse);

        expect(cookiesModule.deleteSessionCookie).toHaveBeenCalledWith(mockApiResponse);
      });
    });

    describe('refreshSession', () => {
      it('should refresh session with new expiry', async () => {
        const originalSession: Session = {
          user: mockUser,
          expires: new Date(Date.now() + 3600000).toISOString(),
          accessToken: 'old-access-token',
          refreshToken: 'old-refresh-token',
        };

        const refreshedSession = await strategy.refreshSession(originalSession);

        expect(refreshedSession).toBeDefined();
        expect(refreshedSession.user).toEqual(mockUser);
        expect(new Date(refreshedSession.expires).getTime()).toBeGreaterThan(
          new Date(originalSession.expires).getTime()
        );
        expect(refreshedSession.accessToken).toBe(originalSession.accessToken);
        expect(refreshedSession.refreshToken).toBe(originalSession.refreshToken);
      });

      it('should refresh session without tokens', async () => {
        const sessionWithoutTokens: Session = {
          user: mockUser,
          expires: new Date(Date.now() + 3600000).toISOString(),
        };

        const refreshedSession = await strategy.refreshSession(sessionWithoutTokens);

        expect(refreshedSession).toBeDefined();
        expect(refreshedSession.accessToken).toBeUndefined();
        expect(refreshedSession.refreshToken).toBeUndefined();
      });
    });
  });

  describe('DatabaseSessionStrategy', () => {
    let strategy: DatabaseSessionStrategy;
    let mockAdapter: any;

    beforeEach(() => {
      mockAdapter = {
        createUser: vi.fn(),
        getUser: vi.fn(),
        getUserByEmail: vi.fn(),
        getUserByAccount: vi.fn(),
        updateUser: vi.fn(),
        deleteUser: vi.fn(),
        linkAccount: vi.fn(),
        unlinkAccount: vi.fn(),
        createSession: vi.fn(),
        getSessionAndUser: vi.fn(),
        updateSession: vi.fn(),
        deleteSession: vi.fn(),
        createVerificationToken: vi.fn(),
        useVerificationToken: vi.fn(),
      };

      strategy = new DatabaseSessionStrategy({
        adapter: mockAdapter,
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      vi.clearAllMocks();
    });

    describe('Constructor', () => {
      it('should create strategy with adapter', () => {
        expect(strategy).toBeDefined();
      });

      it('should create strategy with default maxAge', () => {
        const defaultStrategy = new DatabaseSessionStrategy({ adapter: mockAdapter });
        expect(defaultStrategy).toBeDefined();
      });
    });

    describe('createSession', () => {
      beforeEach(() => {
        mockAdapter.createSession.mockResolvedValue({
          sessionToken: 'session-token-123',
          userId: mockUser.id,
          expires: new Date(Date.now() + 86400000),
        });
      });

      it('should create database session with user only', async () => {
        const session = await strategy.createSession(mockUser);

        expect(session).toBeDefined();
        expect(session.user).toEqual(mockUser);
        expect(session.expires).toBeDefined();
        expect(mockAdapter.createSession).toHaveBeenCalledWith({
          sessionToken: expect.any(String),
          userId: mockUser.id,
          expires: expect.any(Date),
        });
      });

      it('should create database session with user and account', async () => {
        const session = await strategy.createSession(mockUser, mockAccount);

        expect(session).toBeDefined();
        expect(session.user).toEqual(mockUser);
        expect(session.accessToken).toBe(mockAccount.access_token);
        expect(session.refreshToken).toBe(mockAccount.refresh_token);
      });

      it('should throw error when adapter does not support session creation', async () => {
        const adapterWithoutCreate = { ...mockAdapter, createSession: undefined };
        const strategyWithoutCreate = new DatabaseSessionStrategy({
          adapter: adapterWithoutCreate,
        });

        await expect(strategyWithoutCreate.createSession(mockUser)).rejects.toThrow(
          'Database adapter does not support session creation'
        );
      });
    });

    describe('getSession', () => {
      beforeEach(() => {
        vi.mocked(cookiesModule.getSessionCookie).mockReturnValue('session-token-123');
        vi.mocked(securityModule.isExpired).mockReturnValue(false);

        mockAdapter.getSessionAndUser.mockResolvedValue({
          session: {
            sessionToken: 'session-token-123',
            userId: mockUser.id,
            expires: new Date(Date.now() + 86400000).toISOString(),
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
          },
          user: mockUser,
        });
      });

      it('should get session from database', async () => {
        const session = await strategy.getSession(mockRequest);

        expect(session).toBeDefined();
        expect(session!.user).toEqual(mockUser);
        expect(session!.accessToken).toBe('access-token');
        expect(session!.refreshToken).toBe('refresh-token');
        expect(mockAdapter.getSessionAndUser).toHaveBeenCalledWith('session-token-123');
      });

      it('should return null when no session cookie for database', async () => {
        vi.mocked(cookiesModule.getSessionCookie).mockReturnValue(null);

        const session = await strategy.getSession(mockRequest);

        expect(session).toBeNull();
      });

      it('should throw error when adapter does not support session retrieval', async () => {
        const adapterWithoutGet = { ...mockAdapter, getSessionAndUser: undefined };
        const strategyWithoutGet = new DatabaseSessionStrategy({
          adapter: adapterWithoutGet,
        });

        await expect(strategyWithoutGet.getSession(mockRequest)).rejects.toThrow(
          'Database adapter does not support session retrieval'
        );
      });

      it('should return null when session not found in database', async () => {
        mockAdapter.getSessionAndUser.mockResolvedValue(null);

        const session = await strategy.getSession(mockRequest);

        expect(session).toBeNull();
      });

      it('should handle expired session by deleting it', async () => {
        vi.mocked(securityModule.isExpired).mockReturnValue(true);

        mockAdapter.getSessionAndUser.mockResolvedValue({
          session: {
            sessionToken: 'session-token-123',
            userId: mockUser.id,
            expires: new Date(Date.now() - 86400000).toISOString(), // Expired
          },
          user: mockUser,
        });

        const session = await strategy.getSession(mockRequest);

        expect(session).toBeNull();
        expect(mockAdapter.deleteSession).toHaveBeenCalledWith('session-token-123');
      });

      it('should handle database error gracefully', async () => {
        mockAdapter.getSessionAndUser.mockRejectedValue(new Error('Database error'));

        const session = await strategy.getSession(mockRequest);

        expect(session).toBeNull();
      });

      it('should handle session without tokens', async () => {
        mockAdapter.getSessionAndUser.mockResolvedValue({
          session: {
            sessionToken: 'session-token-123',
            userId: mockUser.id,
            expires: new Date(Date.now() + 86400000).toISOString(),
          },
          user: mockUser,
        });

        const session = await strategy.getSession(mockRequest);

        expect(session).toBeDefined();
        expect(session!.accessToken).toBeUndefined();
        expect(session!.refreshToken).toBeUndefined();
      });
    });

    describe('updateSession', () => {
      it('should throw error when adapter does not support updates', async () => {
        const adapterWithoutUpdate = { ...mockAdapter, updateSession: undefined };
        const strategyWithoutUpdate = new DatabaseSessionStrategy({
          adapter: adapterWithoutUpdate,
        });

        const session: Session = {
          user: mockUser,
          expires: new Date(Date.now() + 3600000).toISOString(),
        };

        await expect(strategyWithoutUpdate.updateSession(session, {})).rejects.toThrow(
          'Database adapter does not support session updates'
        );
      });

      it('should throw implementation error for database session update', async () => {
        const session: Session = {
          user: mockUser,
          expires: new Date(Date.now() + 3600000).toISOString(),
        };

        await expect(strategy.updateSession(session, {})).rejects.toThrow(
          'Database session update requires request context'
        );
      });
    });

    describe('deleteSession', () => {
      beforeEach(() => {
        vi.mocked(cookiesModule.getSessionCookie).mockReturnValue('session-token-123');
      });

      it('should delete session from database', async () => {
        await strategy.deleteSession(mockRequest, mockResponse);

        expect(mockAdapter.deleteSession).toHaveBeenCalledWith('session-token-123');
      });

      it('should handle missing session token', async () => {
        vi.mocked(cookiesModule.getSessionCookie).mockReturnValue(null);

        await strategy.deleteSession(mockRequest, mockResponse);

        expect(mockAdapter.deleteSession).not.toHaveBeenCalled();
      });

      it('should handle adapter without delete support', async () => {
        const adapterWithoutDelete = { ...mockAdapter, deleteSession: undefined };
        const strategyWithoutDelete = new DatabaseSessionStrategy({
          adapter: adapterWithoutDelete,
        });

        // Should not throw error, just skip deletion
        await expect(
          strategyWithoutDelete.deleteSession(mockRequest, mockResponse)
        ).resolves.not.toThrow();
      });
    });
  });
});
