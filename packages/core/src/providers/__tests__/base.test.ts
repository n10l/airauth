/* eslint-disable no-console */
/**
 * Base provider tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BaseProvider,
  BaseOAuthProvider,
  BaseEmailProvider,
  BaseCredentialsProvider,
  validateProviders,
  testProviderConnections,
} from '../base';
import { TokenSet } from '../../types';

// Mock fetch for testing
global.fetch = vi.fn();

describe('BaseProvider', () => {
  class TestProvider extends BaseProvider {
    constructor() {
      super({
        id: 'test',
        name: 'Test Provider',
        type: 'oauth',
        options: {
          description: 'Test provider for unit tests',
          iconUrl: 'https://example.com/icon.png',
          brandColor: '#ff0000',
        },
      });
    }

    async validate() {
      return { isValid: true, errors: [] };
    }

    getConfigSchema() {
      return {
        type: 'object',
        properties: {
          testField: { type: 'string' },
        },
      };
    }

    async testConnection() {
      return { success: true, message: 'Test connection successful' };
    }
  }

  let provider: TestProvider;

  beforeEach(() => {
    provider = new TestProvider();
  });

  describe('constructor', () => {
    it('should initialize provider with correct properties', () => {
      expect(provider.id).toBe('test');
      expect(provider.name).toBe('Test Provider');
      expect(provider.type).toBe('oauth');
      expect(provider.options).toEqual({
        description: 'Test provider for unit tests',
        iconUrl: 'https://example.com/icon.png',
        brandColor: '#ff0000',
      });
    });
  });

  describe('getDisplayInfo', () => {
    it('should return display information', () => {
      const displayInfo = provider.getDisplayInfo();

      expect(displayInfo).toEqual({
        id: 'test',
        name: 'Test Provider',
        type: 'oauth',
        description: 'Test provider for unit tests',
        iconUrl: 'https://example.com/icon.png',
        brandColor: '#ff0000',
      });
    });
  });

  describe('supportsFeature', () => {
    it('should return true for supported features', () => {
      expect(provider.supportsFeature('authentication')).toBe(true);
    });

    it('should return false for unsupported features', () => {
      expect(provider.supportsFeature('unsupported')).toBe(false);
    });
  });
});

describe('BaseOAuthProvider', () => {
  class TestOAuthProvider extends BaseOAuthProvider {
    constructor() {
      super({
        id: 'test-oauth',
        name: 'Test OAuth',
        authorization: 'https://example.com/oauth/authorize',
        token: 'https://example.com/oauth/token',
        userinfo: 'https://example.com/oauth/userinfo',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        enablePKCE: true,
        checks: ['state', 'pkce'],
      });
    }

    protected override getDefaultUserProfile(profile: Record<string, unknown>) {
      return {
        id: profile.id || profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.avatar_url || profile.picture,
      };
    }
  }

  let provider: TestOAuthProvider;

  beforeEach(() => {
    provider = new TestOAuthProvider();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize OAuth provider correctly', () => {
      expect(provider.id).toBe('test-oauth');
      expect(provider.type).toBe('oauth');
      expect(provider.clientId).toBe('test-client-id');
      expect(provider.clientSecret).toBe('test-client-secret');
      expect(provider.enablePKCE).toBe(true);
      expect(provider.checks).toEqual(['state', 'pkce']);
    });
  });

  describe('validate', () => {
    it('should validate correct configuration', async () => {
      const result = await provider.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', async () => {
      const invalidProvider = new TestOAuthProvider();
      (invalidProvider as { clientId: string }).clientId = '';

      const result = await invalidProvider.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('clientId is required');
    });

    it('should detect invalid URLs', async () => {
      const invalidProvider = new TestOAuthProvider();
      (invalidProvider as { authorization: string }).authorization = 'invalid-url';

      const result = await invalidProvider.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid authorization URL');
    });
  });

  describe('getSupportedFeatures', () => {
    it('should return OAuth-specific features', () => {
      const features = provider['getSupportedFeatures']();

      expect(features).toContain('authentication');
      expect(features).toContain('oauth2');
      expect(features).toContain('pkce');
      expect(features).toContain('user_profile');
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should generate correct authorization URL', () => {
      const url = provider.getAuthorizationUrl({
        redirectUri: 'https://app.com/callback',
        state: 'test-state',
        scopes: ['read', 'write'],
        codeChallenge: 'test-challenge',
        codeChallengeMethod: 'S256',
      });

      expect(url).toContain('https://example.com/oauth/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('redirect_uri=https%3A%2F%2Fapp.com%2Fcallback');
      expect(url).toContain('state=test-state');
      expect(url).toContain('scope=read+write');
      expect(url).toContain('code_challenge=test-challenge');
      expect(url).toContain('code_challenge_method=S256');
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange code for tokens successfully', async () => {
      const mockTokens = {
        access_token: 'access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'refresh-token',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokens,
      } as Response);

      const tokens = await provider.exchangeCodeForTokens({
        code: 'auth-code',
        redirectUri: 'https://app.com/callback',
        codeVerifier: 'code-verifier',
      });

      expect(tokens.access_token).toBe('access-token');
      expect(tokens.expires_at).toBeDefined();
      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/oauth/token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
          body: expect.stringContaining('code_verifier=code-verifier'),
        })
      );
    });

    it('should handle token exchange errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid code',
      } as Response);

      await expect(
        provider.exchangeCodeForTokens({
          code: 'invalid-code',
          redirectUri: 'https://app.com/callback',
        })
      ).rejects.toThrow('Token exchange failed');
    });
  });

  describe('fetchUserProfile', () => {
    it('should fetch user profile successfully', async () => {
      const mockProfile = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      } as Response);

      const profile = await provider.fetchUserProfile('access-token');

      expect(profile).toEqual(mockProfile);
      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/oauth/userinfo',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer access-token',
          }),
        })
      );
    });

    it('should handle profile fetch errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid token',
      } as Response);

      await expect(provider.fetchUserProfile('invalid-token')).rejects.toThrow(
        'User profile request failed'
      );
    });
  });

  describe('processUserProfile', () => {
    it('should use custom profile function if provided', async () => {
      const customProfile = vi.fn().mockResolvedValue({
        id: 'custom-id',
        name: 'Custom Name',
      });

      const providerWithCustomProfile = new TestOAuthProvider();
      (providerWithCustomProfile as { profile: typeof customProfile }).profile = customProfile;

      const mockTokens: TokenSet = { access_token: 'token' };
      const mockProfileData = { id: '123', name: 'John' };

      const result = await providerWithCustomProfile.processUserProfile(
        mockProfileData,
        mockTokens
      );

      expect(customProfile).toHaveBeenCalledWith(mockProfileData, mockTokens);
      expect(result).toEqual({ id: 'custom-id', name: 'Custom Name' });
    });

    it('should use default profile processing if no custom function', async () => {
      const mockProfileData = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        avatar_url: 'https://example.com/avatar.jpg',
      };

      const result = await provider.processUserProfile(mockProfileData, { access_token: 'token' });

      expect(result).toEqual({
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        image: 'https://example.com/avatar.jpg',
      });
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const mockTokens = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokens,
      } as Response);

      const tokens = await provider.refreshAccessToken('refresh-token');

      expect(tokens.access_token).toBe('new-access-token');
      expect(tokens.refresh_token).toBe('refresh-token'); // Should keep old refresh token
      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/oauth/token',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('grant_type=refresh_token'),
        })
      );
    });
  });

  describe('testConnection', () => {
    it('should test endpoints successfully', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({ ok: true, status: 200 } as Response) // auth endpoint
        .mockResolvedValueOnce({ ok: true, status: 200 } as Response); // token endpoint

      const result = await provider.testConnection();

      expect(result.success).toBe(true);
      expect(result.message).toBe('OAuth endpoints are reachable');
      expect(result.details).toEqual({
        authEndpoint: 'https://example.com/oauth/authorize',
        tokenEndpoint: 'https://example.com/oauth/token',
        features: expect.arrayContaining(['authentication', 'oauth2', 'pkce']),
      });
    });

    it('should handle connection test failures', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await provider.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Connection test failed');
    });
  });
});

describe('BaseEmailProvider', () => {
  class TestEmailProvider extends BaseEmailProvider {
    constructor() {
      super({
        id: 'test-email',
        name: 'Test Email',
        server: 'smtp://localhost:587',
        from: 'test@example.com',
        maxAge: 24 * 60 * 60,
      });
    }

    async sendVerificationEmail(params: {
      identifier: string;
      url: string;
      expires: Date;
      token: string;
    }): Promise<void> {
      // Mock implementation
      console.log('Sending verification email:', params);
    }
  }

  let provider: TestEmailProvider;

  beforeEach(() => {
    provider = new TestEmailProvider();
  });

  describe('validate', () => {
    it('should validate correct email configuration', async () => {
      const result = await provider.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing server configuration', async () => {
      (provider as { server: string }).server = '';

      const result = await provider.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('SMTP server configuration is required');
    });

    it('should detect invalid email format', async () => {
      (provider as { from: string }).from = 'invalid-email';

      const result = await provider.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid from email address format');
    });
  });
});

describe('BaseCredentialsProvider', () => {
  class TestCredentialsProvider extends BaseCredentialsProvider {
    constructor() {
      super({
        id: 'test-credentials',
        name: 'Test Credentials',
        credentials: {
          username: { label: 'Username', type: 'text' },
          password: { label: 'Password', type: 'password' },
        },
        authorize: async credentials => {
          if (credentials?.username === 'test' && credentials?.password === 'password') {
            return { id: '1', name: 'Test User', email: 'test@example.com' };
          }
          return null;
        },
      });
    }
  }

  let provider: TestCredentialsProvider;

  beforeEach(() => {
    provider = new TestCredentialsProvider();
  });

  describe('validate', () => {
    it('should validate correct credentials configuration', async () => {
      const result = await provider.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing credentials configuration', async () => {
      (provider as { credentials: Record<string, unknown> }).credentials = {};

      const result = await provider.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Credentials configuration is required');
    });

    it('should detect missing authorize function', async () => {
      (provider as { authorize: null }).authorize = null;

      const result = await provider.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Authorize function is required');
    });
  });
});

describe('Provider Utilities', () => {
  let providers: BaseProvider[];

  beforeEach(() => {
    class ValidProvider extends BaseProvider {
      constructor() {
        super({ id: 'valid', name: 'Valid', type: 'oauth' });
      }
      async validate() {
        return { isValid: true, errors: [] };
      }
      getConfigSchema() {
        return {};
      }
      async testConnection() {
        return { success: true, message: 'OK' };
      }
    }

    class InvalidProvider extends BaseProvider {
      constructor() {
        super({ id: 'invalid', name: 'Invalid', type: 'oauth' });
      }
      async validate() {
        return { isValid: false, errors: ['Test error'] };
      }
      getConfigSchema() {
        return {};
      }
      async testConnection() {
        return { success: false, message: 'Failed' };
      }
    }

    providers = [new ValidProvider(), new InvalidProvider()];
  });

  describe('validateProviders', () => {
    it('should validate multiple providers', async () => {
      const result = await validateProviders(providers);

      expect(result.isValid).toBe(false);
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        provider: 'valid',
        isValid: true,
        errors: [],
      });
      expect(result.results[1]).toEqual({
        provider: 'invalid',
        isValid: false,
        errors: ['Test error'],
      });
    });
  });

  describe('testProviderConnections', () => {
    it('should test multiple provider connections', async () => {
      const result = await testProviderConnections(providers);

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        provider: 'valid',
        success: true,
        message: 'OK',
        details: undefined,
      });
      expect(result.results[1]).toEqual({
        provider: 'invalid',
        success: false,
        message: 'Failed',
        details: undefined,
      });
    });
  });
});
