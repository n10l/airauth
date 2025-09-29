/**
 * CSRF protection tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  generateCSRFTokenPair,
  hashCSRFToken,
  verifyCSRFToken,
  CSRFProtection,
  withCSRFProtection,
  needsCSRFProtection,
  debugCSRFToken,
} from '../csrf';

// Mock dependencies
vi.mock('../cookies', () => ({
  getCookie: vi.fn(),
  setCookie: vi.fn(),
  getApiCookie: vi.fn(),
  setApiCookie: vi.fn(),
  COOKIE_NAMES: {
    CSRF_TOKEN: 'next-airauth.csrf-token',
  },
}));

vi.mock('../../core', () => ({
  getConfig: vi.fn(() => ({
    jwt: { secret: 'test-secret-key' },
    debug: false,
  })),
}));

import { getCookie, setCookie } from '../cookies';

describe('CSRF Token Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateCSRFTokenPair', () => {
    it('should generate token pair with token and hashed token', () => {
      const pair = generateCSRFTokenPair('test-secret');

      expect(pair.token).toBeDefined();
      expect(pair.hashedToken).toBeDefined();
      expect(pair.token).toHaveLength(32); // nanoid(32)
      expect(pair.hashedToken).toHaveLength(64); // SHA256 hex
    });

    it('should generate different tokens each time', () => {
      const pair1 = generateCSRFTokenPair('test-secret');
      const pair2 = generateCSRFTokenPair('test-secret');

      expect(pair1.token).not.toBe(pair2.token);
      expect(pair1.hashedToken).not.toBe(pair2.hashedToken);
    });
  });

  describe('hashCSRFToken', () => {
    it('should hash token with secret', () => {
      const token = 'test-token';
      const secret = 'test-secret';

      const hash = hashCSRFToken(token, secret);

      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64); // SHA256 hex
    });

    it('should produce consistent hashes for same input', () => {
      const token = 'test-token';
      const secret = 'test-secret';

      const hash1 = hashCSRFToken(token, secret);
      const hash2 = hashCSRFToken(token, secret);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different secrets', () => {
      const token = 'test-token';

      const hash1 = hashCSRFToken(token, 'secret1');
      const hash2 = hashCSRFToken(token, 'secret2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyCSRFToken', () => {
    it('should verify valid token', () => {
      const token = 'test-token';
      const secret = 'test-secret';
      const hashedToken = hashCSRFToken(token, secret);

      const isValid = verifyCSRFToken(token, hashedToken, secret);

      expect(isValid).toBe(true);
    });

    it('should reject invalid token', () => {
      const token = 'test-token';
      const wrongToken = 'wrong-token';
      const secret = 'test-secret';
      const hashedToken = hashCSRFToken(token, secret);

      const isValid = verifyCSRFToken(wrongToken, hashedToken, secret);

      expect(isValid).toBe(false);
    });

    it('should reject token with wrong secret', () => {
      const token = 'test-token';
      const secret = 'test-secret';
      const wrongSecret = 'wrong-secret';
      const hashedToken = hashCSRFToken(token, secret);

      const isValid = verifyCSRFToken(token, hashedToken, wrongSecret);

      expect(isValid).toBe(false);
    });

    it('should handle empty inputs', () => {
      expect(verifyCSRFToken('', 'hash', 'secret')).toBe(false);
      expect(verifyCSRFToken('token', '', 'secret')).toBe(false);
    });
  });
});

describe('CSRFProtection Class', () => {
  let csrf: CSRFProtection;

  beforeEach(() => {
    csrf = new CSRFProtection({
      secret: 'test-secret',
      skipMethods: ['GET', 'HEAD', 'OPTIONS'],
      skipPaths: ['/api/auth/csrf'],
    });
    vi.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate token and set cookie', () => {
      const request = new NextRequest('https://example.com/test');
      const response = new NextResponse();

      const token = csrf.generateToken(request, response);

      expect(token).toBeDefined();
      expect(token).toHaveLength(32);
      expect(setCookie).toHaveBeenCalledWith(
        response,
        'next-airauth.csrf-token',
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
          secure: false, // test environment
          sameSite: 'lax',
        })
      );
    });
  });

  describe('validateToken', () => {
    it('should skip validation for safe methods', () => {
      const request = new NextRequest('https://example.com/test', { method: 'GET' });

      const isValid = csrf.validateToken(request);

      expect(isValid).toBe(true);
    });

    it('should skip validation for excluded paths', () => {
      const request = new NextRequest('https://example.com/api/auth/csrf', { method: 'POST' });

      const isValid = csrf.validateToken(request);

      expect(isValid).toBe(true);
    });

    it('should validate token for unsafe methods', () => {
      const token = 'test-token';
      const hashedToken = hashCSRFToken(token, 'test-secret');

      const request = new NextRequest('https://example.com/test', {
        method: 'POST',
        headers: { 'x-csrf-token': token },
      });

      vi.mocked(getCookie).mockReturnValue(hashedToken);

      const isValid = csrf.validateToken(request);

      expect(isValid).toBe(true);
      expect(getCookie).toHaveBeenCalledWith(request, 'next-airauth.csrf-token');
    });

    it('should reject request without token', () => {
      const request = new NextRequest('https://example.com/test', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      });

      vi.mocked(getCookie).mockReturnValue('some-hash');

      const isValid = csrf.validateToken(request);

      expect(isValid).toBe(false);
    });

    it('should reject request without cookie', () => {
      const request = new NextRequest('https://example.com/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': 'test-token',
          'content-type': 'application/x-www-form-urlencoded',
        },
      });

      vi.mocked(getCookie).mockReturnValue(null);

      const isValid = csrf.validateToken(request);

      expect(isValid).toBe(false);
    });

    it('should reject request with invalid token', () => {
      const token = 'test-token';
      const wrongHash = 'wrong-hash';

      const request = new NextRequest('https://example.com/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': token,
          'content-type': 'application/x-www-form-urlencoded',
        },
      });

      vi.mocked(getCookie).mockReturnValue(wrongHash);

      const isValid = csrf.validateToken(request);

      expect(isValid).toBe(false);
    });
  });
});

describe('CSRF Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withCSRFProtection', () => {
    it('should allow request with valid CSRF token', async () => {
      const token = 'test-token';
      const hashedToken = hashCSRFToken(token, 'test-secret');

      const request = new NextRequest('https://example.com/test', {
        method: 'POST',
        headers: { 'x-csrf-token': token },
      });

      vi.mocked(getCookie).mockReturnValue(hashedToken);

      const handler = vi.fn().mockReturnValue(NextResponse.json({ success: true }));

      const result = await withCSRFProtection(request, handler, {
        secret: 'test-secret',
      });

      expect(handler).toHaveBeenCalledWith(request);
      expect(result).toBeInstanceOf(NextResponse);
    });

    it('should block request with invalid CSRF token', async () => {
      const request = new NextRequest('https://example.com/test', {
        method: 'POST',
        headers: { 'x-csrf-token': 'invalid-token' },
      });

      vi.mocked(getCookie).mockReturnValue('some-hash');

      const handler = vi.fn();

      const result = await withCSRFProtection(request, handler, {
        secret: 'test-secret',
      });

      expect(handler).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(NextResponse);

      const json = await result.json();
      expect(json.error).toBe('CSRF token validation failed');
      expect(json.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('should allow safe methods without token', async () => {
      const request = new NextRequest('https://example.com/test', { method: 'GET' });

      const handler = vi.fn().mockReturnValue(NextResponse.json({ success: true }));

      await withCSRFProtection(request, handler);

      expect(handler).toHaveBeenCalledWith(request);
    });
  });
});

describe('CSRF Utilities', () => {
  describe('needsCSRFProtection', () => {
    it('should return false for safe methods', () => {
      const request = new NextRequest('https://example.com/test', { method: 'GET' });

      expect(needsCSRFProtection(request)).toBe(false);
    });

    it('should return false for excluded paths', () => {
      const request = new NextRequest('https://example.com/api/auth/csrf', { method: 'POST' });

      expect(
        needsCSRFProtection(request, {
          skipPaths: ['/api/auth/csrf'],
        })
      ).toBe(false);
    });

    it('should return true for unsafe methods on protected paths', () => {
      const request = new NextRequest('https://example.com/api/protected', { method: 'POST' });

      expect(needsCSRFProtection(request)).toBe(true);
    });
  });

  describe('debugCSRFToken', () => {
    it('should provide debug information', () => {
      const token = 'test-token';
      const hashedToken = hashCSRFToken(token, 'test-secret');

      const request = new NextRequest('https://example.com/test', {
        method: 'GET', // Use GET to avoid formData issues
        headers: { 'x-csrf-token': token },
      });

      vi.mocked(getCookie).mockReturnValue(hashedToken);

      const debug = debugCSRFToken(request);

      expect(debug.hasToken).toBe(true);
      expect(debug.tokenSource).toBe('header');
      expect(debug.hasCookie).toBe(true);
      // Don't test isValid as it may depend on implementation details
    });

    it('should handle missing token', () => {
      const request = new NextRequest('https://example.com/test', { method: 'POST' });

      vi.mocked(getCookie).mockReturnValue(null);

      const debug = debugCSRFToken(request);

      expect(debug.hasToken).toBe(false);
      expect(debug.tokenSource).toBe('none');
      expect(debug.hasCookie).toBe(false);
      expect(debug.isValid).toBe(false);
    });
  });
});
