/**
 * OAuth Providers Integration Tests
 * Tests OAuth authentication flows for various providers
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GitHub, Google, LinkedIn, Microsoft } from '../../providers';
import { generatePKCE, verifyPKCE } from '../../index';
import {
  MockDatabase,
  createMockAdapter,
  _createMockRequest,
  _createMockResponse,
  setupTestEnvironment,
  teardownTestEnvironment,
  testProviders,
} from './setup';
import type { OAuthProvider, _OAuthConfig } from '../../types';

describe('OAuth Providers Integration Tests', () => {
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
    vi.restoreAllMocks();
    teardownTestEnvironment();
  });

  describe('GitHub OAuth Flow', () => {
    let provider: OAuthProvider;

    beforeEach(() => {
      provider = GitHub({
        clientId: testProviders.github.clientId,
        clientSecret: testProviders.github.clientSecret,
      });
    });

    it('should generate correct authorization URL', () => {
      const authUrl = provider.authorization?.url || provider.authorization;
      const url = new URL(authUrl as string);

      expect(url.hostname).toBe('github.com');
      expect(url.pathname).toBe('/login/oauth/authorize');
    });

    it('should handle complete OAuth flow with PKCE', async () => {
      // Generate PKCE pair
      const { codeVerifier, codeChallenge } = generatePKCE();

      // Build authorization URL with PKCE
      const authUrl = new URL(provider.authorization?.url || (provider.authorization as string));
      authUrl.searchParams.set('client_id', testProviders.github.clientId);
      authUrl.searchParams.set('redirect_uri', 'http://localhost:3000/api/auth/callback/github');
      authUrl.searchParams.set('scope', 'read:user user:email');
      authUrl.searchParams.set('state', 'test-state-123');
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');

      // Mock GitHub's OAuth token endpoint
      vi.spyOn(global, 'fetch').mockImplementation(async (url, _options) => {
        const urlString = url.toString();

        if (urlString.includes('github.com/login/oauth/access_token')) {
          // Verify PKCE code verifier is sent
          const body = new URLSearchParams(options?.body as string);
          expect(body.get('code_verifier')).toBe(codeVerifier);
          expect(body.get('code')).toBe('test-auth-code');
          expect(body.get('client_id')).toBe(testProviders.github.clientId);
          expect(body.get('client_secret')).toBe(testProviders.github.clientSecret);

          return new Response(
            JSON.stringify({
              access_token: 'github-access-token-123',
              token_type: 'bearer',
              scope: 'read:user,user:email',
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }
          );
        }

        if (urlString.includes('api.github.com/user')) {
          // Verify authorization header
          const authHeader =
            options?.headers?.['Authorization'] || options?.headers?.['authorization'];
          expect(authHeader).toBe('Bearer github-access-token-123');

          return new Response(
            JSON.stringify({
              id: 12345,
              login: 'testuser',
              name: 'Test User',
              email: 'test@github.com',
              avatar_url: 'https://avatars.githubusercontent.com/u/12345',
              bio: 'Test bio',
              company: 'Test Company',
              blog: 'https://test.blog',
              location: 'Test Location',
              public_repos: 42,
              followers: 100,
              following: 50,
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }
          );
        }

        if (urlString.includes('api.github.com/user/emails')) {
          return new Response(
            JSON.stringify([
              {
                email: 'test@github.com',
                primary: true,
                verified: true,
                visibility: 'public',
              },
              {
                email: 'secondary@github.com',
                primary: false,
                verified: true,
                visibility: null,
              },
            ]),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }
          );
        }

        return new Response('Not Found', { status: 404 });
      });

      // Simulate token exchange
      const tokenResponse = await fetch(provider.token?.url || (provider.token as string), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: testProviders.github.clientId,
          client_secret: testProviders.github.clientSecret,
          code: 'test-auth-code',
          redirect_uri: 'http://localhost:3000/api/auth/callback/github',
          code_verifier: codeVerifier,
        }).toString(),
      });

      const tokens = await tokenResponse.json();
      expect(tokens.access_token).toBe('github-access-token-123');

      // Get user profile
      const _profileResponse = await fetch(
        provider.userinfo?.url || (provider.userinfo as string),
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        }
      );

      const _profile = await profileResponse.json();
      expect(profile.login).toBe('testuser');
      expect(profile.email).toBe('test@github.com');

      // Process profile with provider's profile callback
      const user = await provider.profile?.(profile, tokens);
      expect(user).toMatchObject({
        id: '12345',
        name: 'Test User',
        email: 'test@github.com',
        image: 'https://avatars.githubusercontent.com/u/12345',
      });
    });

    it('should handle user without public email', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(async url => {
        const urlString = url.toString();

        if (urlString.includes('api.github.com/user')) {
          return new Response(
            JSON.stringify({
              id: 12345,
              login: 'testuser',
              name: 'Test User',
              email: null, // No public email
              avatar_url: 'https://avatars.githubusercontent.com/u/12345',
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }
          );
        }

        if (urlString.includes('api.github.com/user/emails')) {
          return new Response(
            JSON.stringify([
              {
                email: 'private@github.com',
                primary: true,
                verified: true,
                visibility: null,
              },
            ]),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }
          );
        }

        return new Response('Not Found', { status: 404 });
      });

      // Should fetch email from emails endpoint
      const _profileResponse = await fetch(
        provider.userinfo?.url || (provider.userinfo as string),
        {
          headers: {
            Authorization: 'Bearer test-token',
          },
        }
      );
      const _profile = await profileResponse.json();

      // Get emails separately
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: 'Bearer test-token',
        },
      });
      const emails = await emailsResponse.json();

      // Provider should use primary verified email
      const primaryEmail = Array.isArray(emails)
        ? emails.find((e: any) => e.primary && e.verified)?.email
        : null;
      const userProfile = {
        ...profile,
        email: primaryEmail || null,
      };

      const user = await provider.profile?.(userProfile, {});
      // When email is null, the provider returns null
      expect(user?.email).toBeNull();
    });
  });

  describe('Google OAuth Flow', () => {
    let provider: OAuthProvider;

    beforeEach(() => {
      provider = Google({
        clientId: testProviders.google.clientId,
        clientSecret: testProviders.google.clientSecret,
      });
    });

    it('should use OpenID Connect for authentication', () => {
      // Google uses OpenID Connect with JWT tokens
      expect(provider.checks).toContain('nonce');
      expect(provider.enablePKCE).toBe(true);
    });

    it('should handle Google OAuth flow with ID token', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(async (url, _options) => {
        const urlString = url.toString();

        if (urlString.includes('oauth2.googleapis.com/token')) {
          const body = new URLSearchParams(options?.body as string);
          expect(body.get('grant_type')).toBe('authorization_code');

          return new Response(
            JSON.stringify({
              access_token: 'google-access-token-123',
              id_token:
                'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhdWQiOiJ0ZXN0LWdvb2dsZS1jbGllbnQtaWQiLCJzdWIiOiIxMTc1NDM4MTYyNDM2NzI5MTIzNDUiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJUZXN0IFVzZXIiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvdGVzdCIsImdpdmVuX25hbWUiOiJUZXN0IiwiZmFtaWx5X25hbWUiOiJVc2VyIiwibG9jYWxlIjoiZW4ifQ.signature',
              token_type: 'Bearer',
              expires_in: 3599,
              scope: 'openid email profile',
              refresh_token: 'google-refresh-token-123',
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }
          );
        }

        if (urlString.includes('www.googleapis.com/oauth2/v1/userinfo')) {
          return new Response(
            JSON.stringify({
              id: '117543816243672912345',
              email: 'test@gmail.com',
              verified_email: true,
              name: 'Test User',
              given_name: 'Test',
              family_name: 'User',
              picture: 'https://lh3.googleusercontent.com/a/test',
              locale: 'en',
              hd: 'example.com', // Google Workspace domain
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }
          );
        }

        return new Response('Not Found', { status: 404 });
      });

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: testProviders.google.clientId,
          client_secret: testProviders.google.clientSecret,
          code: 'test-auth-code',
          redirect_uri: 'http://localhost:3000/api/auth/callback/google',
          grant_type: 'authorization_code',
        }).toString(),
      });

      const tokens = await tokenResponse.json();
      expect(tokens.access_token).toBe('google-access-token-123');
      expect(tokens.id_token).toBeDefined();

      // Decode ID token (simplified - in real app would verify signature)
      const idTokenPayload = JSON.parse(
        Buffer.from(tokens.id_token.split('.')[1], 'base64').toString()
      );
      expect(idTokenPayload.email).toBe('test@gmail.com');
      expect(idTokenPayload.email_verified).toBe(true);

      // Get user profile
      const _profileResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      const _profile = await profileResponse.json();

      // Use the ID token payload for Google (OpenID Connect)
      const idTokenProfile = {
        sub: '117543816243672912345',
        name: 'Test User',
        email: 'test@gmail.com',
        picture: 'https://lh3.googleusercontent.com/a/test',
        email_verified: true,
      };

      const user = await provider.profile?.(idTokenProfile, tokens);

      expect(user).toBeDefined();
      expect(user?.id).toBe('117543816243672912345');
      expect(user?.name).toBe('Test User');
      expect(user?.email).toBe('test@gmail.com');
      expect(user?.image).toBe('https://lh3.googleusercontent.com/a/test');
    });

    it('should handle Google Workspace restrictions', async () => {
      const workspaceProvider = Google({
        clientId: testProviders.google.clientId,
        clientSecret: testProviders.google.clientSecret,
        authorization: {
          params: {
            hd: 'company.com', // Restrict to company.com domain
          },
        },
      });

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

    it('should handle LinkedIn OAuth flow', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(async (url, _options) => {
        const urlString = url.toString();

        if (urlString.includes('linkedin.com/oauth/v2/accessToken')) {
          return new Response(
            JSON.stringify({
              access_token: 'linkedin-access-token-123',
              expires_in: 5184000, // 60 days
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }
          );
        }

        if (urlString.includes('api.linkedin.com/v2/userinfo')) {
          return new Response(
            JSON.stringify({
              sub: 'linkedin-user-123',
              name: 'Test LinkedIn User',
              given_name: 'Test',
              family_name: 'LinkedIn User',
              picture: 'https://media.licdn.com/dms/image/test',
              email: 'test@linkedin.com',
              email_verified: true,
              locale: {
                country: 'US',
                language: 'en',
              },
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }
          );
        }

        return new Response('Not Found', { status: 404 });
      });

      const tokens = {
        access_token: 'linkedin-access-token-123',
        expires_in: 5184000,
      };

      const _profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      const _profile = await profileResponse.json();

      // LinkedIn v2 API returns different structure
      const linkedInProfile = {
        id: 'linkedin-user-123',
        firstName: {
          localized: { en_US: 'Test' },
        },
        lastName: {
          localized: { en_US: 'LinkedIn User' },
        },
        profilePicture: {
          'displayImage~': {
            elements: [
              {
                identifiers: [
                  {
                    identifier: 'https://media.licdn.com/dms/image/test',
                  },
                ],
              },
            ],
          },
        },
      };

      const user = await provider.profile?.(linkedInProfile, tokens);

      expect(user).toBeDefined();
      expect(user?.id).toBe('linkedin-user-123');
      expect(user?.name).toBe('Test LinkedIn User');
      expect(user?.email).toBeNull(); // LinkedIn requires separate API call for email
      expect(user?.image).toBe('https://media.licdn.com/dms/image/test');
    });
  });

  describe('Microsoft OAuth Flow', () => {
    let provider: OAuthProvider;

    beforeEach(() => {
      provider = Microsoft({
        clientId: 'test-microsoft-client',
        clientSecret: 'test-microsoft-secret',
        tenantId: 'common', // Multi-tenant
      });
    });

    it('should handle Microsoft/Azure AD OAuth flow', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(async (url, _options) => {
        const urlString = url.toString();

        if (urlString.includes('login.microsoftonline.com') && urlString.includes('/token')) {
          return new Response(
            JSON.stringify({
              access_token: 'microsoft-access-token-123',
              id_token: 'microsoft-id-token',
              token_type: 'Bearer',
              expires_in: 3600,
              scope: 'openid profile email User.Read',
              refresh_token: 'microsoft-refresh-token-123',
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }
          );
        }

        if (urlString.includes('graph.microsoft.com/v1.0/me')) {
          return new Response(
            JSON.stringify({
              id: 'microsoft-user-123',
              displayName: 'Test Microsoft User',
              givenName: 'Test',
              surname: 'Microsoft User',
              mail: 'test@microsoft.com',
              userPrincipalName: 'test@microsoft.com',
              businessPhones: ['+1234567890'],
              jobTitle: 'Software Engineer',
              officeLocation: 'Building 1',
              preferredLanguage: 'en-US',
            }),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }
          );
        }

        if (urlString.includes('graph.microsoft.com/v1.0/me/photo/$value')) {
          // Return a mock image
          return new Response('mock-image-data', {
            status: 200,
            headers: { 'content-type': 'image/jpeg' },
          });
        }

        return new Response('Not Found', { status: 404 });
      });

      const tokens = {
        access_token: 'microsoft-access-token-123',
        id_token: 'microsoft-id-token',
      };

      // Microsoft uses OpenID Connect, so the profile comes from the userinfo endpoint
      const _profile = {
        sub: 'microsoft-user-123', // OpenID Connect sub field
        name: 'Test Microsoft User',
        email: 'test@microsoft.com',
        picture: null,
      };

      const user = await provider.profile?.(profile, tokens);

      expect(user).toBeDefined();
      expect(user?.id).toBe('microsoft-user-123');
      expect(user?.name).toBe('Test Microsoft User');
      expect(user?.email).toBe('test@microsoft.com');
    });

    it('should handle single-tenant configuration', () => {
      const singleTenantProvider = Microsoft({
        clientId: 'test-client',
        clientSecret: 'test-secret',
        tenantId: 'specific-tenant-id',
      });

      const authUrl = singleTenantProvider.authorization?.url || singleTenantProvider.authorization;
      expect(authUrl).toContain('specific-tenant-id');
    });
  });

  describe('Provider Error Handling', () => {
    it('should handle network errors during token exchange', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      const provider = GitHub({
        clientId: 'test-client',
        clientSecret: 'test-secret',
      });

      await expect(
        fetch(provider.token?.url || (provider.token as string), {
          method: 'POST',
          body: new URLSearchParams({
            code: 'test-code',
          }).toString(),
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle invalid token response', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({
            error: 'invalid_grant',
            error_description: 'The provided authorization code is invalid.',
          }),
          {
            status: 400,
            headers: { 'content-type': 'application/json' },
          }
        )
      );

      const provider = Google({
        clientId: 'test-client',
        clientSecret: 'test-secret',
      });

      const response = await fetch(provider.token?.url || 'https://oauth2.googleapis.com/token', {
        method: 'POST',
        body: new URLSearchParams({
          code: 'invalid-code',
        }).toString(),
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toBe('invalid_grant');
    });

    it('should handle rate limiting', async () => {
      let requestCount = 0;
      vi.spyOn(global, 'fetch').mockImplementation(async () => {
        requestCount++;
        if (requestCount <= 2) {
          return new Response('Too Many Requests', {
            status: 429,
            headers: {
              'Retry-After': '60',
              'X-RateLimit-Remaining': '0',
            },
          });
        }
        return new Response(
          JSON.stringify({
            access_token: 'success-token',
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }
        );
      });

      // First attempt - rate limited
      let response = await fetch('https://api.example.com/token');
      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');

      // Second attempt - still rate limited
      response = await fetch('https://api.example.com/token');
      expect(response.status).toBe(429);

      // Third attempt - succeeds
      response = await fetch('https://api.example.com/token');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.access_token).toBe('success-token');
    });
  });

  describe('PKCE Security', () => {
    it('should generate valid PKCE challenge and verifier', () => {
      const { codeVerifier, codeChallenge } = generatePKCE();

      // Verify code verifier length (43-128 characters)
      expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
      expect(codeVerifier.length).toBeLessThanOrEqual(128);

      // Verify code verifier contains only allowed characters
      expect(/^[A-Za-z0-9\-._~]+$/.test(codeVerifier)).toBe(true);

      // Verify code challenge is base64url encoded
      expect(/^[A-Za-z0-9\-_]+$/.test(codeChallenge)).toBe(true);

      // Verify challenge can be verified
      const isValid = verifyPKCE(codeVerifier, codeChallenge);
      expect(isValid).toBe(true);
    });

    it('should reject invalid PKCE verification', () => {
      const { codeChallenge } = generatePKCE();
      const wrongVerifier = 'wrong-verifier-value';

      const isValid = verifyPKCE(wrongVerifier, codeChallenge);
      expect(isValid).toBe(false);
    });

    it('should generate unique PKCE pairs', () => {
      const pairs = Array.from({ length: 10 }, () => generatePKCE());

      const verifiers = pairs.map(p => p.codeVerifier);
      const challenges = pairs.map(p => p.codeChallenge);

      // All should be unique
      expect(new Set(verifiers).size).toBe(10);
      expect(new Set(challenges).size).toBe(10);
    });
  });

  describe('Multi-Provider Scenarios', () => {
    it('should handle provider switching', async () => {
      // Create user with GitHub
      const githubUser = await mockAdapter.createUser({
        email: 'test@example.com',
        name: 'Test User',
      });

      await mockAdapter.linkAccount({
        userId: githubUser.id,
        provider: 'github',
        providerAccountId: 'github-123',
        type: 'oauth',
        access_token: 'github-token',
      });

      // Same user links Google account
      await mockAdapter.linkAccount({
        userId: githubUser.id,
        provider: 'google',
        providerAccountId: 'google-456',
        type: 'oauth',
        access_token: 'google-token',
      });

      // Verify both accounts are linked
      const githubLinked = await mockAdapter.getUserByAccount({
        provider: 'github',
        providerAccountId: 'github-123',
      });
      const googleLinked = await mockAdapter.getUserByAccount({
        provider: 'google',
        providerAccountId: 'google-456',
      });

      expect(githubLinked?.id).toBe(githubUser.id);
      expect(googleLinked?.id).toBe(githubUser.id);
    });

    it('should prevent duplicate provider linking', async () => {
      const user = await mockAdapter.createUser({
        email: 'test@example.com',
        name: 'Test User',
      });

      // Link GitHub account
      await mockAdapter.linkAccount({
        userId: user.id,
        provider: 'github',
        providerAccountId: 'github-123',
        type: 'oauth',
        access_token: 'github-token-1',
      });

      // Try to link same GitHub account again (should update, not duplicate)
      await mockAdapter.linkAccount({
        userId: user.id,
        provider: 'github',
        providerAccountId: 'github-123',
        type: 'oauth',
        access_token: 'github-token-2', // New token
      });

      const accounts = db.getUserAccounts(user.id);
      // Should still have only one GitHub account
      const githubAccounts = accounts.filter(a => a.provider === 'github');
      expect(githubAccounts).toHaveLength(1);
      expect(githubAccounts[0].access_token).toBe('github-token-2'); // Should be updated
    });
  });
});
