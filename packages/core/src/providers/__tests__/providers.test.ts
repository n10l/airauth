/**
 * Provider implementations tests
 */
import { describe, it, expect } from 'vitest';
import {
  GitHub,
  Google,
  LinkedIn,
  Microsoft,
  Discord,
  OAuth,
  getProviderById,
  validateProviderConfig,
  providerSupportsPKCE,
} from '../index';
import type { OAuthProvider } from '../../types';

describe('Provider Implementations', () => {
  describe('GitHub Provider', () => {
    it('should create GitHub provider with correct configuration', () => {
      const provider = GitHub({
        clientId: 'github-client-id',
        clientSecret: 'github-client-secret',
      });

      expect(provider.id).toBe('github');
      expect(provider.name).toBe('GitHub');
      expect(provider.type).toBe('oauth');
      expect(provider.enablePKCE).toBe(true);
      expect(provider.checks).toContain('pkce');
    });
  });

  describe('Google Provider', () => {
    it('should create Google provider with OpenID Connect support', () => {
      const provider = Google({
        clientId: 'google-client-id',
        clientSecret: 'google-client-secret',
      });

      expect(provider.id).toBe('google');
      expect(provider.name).toBe('Google');
      expect(provider.checks).toContain('nonce');
      expect(provider.enablePKCE).toBe(true);
    });
  });

  describe('LinkedIn Provider', () => {
    it('should create LinkedIn provider', () => {
      const provider = LinkedIn({
        clientId: 'linkedin-client-id',
        clientSecret: 'linkedin-client-secret',
      });

      expect(provider.id).toBe('linkedin');
      expect(provider.name).toBe('LinkedIn');
      expect(provider.enablePKCE).toBe(true);
    });
  });

  describe('Microsoft Provider', () => {
    it('should create Microsoft provider with tenant support', () => {
      const provider = Microsoft({
        clientId: 'microsoft-client-id',
        clientSecret: 'microsoft-client-secret',
        tenantId: 'common',
      });

      expect(provider.id).toBe('microsoft');
      expect(provider.name).toBe('Microsoft');
      expect(provider.checks).toContain('nonce');
    });
  });

  describe('Discord Provider', () => {
    it('should create Discord provider', () => {
      const provider = Discord({
        clientId: 'discord-client-id',
        clientSecret: 'discord-client-secret',
      });

      expect(provider.id).toBe('discord');
      expect(provider.name).toBe('Discord');
      expect(provider.enablePKCE).toBe(true);
    });
  });

  describe('Custom OAuth Provider', () => {
    it('should create custom OAuth provider', () => {
      const provider = OAuth({
        id: 'custom',
        name: 'Custom Provider',
        clientId: 'custom-client-id',
        clientSecret: 'custom-client-secret',
        authorization: 'https://custom.com/auth',
        token: 'https://custom.com/token',
        userinfo: 'https://custom.com/userinfo',
        profile: async profile => ({
          id: profile.id,
          name: profile.name,
          email: profile.email,
        }),
      });

      expect(provider.id).toBe('custom');
      expect(provider.name).toBe('Custom Provider');
      expect(provider.enablePKCE).toBe(true); // Default enabled
    });
  });

  describe('Provider Utilities', () => {
    const providers: OAuthProvider[] = [
      GitHub({ clientId: 'id1', clientSecret: 'secret1' }),
      Google({ clientId: 'id2', clientSecret: 'secret2' }),
    ];

    describe('getProviderById', () => {
      it('should find provider by ID', () => {
        const provider = getProviderById(providers, 'github');
        expect(provider?.id).toBe('github');
      });

      it('should return undefined for non-existent provider', () => {
        const provider = getProviderById(providers, 'nonexistent');
        expect(provider).toBeUndefined();
      });
    });

    describe('validateProviderConfig', () => {
      it('should validate correct provider configuration', () => {
        const provider = GitHub({ clientId: 'id', clientSecret: 'secret' });
        expect(() => validateProviderConfig(provider)).not.toThrow();
      });

      it('should throw for missing client ID', () => {
        const provider = { ...GitHub({ clientId: 'id', clientSecret: 'secret' }), clientId: '' };
        expect(() => validateProviderConfig(provider)).toThrow('clientId is required');
      });
    });

    describe('providerSupportsPKCE', () => {
      it('should detect PKCE support', () => {
        const provider = GitHub({ clientId: 'id', clientSecret: 'secret' });
        expect(providerSupportsPKCE(provider)).toBe(true);
      });

      it('should detect when PKCE is disabled', () => {
        const provider = OAuth({
          id: 'custom',
          name: 'Custom',
          clientId: 'id',
          clientSecret: 'secret',
          authorization: 'https://example.com/auth',
          token: 'https://example.com/token',
          enablePKCE: false,
        });
        expect(providerSupportsPKCE(provider)).toBe(false);
      });
    });
  });
});
