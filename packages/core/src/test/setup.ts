/**
 * Vitest test setup
 */
import { vi, beforeEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Mock AbortSignal.timeout for Node.js compatibility
if (!global.AbortSignal || !global.AbortSignal.timeout) {
  global.AbortSignal = {
    timeout: (ms: number) => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), ms);
      return controller.signal;
    },
  } as typeof AbortSignal;
}

// Mock crypto for Node.js
if (!global.crypto) {
  const crypto = require('crypto');
  global.crypto = {
    getRandomValues: (arr: Uint8Array) => crypto.randomBytes(arr.length),
    subtle: crypto.webcrypto?.subtle,
  } as Crypto;
}

// Mock TextEncoder/TextDecoder
if (!global.TextEncoder) {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
