/**
 * Main index exports tests
 */
import { describe, it, expect } from 'vitest';

describe('Main Exports', () => {
  it('should export core types', async () => {
    const exports = await import('../index');

    // Check that main type exports exist
    expect(typeof exports).toBe('object');
  });

  it('should export security utilities', async () => {
    const { generatePKCE, verifyPKCE } = await import('../index');

    expect(typeof generatePKCE).toBe('function');
    expect(typeof verifyPKCE).toBe('function');
  });

  it('should export provider functions', async () => {
    const { GitHub, Google } = await import('../index');

    expect(typeof GitHub).toBe('function');
    expect(typeof Google).toBe('function');
  });

  it('should export OAuth utilities', async () => {
    const { generateAuthorizationUrl, exchangeCodeForTokens } = await import('../index');

    expect(typeof generateAuthorizationUrl).toBe('function');
    expect(typeof exchangeCodeForTokens).toBe('function');
  });

  describe('Provider creation', () => {
    it('should create GitHub provider', async () => {
      const { GitHub } = await import('../index');

      const provider = GitHub({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      });

      expect(provider.id).toBe('github');
      expect(provider.name).toBe('GitHub');
      expect(provider.type).toBe('oauth');
    });

    it('should create Google provider', async () => {
      const { Google } = await import('../index');

      const provider = Google({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      });

      expect(provider.id).toBe('google');
      expect(provider.name).toBe('Google');
      expect(provider.type).toBe('oauth');
    });
  });

  describe('PKCE utilities', () => {
    it('should generate and verify PKCE challenge', async () => {
      const { generatePKCE, verifyPKCE } = await import('../index');

      const pkce = generatePKCE();

      expect(pkce.codeVerifier).toBeDefined();
      expect(pkce.codeChallenge).toBeDefined();
      expect(pkce.codeChallengeMethod).toBe('S256');

      const isValid = verifyPKCE(pkce.codeVerifier, pkce.codeChallenge);
      expect(isValid).toBe(true);
    });
  });
});
