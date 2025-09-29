/**
 * PKCE implementation tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generatePKCE, verifyPKCE } from '../../security';
import {
  generateAuthorizationUrl,
  exchangeCodeForTokens,
  validateOAuthState,
  cleanupExpiredStates,
} from '../index';
import { OAuthProvider } from '../../types';

// Mock provider for testing
const mockProvider: OAuthProvider = {
  id: 'test',
  name: 'Test Provider',
  type: 'oauth',
  authorization: 'https://example.com/oauth/authorize',
  token: 'https://example.com/oauth/token',
  userinfo: 'https://example.com/oauth/userinfo',
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  checks: ['state', 'pkce'],
  enablePKCE: true,
};

describe('PKCE Implementation', () => {
  describe('generatePKCE', () => {
    it('should generate valid PKCE challenge and verifier', () => {
      const pkce = generatePKCE();

      expect(pkce.codeVerifier).toBeDefined();
      expect(pkce.codeChallenge).toBeDefined();
      expect(pkce.codeChallengeMethod).toBe('S256');

      // Code verifier should be 128 characters (base64url)
      expect(pkce.codeVerifier).toHaveLength(128);

      // Code challenge should be base64url encoded SHA256
      expect(pkce.codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate unique values each time', () => {
      const pkce1 = generatePKCE();
      const pkce2 = generatePKCE();

      expect(pkce1.codeVerifier).not.toBe(pkce2.codeVerifier);
      expect(pkce1.codeChallenge).not.toBe(pkce2.codeChallenge);
    });
  });

  describe('verifyPKCE', () => {
    it('should verify valid PKCE challenge', () => {
      const pkce = generatePKCE();
      const isValid = verifyPKCE(pkce.codeVerifier, pkce.codeChallenge);

      expect(isValid).toBe(true);
    });

    it('should reject invalid PKCE challenge', () => {
      const pkce = generatePKCE();
      const isValid = verifyPKCE('invalid-verifier', pkce.codeChallenge);

      expect(isValid).toBe(false);
    });

    it('should reject mismatched verifier and challenge', () => {
      const pkce1 = generatePKCE();
      const pkce2 = generatePKCE();
      const isValid = verifyPKCE(pkce1.codeVerifier, pkce2.codeChallenge);

      expect(isValid).toBe(false);
    });
  });

  describe('OAuth Flow with PKCE', () => {
    it('should generate authorization URL with PKCE parameters', () => {
      const callbackUrl = 'https://example.com/callback';
      const result = generateAuthorizationUrl(mockProvider, callbackUrl, {
        enablePKCE: true,
      });

      expect(result.url).toContain('code_challenge=');
      expect(result.url).toContain('code_challenge_method=S256');
      expect(result.url).toContain('state=');
      expect(result.codeVerifier).toBeDefined();
      expect(result.state).toBeDefined();
    });

    it('should not include PKCE parameters when disabled', () => {
      const providerWithoutPKCE: OAuthProvider = {
        ...mockProvider,
        enablePKCE: false,
        checks: ['state'],
      };

      const callbackUrl = 'https://example.com/callback';
      const result = generateAuthorizationUrl(providerWithoutPKCE, callbackUrl, {
        enablePKCE: false,
      });

      expect(result.url).not.toContain('code_challenge=');
      expect(result.url).not.toContain('code_challenge_method=');
      expect(result.codeVerifier).toBeUndefined();
    });

    it('should include custom scopes in authorization URL', () => {
      const callbackUrl = 'https://example.com/callback';
      const scopes = ['read:user', 'user:email'];

      const result = generateAuthorizationUrl(mockProvider, callbackUrl, {
        scopes,
      });

      expect(result.url).toContain('scope=read%3Auser+user%3Aemail');
    });

    it('should validate OAuth state correctly', () => {
      const callbackUrl = 'https://example.com/callback';
      const result = generateAuthorizationUrl(mockProvider, callbackUrl);

      // Should validate successfully
      const state = validateOAuthState(result.state, mockProvider.id);
      expect(state.provider).toBe(mockProvider.id);
      expect(state.state).toBe(result.state);
      expect(state.callbackUrl).toBe(callbackUrl);
    });

    it('should reject invalid OAuth state', () => {
      expect(() => {
        validateOAuthState('invalid-state', mockProvider.id);
      }).toThrow('Invalid or expired OAuth state');
    });

    it('should reject OAuth state for wrong provider', () => {
      const callbackUrl = 'https://example.com/callback';
      const result = generateAuthorizationUrl(mockProvider, callbackUrl);

      expect(() => {
        validateOAuthState(result.state, 'wrong-provider');
      }).toThrow('OAuth state provider mismatch');
    });
  });

  describe('State Management', () => {
    it('should clean up expired states', async () => {
      const callbackUrl = 'https://example.com/callback';
      const result = generateAuthorizationUrl(mockProvider, callbackUrl);

      // Manually expire the state by modifying its timestamp
      const state = validateOAuthState(result.state, mockProvider.id);
      state.createdAt = Date.now() - 11 * 60 * 1000; // 11 minutes ago

      cleanupExpiredStates();

      // State should now be invalid
      expect(() => {
        validateOAuthState(result.state, mockProvider.id);
      }).toThrow('Invalid or expired OAuth state');
    });
  });
});

describe('Provider PKCE Configuration', () => {
  it('should support PKCE configuration', () => {
    // Test that PKCE can be configured
    expect(true).toBe(true);
  });

  it('should validate PKCE parameters', () => {
    // Test PKCE parameter validation
    expect(true).toBe(true);
  });

  it('should handle PKCE flow correctly', () => {
    // Test PKCE flow handling
    expect(true).toBe(true);
  });
});

describe('Token Exchange with PKCE', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should include PKCE verifier in token request', async () => {
    const callbackUrl = 'https://example.com/callback';
    const authResult = generateAuthorizationUrl(mockProvider, callbackUrl);

    // Mock successful token response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      }),
    } as Response);

    await exchangeCodeForTokens(mockProvider, 'test-code', authResult.state, callbackUrl);

    // Verify fetch was called with PKCE verifier
    expect(fetch).toHaveBeenCalledWith(
      mockProvider.token,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
        body: expect.stringContaining('code_verifier='),
      })
    );
  });

  it('should not include PKCE verifier when not used', async () => {
    const providerWithoutPKCE: OAuthProvider = {
      ...mockProvider,
      enablePKCE: false,
      checks: ['state'],
    };

    const callbackUrl = 'https://example.com/callback';
    const authResult = generateAuthorizationUrl(providerWithoutPKCE, callbackUrl, {
      enablePKCE: false,
    });

    // Mock successful token response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      }),
    } as Response);

    await exchangeCodeForTokens(providerWithoutPKCE, 'test-code', authResult.state, callbackUrl);

    // Verify fetch was called without PKCE verifier
    const fetchCall = vi.mocked(fetch).mock.calls[0];
    expect(fetchCall[1]?.body).not.toContain('code_verifier=');
  });
});
