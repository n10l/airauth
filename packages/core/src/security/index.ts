/**
 * Security utilities for AirAuth
 * Implements PKCE, password hashing, JWT handling, and CSRF protection
 */
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
// Conditional import for argon2 - only available on server
let argon2: any = null;
if (typeof window === 'undefined') {
  try {
    argon2 = require('argon2');
  } catch (error) {
    // argon2 not available
  }
}
import { nanoid } from 'nanoid';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { PKCECodeChallenge, JWT, JWTEncodeParams, JWTDecodeParams, CookieOption } from '../types';

// ============================================================================
// PKCE Implementation
// ============================================================================

/**
 * Generate PKCE code verifier and challenge
 */
export function generatePKCE(): PKCECodeChallenge {
  const codeVerifier = nanoid(128);
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
  };
}

/**
 * Verify PKCE code challenge
 */
export function verifyPKCE(codeVerifier: string, codeChallenge: string): boolean {
  const expectedChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

  return timingSafeEqual(Buffer.from(expectedChallenge), Buffer.from(codeChallenge));
}

// ============================================================================
// Password Hashing (Argon2)
// ============================================================================

/**
 * Hash password using Argon2 (if available) or fallback
 */
export async function hashPassword(password: string, options?: any): Promise<string> {
  if (argon2) {
    const baseOptions = {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
      raw: false as const,
    };

    const hashOptions = {
      ...baseOptions,
      ...options,
      raw: false as const, // Ensure raw is always false
    };

    return argon2.hash(password, hashOptions);
  } else {
    // Fallback for client-side or when argon2 is unavailable
    throw new Error('Password hashing is only available on the server');
  }
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (argon2) {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      return false;
    }
  } else {
    // Client-side password verification not supported
    return false;
  }
}

// ============================================================================
// JWT Token Management
// ============================================================================

/**
 * Encode JWT token
 */
export async function encodeJWT(params: JWTEncodeParams): Promise<string> {
  const { token = {}, secret, maxAge = 30 * 24 * 60 * 60 } = params; // 30 days default
  const secretKey = typeof secret === 'string' ? new TextEncoder().encode(secret) : secret;

  const jwt = new SignJWT(token as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAge)
    .setJti(nanoid());

  if (token.sub) {
    jwt.setSubject(token.sub);
  }

  return jwt.sign(secretKey);
}

/**
 * Decode and verify JWT token
 */
export async function decodeJWT(params: JWTDecodeParams): Promise<JWT | null> {
  const { token, secret } = params;

  if (!token) return null;

  try {
    const secretKey = typeof secret === 'string' ? new TextEncoder().encode(secret) : secret;
    const { payload } = await jwtVerify(token, secretKey);
    return payload as JWT;
  } catch (error) {
    return null;
  }
}

/**
 * Generate secure random token
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate session token
 */
export function generateSessionToken(): string {
  return nanoid(32);
}

// ============================================================================
// CSRF Protection
// ============================================================================

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return nanoid(32);
}

/**
 * Verify CSRF token using constant-time comparison
 */
export function verifyCSRFToken(token: string, expected: string): boolean {
  if (token.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

// ============================================================================
// State Parameter Generation
// ============================================================================

/**
 * Generate OAuth state parameter
 */
export function generateState(): string {
  return nanoid(32);
}

/**
 * Generate OAuth nonce parameter
 */
export function generateNonce(): string {
  return nanoid(16);
}

// ============================================================================
// Secure Random Utilities
// ============================================================================

/**
 * Generate cryptographically secure random string
 */
export function generateSecureRandom(length: number = 32): string {
  return randomBytes(length).toString('base64url');
}

/**
 * Generate verification token for email verification
 */
export function generateVerificationToken(): string {
  return nanoid(64);
}

/**
 * Generate magic link token
 */
export function generateMagicLinkToken(): string {
  return nanoid(64);
}

// ============================================================================
// TOTP (Time-based One-Time Password) Support
// ============================================================================

/**
 * Generate TOTP secret
 */
export function generateTOTPSecret(): string {
  // Generate 32-byte secret for TOTP
  // Convert to base32 manually since Node.js doesn't support it natively
  const bytes = randomBytes(32);
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let buffer = 0;
  let next = 0;
  let bitsLeft = 0;

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    next = (next << 8) | byte;
    bitsLeft += 8;

    while (bitsLeft >= 5) {
      result += base32Chars[(buffer >> (bitsLeft - 5)) & 31];
      bitsLeft -= 5;
    }
  }

  if (bitsLeft > 0) {
    result += base32Chars[(buffer << (5 - bitsLeft)) & 31];
  }

  return result;
}

/**
 * Generate backup codes for TOTP
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-digit backup codes
    codes.push(Math.random().toString().slice(2, 10));
  }
  return codes;
}

// ============================================================================
// Cookie Security Utilities
// ============================================================================

/**
 * Default secure cookie options
 */
export const defaultCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 30 * 24 * 60 * 60, // 30 days
};

/**
 * Generate secure cookie options based on environment
 */
export function getSecureCookieOptions(options: Partial<CookieOption> = {}): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  path: string;
  maxAge: number;
} {
  const result = {
    ...defaultCookieOptions,
    secure: options.secure ?? process.env.NODE_ENV === 'production',
  };

  // Only set defined properties to avoid undefined issues with exactOptionalPropertyTypes
  if (options.httpOnly !== undefined) result.httpOnly = options.httpOnly;
  if (options.path !== undefined) result.path = options.path;
  if (options.maxAge !== undefined) result.maxAge = options.maxAge;
  if (options.sameSite === 'lax') result.sameSite = 'lax';

  return result;
}

// ============================================================================
// Timing Attack Protection
// ============================================================================

/**
 * Constant-time string comparison
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Add random delay to prevent timing attacks
 */
export async function randomDelay(minMs: number = 100, maxMs: number = 500): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// ============================================================================
// Input Validation and Sanitization
// ============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize redirect URL to prevent open redirects
 */
export function sanitizeRedirectUrl(url: string, baseUrl: string): string {
  try {
    const redirectUrl = new URL(url, baseUrl);
    const base = new URL(baseUrl);

    // Only allow same origin redirects
    if (redirectUrl.origin === base.origin) {
      return redirectUrl.toString();
    }

    return baseUrl;
  } catch {
    return baseUrl;
  }
}

/**
 * Validate callback URL
 */
export function isValidCallbackUrl(url: string, allowedUrls: string[]): boolean {
  try {
    const callbackUrl = new URL(url);
    return allowedUrls.some(allowed => {
      const allowedUrl = new URL(allowed);
      return callbackUrl.origin === allowedUrl.origin;
    });
  } catch {
    return false;
  }
}

// ============================================================================
// Rate Limiting Utilities
// ============================================================================

/**
 * Simple in-memory rate limiter
 */
export class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>();

  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);

    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (attempt.count >= this.maxAttempts) {
      return false;
    }

    attempt.count++;
    return true;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, attempt] of this.attempts.entries()) {
      if (now > attempt.resetTime) {
        this.attempts.delete(key);
      }
    }
  }
}

// ============================================================================
// Export all security utilities
// ============================================================================
export * from './cookies';
export * from './validation';
export * from './password';
export * from './csrf';

// ============================================================================
// Time utilities
// ============================================================================

/**
 * Add time to a date
 */
export function addTime(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

/**
 * Check if a date is expired
 */
export function isExpired(date: Date): boolean {
  return date.getTime() < Date.now();
}
