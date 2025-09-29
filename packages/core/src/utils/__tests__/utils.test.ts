/**
 * Utility functions tests
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import {
  getClientIP,
  isValidUrl,
  deepMerge,
  generateRandomString,
  isValidEmail,
  sanitizeUrl,
} from '../index';

describe('Utility Functions', () => {
  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new NextRequest('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });

      const ip = getClientIP(request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const request = new NextRequest('https://example.com', {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
      });

      const ip = getClientIP(request);
      expect(ip).toBe('192.168.1.2');
    });

    it('should return unknown when no IP headers present', () => {
      const request = new NextRequest('https://example.com');

      const ip = getClientIP(request);
      expect(ip).toBe('unknown');
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://sub.example.com/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('deepMerge', () => {
    it('should merge objects deeply', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { b: { d: 3 }, e: 4 };

      const result = deepMerge(obj1, obj2);

      expect(result).toEqual({
        a: 1,
        b: { c: 2, d: 3 },
        e: 4,
      });
    });

    it('should handle arrays', () => {
      const obj1 = { arr: [1, 2] };
      const obj2 = { arr: [3, 4] };

      const result = deepMerge(obj1, obj2);

      expect(result.arr).toEqual([3, 4]); // Arrays are replaced, not merged
    });
  });

  describe('generateRandomString', () => {
    it('should generate string of correct length', () => {
      const str = generateRandomString(16);
      expect(str).toHaveLength(16);
    });

    it('should generate different strings', () => {
      const str1 = generateRandomString(16);
      const str2 = generateRandomString(16);
      expect(str1).not.toBe(str2);
    });

    it('should only contain valid characters', () => {
      const str = generateRandomString(32);
      expect(/^[A-Za-z0-9_-]+$/.test(str)).toBe(true);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow safe URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
      expect(sanitizeUrl('/relative/path')).toBe('/relative/path');
    });

    it('should block dangerous URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('about:blank');
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('about:blank');
    });
  });
});
