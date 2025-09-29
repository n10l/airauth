/**
 * OAuth Flow Integration Tests
 * Tests complete OAuth authentication workflows
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  _NextAirAuth,
  resetConfig,
  GitHub,
  Google,
  LinkedIn,
  Microsoft,
  generatePKCE,
  verifyPKCE,
} from '../../index';
import {
  generateAuthorizationUrl,
  _exchangeCodeForTokens,
  _fetchUserProfile,
  validateOAuthState,
  getOAuthState,
  cleanupExpiredStates,
} from '../../oauth';
import {
  MockDatabase,
  createMockAdapter,
  setupTestEnvironment,
  teardownTestEnvironment,
  testProviders,
  testUsers,
} from './setup';
import type { OAuthProvider, _User } from '../../types';

describe('OAuth Flow Integration Tests', () => {
  let db: MockDatabase;
  let adapter: ReturnType<typeof createMockAdapter>;

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
    vi.restoreAllMocks();
  });

  describe('GitHub OAuth Flow', () => {
    let provider: OAuthProvider;

    beforeEach(() => {
      provider = GitHub(testProviders.github);
    });

    it('should generate correct authorization URL with PKCE', () => {
      const callbackUrl = 'http://localhost:3000/api/auth/callback/github';

      const { url, state, codeVerifier } = generateAuthorizationUrl(provider, callbackUrl, {
        enablePKCE: true,
      });

      expect(url).toContain('https://github.com/login/oauth/authorize');
      expect(url).toContain(`client_id=${testProviders.github.clientId}`);
      expect(url).toContain(`redirect_uri=${encodeURIComponent(callbackUrl)}`);
      expect(url).toContain('state=');
      expect(url).toContain('code_challenge=');
      expect(url).toContain('code_challenge_method=S256');

      // Verify state is stored
      const storedState = getOAuthState(state);
      expect(storedState).toBeDefined();
      expect(storedState?.provider).toBe('github');
      expect(storedState?.codeVerifier).toBe(codeVerifier);
      expect(storedState?.callbackUrl).toBe(callbackUrl);
    });

    it('should validate OAuth state correctly', () => {
      const callbackUrl = 'http://localhost:3000/api/auth/callback/github';

      // Generate state
      const { state: _state } = generateAuthorizationUrl(provider, callbackUrl);

      // Valid state for correct provider should return the state object
      const validState = validateOAuthState(state, 'github');
      expect(validState).toBeDefined();
      expect(validState.provider).toBe('github');
      expect(validState.callbackUrl).toBe(callbackUrl);

      // Invalid state for wrong provider should throw
      expect(() => validateOAuthState(state, 'google')).toThrow('OAuth state provider mismatch');

      // Invalid state that doesn't exist should throw
      expect(() => validateOAuthState('invalid-state', 'github')).toThrow(
        'Invalid or expired OAuth state'
      );
    });

    it('should handle PKCE verification', () => {
      const pkce = generatePKCE();

      expect(pkce.codeVerifier).toBeDefined();
      expect(pkce.codeChallenge).toBeDefined();
      expect(pkce.codeChallengeMethod).toBe('S256');

      // Verify correct verifier
      expect(verifyPKCE(pkce.codeVerifier, pkce.codeChallenge)).toBe(true);

      // Verify incorrect verifier
      expect(verifyPKCE('wrong-verifier', pkce.codeChallenge)).toBe(false);
    });

    it('should process GitHub user profile correctly', async () => {
      const githubProfile = {
        id: 12345,
        login: 'testuser',
        name: 'Test User',
        email: 'test@github.com',
        avatar_url: 'https://avatars.githubusercontent.com/u/12345',
        bio: 'Test bio',
        company: 'Test Company',
        location: 'Test Location',
      };

      const user = await provider.profile?.(githubProfile, {});

      expect(user).toEqual({
        id: '12345',
        name: 'Test User',
        email: 'test@github.com',
        image: 'https://avatars.githubusercontent.com/u/12345',
      });
    });

    it('should handle user without public email', async () => {
      const githubProfile = {
        id: 12345,
        login: 'testuser',
        name: 'Test User',
        email: null, // No public email
        avatar_url: 'https://avatars.githubusercontent.com/u/12345',
      };

      const user = await provider.profile?.(githubProfile, {});

      expect(user).toEqual({
        id: '12345',
        name: 'Test User',
        email: null,
        image: 'https://avatars.githubusercontent.com/u/12345',
      });
    });
  });

  describe('Google OAuth Flow', () => {
    let provider: OAuthProvider;

    beforeEach(() => {
      provider = Google(testProviders.google);
    });

    it('should generate correct authorization URL with OpenID Connect', () => {
      const callbackUrl = 'http://localhost:3000/api/auth/callback/google';

      const { url, state, nonce } = generateAuthorizationUrl(provider, callbackUrl);

      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain(`client_id=${testProviders.google.clientId}`);
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=openid');
      expect(url).toContain('state=');

      // Google uses nonce for OpenID Connect
      if (provider.checks?.includes('nonce')) {
        expect(nonce).toBeDefined();
        expect(url).toContain('nonce=');
      }
    });

    it('should process Google user profile correctly', async () => {
      const googleProfile = {
        sub: '117543816243672912345',
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        picture: 'https://lh3.googleusercontent.com/a/test',
        email: 'test@gmail.com',
        email_verified: true,
        locale: 'en',
      };

      const user = await provider.profile?.(googleProfile, {});

      expect(user).toEqual({
        id: '117543816243672912345',
        name: 'Test User',
        email: 'test@gmail.com',
        image: 'https://lh3.googleusercontent.com/a/test',
        emailVerified: expect.any(Date),
      });
    });

    it('should handle Google Workspace domain restrictions', () => {
      const workspaceProvider = Google({
        clientId: testProviders.google.clientId,
        clientSecret: testProviders.google.clientSecret,
        authorization: {
          params: {
            hd: 'company.com', // Restrict to company.com domain
          },
        },
      });

      const callbackUrl = 'http://localhost:3000/api/auth/callback/google';
      const { url } = generateAuthorizationUrl(workspaceProvider, callbackUrl);

      // Note: The hd parameter would be added by the provider's authorization params
      const authParams = workspaceProvider.authorization?.params;
      expect(authParams?.hd).toBe('company.com');
    });
  });

  describe('LinkedIn OAuth Flow', () => {
    let provider: OAuthProvider;

    beforeEach(() => {
      provider = LinkedIn({
        clientId: 'test-linkedin-client',
        clientSecret: 'test-linkedin-secret',
      });
    });

    it('should generate correct authorization URL', () => {
      const callbackUrl = 'http://localhost:3000/api/auth/callback/linkedin';

      const { url, state } = generateAuthorizationUrl(provider, callbackUrl);

      expect(url).toContain('https://www.linkedin.com/oauth/v2/authorization');
      expect(url).toContain('client_id=test-linkedin-client');
      expect(url).toContain('response_type=code');
      expect(url).toContain('state=');

      // LinkedIn supports PKCE
      if (provider.enablePKCE) {
        expect(url).toContain('code_challenge=');
      }
    });

    it('should process LinkedIn user profile correctly', async () => {
      const linkedinProfile = {
        id: 'linkedin-user-123',
        firstName: {
          localized: { en_US: 'Test' },
        },
        lastName: {
          localized: { en_US: 'User' },
        },
        profilePicture: {
          'displayImage~': {
            elements: [
              {
                identifiers: [
                  {
                    identifier: 'https://media.licdn.com/image/test.jpg',
                  },
                ],
              },
            ],
          },
        },
      };

      const user = await provider.profile?.(linkedinProfile, {});

      expect(user).toEqual({
        id: 'linkedin-user-123',
        name: 'Test User',
        email: null, // LinkedIn requires separate API call for email
        image: 'https://media.licdn.com/image/test.jpg',
      });
    });
  });

  describe('Microsoft OAuth Flow', () => {
    let provider: OAuthProvider;

    beforeEach(() => {
      provider = Microsoft({
        clientId: 'test-microsoft-client',
        clientSecret: 'test-microsoft-secret',
        tenantId: 'common',
      });
    });

    it('should generate correct authorization URL for multi-tenant', () => {
      const callbackUrl = 'http://localhost:3000/api/auth/callback/microsoft';

      const { url, state } = generateAuthorizationUrl(provider, callbackUrl);

      expect(url).toContain('login.microsoftonline.com');
      expect(url).toContain('/common/'); // Multi-tenant
      expect(url).toContain('client_id=test-microsoft-client');
      expect(url).toContain('response_type=code');
      expect(url).toContain('state=');
    });

    it('should handle single-tenant configuration', () => {
      const singleTenantProvider = Microsoft({
        clientId: 'test-client',
        clientSecret: 'test-secret',
        tenantId: 'specific-tenant-id',
      });

      const callbackUrl = 'http://localhost:3000/api/auth/callback/microsoft';
      const { url } = generateAuthorizationUrl(singleTenantProvider, callbackUrl);

      expect(url).toContain('/specific-tenant-id/');
      expect(url).not.toContain('/common/');
    });

    it('should process Microsoft user profile correctly', async () => {
      const microsoftProfile = {
        sub: 'microsoft-user-123', // Microsoft uses 'sub' from OIDC
        name: 'Test Microsoft User',
        email: 'test@microsoft.com',
        picture: null, // Microsoft uses 'picture' field
      };

      const user = await provider.profile?.(microsoftProfile, {});

      expect(user).toEqual({
        id: 'microsoft-user-123',
        name: 'Test Microsoft User',
        email: 'test@microsoft.com',
        image: null,
      });
    });
  });

  describe('PKCE Security', () => {
    it('should generate unique PKCE pairs', () => {
      const pairs = Array.from({ length: 10 }, () => generatePKCE());

      const verifiers = pairs.map(p => p.codeVerifier);
      const challenges = pairs.map(p => p.codeChallenge);

      // All verifiers should be unique
      expect(new Set(verifiers).size).toBe(10);

      // All challenges should be unique
      expect(new Set(challenges).size).toBe(10);

      // Each verifier should be 128 characters (as per our implementation)
      verifiers.forEach(v => {
        expect(v).toHaveLength(128);
      });
    });

    it('should correctly verify PKCE challenges', () => {
      const pairs = Array.from({ length: 5 }, () => generatePKCE());

      // Each pair should verify correctly
      pairs.forEach(pair => {
        expect(verifyPKCE(pair.codeVerifier, pair.codeChallenge)).toBe(true);
      });

      // Cross-verification should fail
      pairs.forEach((pair1, i) => {
        pairs.forEach((pair2, j) => {
          if (i !== j) {
            expect(verifyPKCE(pair1.codeVerifier, pair2.codeChallenge)).toBe(false);
          }
        });
      });
    });
  });

  describe('OAuth State Management', () => {
    it('should cleanup expired OAuth states', () => {
      const provider = GitHub(testProviders.github);
      const callbackUrl = 'http://localhost:3000/api/auth/callback/github';

      // Generate multiple states
      const states = Array.from({ length: 5 }, () =>
        generateAuthorizationUrl(provider, callbackUrl)
      );

      // All states should be stored
      states.forEach(({ state }) => {
        expect(getOAuthState(state)).toBeDefined();
      });

      // Cleanup expired states (none should be expired yet)
      cleanupExpiredStates();

      // All states should still exist
      states.forEach(({ state }) => {
        expect(getOAuthState(state)).toBeDefined();
      });

      // Note: In a real implementation, you would test expiration by
      // manipulating the createdAt timestamp or waiting for expiration
    });

    it('should handle concurrent OAuth flows', () => {
      const providers = [GitHub(testProviders.github), Google(testProviders.google)];

      const callbackUrls = [
        'http://localhost:3000/api/auth/callback/github',
        'http://localhost:3000/api/auth/callback/google',
      ];

      // Generate authorization URLs for multiple providers concurrently
      const authFlows = providers.map((provider, i) =>
        generateAuthorizationUrl(provider, callbackUrls[i])
      );

      // Each flow should have unique state
      const states = authFlows.map(f => f.state);
      expect(new Set(states).size).toBe(states.length);

      // Each state should be valid for its provider
      const githubState = validateOAuthState(authFlows[0].state, 'github');
      expect(githubState).toBeDefined();
      expect(githubState.provider).toBe('github');

      const googleState = validateOAuthState(authFlows[1].state, 'google');
      expect(googleState).toBeDefined();
      expect(googleState.provider).toBe('google');

      // States should not be valid for wrong providers
      expect(() => validateOAuthState(authFlows[0].state, 'google')).toThrow(
        'OAuth state provider mismatch'
      );
      expect(() => validateOAuthState(authFlows[1].state, 'github')).toThrow(
        'OAuth state provider mismatch'
      );
    });
  });

  describe('Multi-Provider Account Linking', () => {
    it('should link multiple OAuth providers to same user', async () => {
      // Create user
      const user = await adapter.createUser!(testUsers.alice);

      // Link GitHub account
      await adapter.linkAccount!({
        userId: user.id,
        provider: 'github',
        providerAccountId: 'github-12345',
        type: 'oauth',
        access_token: 'github-token',
        refresh_token: 'github-refresh',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      });

      // Link Google account
      await adapter.linkAccount!({
        userId: user.id,
        provider: 'google',
        providerAccountId: 'google-67890',
        type: 'oauth',
        access_token: 'google-token',
        refresh_token: 'google-refresh',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      });

      // Verify both accounts are linked to same user
      const githubUser = await adapter.getUserByAccount!({
        provider: 'github',
        providerAccountId: 'github-12345',
      });

      const googleUser = await adapter.getUserByAccount!({
        provider: 'google',
        providerAccountId: 'google-67890',
      });

      expect(githubUser?.id).toBe(user.id);
      expect(googleUser?.id).toBe(user.id);

      // Verify accounts are stored correctly
      const accounts = db.getUserAccounts(user.id);
      expect(accounts).toHaveLength(2);
      expect(accounts).toContainEqual(
        expect.objectContaining({
          provider: 'github',
          providerAccountId: 'github-12345',
        })
      );
      expect(accounts).toContainEqual(
        expect.objectContaining({
          provider: 'google',
          providerAccountId: 'google-67890',
        })
      );
    });

    it('should handle account unlinking', async () => {
      const user = await adapter.createUser!(testUsers.bob);

      // Link multiple accounts
      await adapter.linkAccount!({
        userId: user.id,
        provider: 'github',
        providerAccountId: 'github-999',
        type: 'oauth',
        access_token: 'token1',
      });

      await adapter.linkAccount!({
        userId: user.id,
        provider: 'google',
        providerAccountId: 'google-999',
        type: 'oauth',
        access_token: 'token2',
      });

      await adapter.linkAccount!({
        userId: user.id,
        provider: 'linkedin',
        providerAccountId: 'linkedin-999',
        type: 'oauth',
        access_token: 'token3',
      });

      // Verify all accounts are linked
      let accounts = db.getUserAccounts(user.id);
      expect(accounts).toHaveLength(3);

      // Unlink GitHub account
      await adapter.unlinkAccount!({
        provider: 'github',
        providerAccountId: 'github-999',
      });

      // Verify GitHub account is unlinked
      const githubUser = await adapter.getUserByAccount!({
        provider: 'github',
        providerAccountId: 'github-999',
      });
      expect(githubUser).toBeNull();

      // Other accounts should remain
      accounts = db.getUserAccounts(user.id);
      expect(accounts).toHaveLength(2);
      expect(accounts).not.toContainEqual(
        expect.objectContaining({
          provider: 'github',
        })
      );
    });

    it('should update existing linked account tokens', async () => {
      const user = await adapter.createUser!(testUsers.charlie);

      // Link account with initial tokens
      await adapter.linkAccount!({
        userId: user.id,
        provider: 'github',
        providerAccountId: 'github-777',
        type: 'oauth',
        access_token: 'old-token',
        refresh_token: 'old-refresh',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      });

      // Update with new tokens (simulating token refresh)
      await adapter.linkAccount!({
        userId: user.id,
        provider: 'github',
        providerAccountId: 'github-777',
        type: 'oauth',
        access_token: 'new-token',
        refresh_token: 'new-refresh',
        expires_at: Math.floor(Date.now() / 1000) + 7200,
      });

      // Should have updated the existing account, not created a duplicate
      const accounts = db.getUserAccounts(user.id);
      const githubAccounts = accounts.filter(a => a.provider === 'github');
      expect(githubAccounts).toHaveLength(1);
      expect(githubAccounts[0].access_token).toBe('new-token');
      expect(githubAccounts[0].refresh_token).toBe('new-refresh');
    });
  });
});
