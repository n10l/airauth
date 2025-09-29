/**
 * Core functionality tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextAirAuth, getConfig, resetConfig, isInitialized } from '../index';
import type { NextAirAuthConfig, OAuthProvider } from '../../types';

// Mock dependencies
vi.mock('../../security/validation', () => ({
  validateConfig: vi.fn(() => ({ success: true, data: mockConfig })),
  validateEnvironment: vi.fn(() => ({ success: true, errors: [] })),
}));

const mockConfig: NextAirAuthConfig = {
  providers: [
    {
      id: 'test',
      name: 'Test Provider',
      type: 'oauth',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      authorization: 'https://example.com/auth',
      token: 'https://example.com/token',
      userinfo: 'https://example.com/userinfo',
    } as OAuthProvider,
  ],
  jwt: {
    secret: 'test-secret-key-32-characters-long',
  },
  session: {
    strategy: 'jwt',
    maxAge: 3600,
  },
};

describe('NextAirAuth Core', () => {
  beforeEach(() => {
    resetConfig();
    vi.clearAllMocks();
    // Mock environment variable
    process.env.NEXTAUTH_SECRET = 'test-secret-key-32-characters-long';
  });

  describe('NextAirAuth initialization', () => {
    it('should initialize with valid configuration', () => {
      const config = NextAirAuth(mockConfig);

      expect(config).toBeDefined();
      expect(config.providers).toHaveLength(1);
      expect(config.jwt?.secret).toBe('test-secret-key-32-characters-long');
    });

    it('should apply default session configuration', () => {
      const config = NextAirAuth(mockConfig);

      expect(config.session?.strategy).toBe('jwt');
      expect(config.session?.maxAge).toBeDefined();
    });
  });

  describe('getConfig', () => {
    it('should return configuration after initialization', () => {
      NextAirAuth(mockConfig);
      const config = getConfig();

      expect(config).toBeDefined();
      expect(config.providers).toHaveLength(1);
    });

    it('should throw error if not initialized', () => {
      expect(() => getConfig()).toThrow('NextAirAuth has not been initialized');
    });
  });

  describe('isInitialized', () => {
    it('should return false before initialization', () => {
      expect(isInitialized()).toBe(false);
    });

    it('should return true after initialization', () => {
      NextAirAuth(mockConfig);
      expect(isInitialized()).toBe(true);
    });
  });

  describe('resetConfig', () => {
    it('should reset configuration', () => {
      NextAirAuth(mockConfig);
      expect(isInitialized()).toBe(true);

      resetConfig();
      expect(isInitialized()).toBe(false);
    });
  });
});
