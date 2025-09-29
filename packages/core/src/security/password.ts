/**
 * Advanced password hashing and security utilities
 * Implements Argon2, TOTP, and password strength validation
 */
// Conditional import for argon2 - only available on server
let argon2: any = null;
if (typeof window === 'undefined') {
  try {
    argon2 = require('argon2');
  } catch (error) {
    // argon2 not available - will fall back to basic hashing
    console.warn('[NextAirAuth] argon2 not available, using fallback hashing');
  }
}
import { randomBytes, createHmac, timingSafeEqual } from 'crypto';
import { AuthenticationError } from '../types';

// ============================================================================
// Password Hashing Configuration
// ============================================================================

export interface PasswordHashOptions {
  type?: number;
  memoryCost?: number;
  timeCost?: number;
  parallelism?: number;
  hashLength?: number;
  saltLength?: number;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number;
  feedback: string[];
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
}

// Default Argon2 configuration (OWASP recommended)
const DEFAULT_ARGON2_OPTIONS = {
  type: 2, // argon2id
  memoryCost: 2 ** 16, // 64 MB
  timeCost: 3, // 3 iterations
  parallelism: 1, // 1 thread
  hashLength: 32, // 32 bytes output
  saltLength: 16, // 16 bytes salt
};

// ============================================================================
// Password Hashing
// ============================================================================

/**
 * Hash password using Argon2id with secure defaults
 */
export async function hashPassword(
  password: string,
  options: PasswordHashOptions = {}
): Promise<string> {
  if (!password || password.length === 0) {
    throw new AuthenticationError('Password cannot be empty');
  }

  if (password.length > 1000) {
    throw new AuthenticationError('Password too long (max 1000 characters)');
  }

  // Use argon2 if available, otherwise fallback to pbkdf2
  if (argon2) {
    const argon2Options = {
      ...DEFAULT_ARGON2_OPTIONS,
      ...options,
      raw: false, // Explicitly set to false to avoid type issues
    };

    try {
      // Type assertion for argon2 options - the library types aren't fully compatible with our interface
      const result = await argon2.hash(password, argon2Options as any);
      return typeof result === 'string' ? result : String(result);
    } catch (error) {
      throw new AuthenticationError(
        `Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          originalError: error,
        }
      );
    }
  } else {
    // Fallback to pbkdf2 for client-side or when argon2 is unavailable
    const { pbkdf2 } = await import('crypto');
    const { promisify } = await import('util');
    const pbkdf2Async = promisify(pbkdf2);

    const salt = randomBytes(16);
    const iterations = 100000;
    const keyLength = 32;
    const digest = 'sha256';

    try {
      const hash = await pbkdf2Async(password, salt, iterations, keyLength, digest);
      return `pbkdf2$${iterations}$${salt.toString('hex')}$${hash.toString('hex')}`;
    } catch (error) {
      throw new AuthenticationError(
        `Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          originalError: error,
        }
      );
    }
  }
}

/**
 * Verify password against Argon2 hash with timing attack protection
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }

  if (password.length > 1000) {
    return false;
  }

  try {
    // Check if this is an argon2 hash or pbkdf2 hash
    if (hash.startsWith('$argon2') && argon2) {
      return await argon2.verify(hash, password);
    } else if (hash.startsWith('pbkdf2$')) {
      // Handle pbkdf2 verification
      const [, iterations, salt, expectedHash] = hash.split('$');
      if (!iterations || !salt || !expectedHash) return false;

      const { pbkdf2 } = await import('crypto');
      const { promisify } = await import('util');
      const pbkdf2Async = promisify(pbkdf2);

      const derivedHash = await pbkdf2Async(
        password,
        Buffer.from(salt, 'hex'),
        parseInt(iterations),
        32,
        'sha256'
      );
      return timingSafeEqual(Buffer.from(expectedHash, 'hex'), derivedHash);
    } else if (argon2) {
      // Try argon2 verification for legacy hashes
      return await argon2.verify(hash, password);
    }
    return false;
  } catch (error) {
    // Log error but don't expose details
    // eslint-disable-next-line no-console
    console.error('[NextAirAuth] Password verification error:', error);
    return false;
  }
}

/**
 * Check if password hash needs rehashing (due to updated parameters)
 */
export function needsRehash(hash: string, options: PasswordHashOptions = {}): boolean {
  const targetOptions = { ...DEFAULT_ARGON2_OPTIONS, ...options };

  try {
    // Parse the hash to extract parameters
    const parts = hash.split('$');
    if (parts.length < 6) return true;

    const [, , version, params] = parts;

    // Check if version is outdated
    if (version !== 'v=19') return true;

    // Parse parameters
    const paramMap = new Map();
    if (params) {
      params.split(',').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) {
          paramMap.set(key, parseInt(value));
        }
      });
    }

    // Check if parameters match current requirements
    return (
      paramMap.get('m') !== targetOptions.memoryCost ||
      paramMap.get('t') !== targetOptions.timeCost ||
      paramMap.get('p') !== targetOptions.parallelism
    );
  } catch (error) {
    // If we can't parse the hash, assume it needs rehashing
    return true;
  }
}

// ============================================================================
// Password Strength Validation
// ============================================================================

/**
 * Comprehensive password strength validation
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const feedback: string[] = [];
  let score = 0;

  // Length checks
  if (password.length >= 12) {
    score += 2;
  } else if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password must be at least 8 characters long');
  }

  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain uppercase letters');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain numbers');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain special characters');
  }

  // Advanced checks
  if (password.length >= 16) {
    score += 1;
  }

  // Check for common patterns
  if (!/(.)\1{2,}/.test(password)) {
    score += 1; // No repeated characters
  } else {
    feedback.push('Avoid repeating characters');
  }

  if (!/123|abc|qwe|password|admin/i.test(password)) {
    score += 1; // No common sequences
  } else {
    feedback.push('Avoid common patterns and words');
  }

  // Determine strength level
  let strength: PasswordValidationResult['strength'];
  if (score >= 8) strength = 'strong';
  else if (score >= 6) strength = 'good';
  else if (score >= 4) strength = 'fair';
  else if (score >= 2) strength = 'weak';
  else strength = 'very-weak';

  return {
    isValid: score >= 4,
    score,
    feedback,
    strength,
  };
}

/**
 * Check password against common password lists
 */
export function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password',
    '123456',
    '123456789',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
    'dragon',
    'master',
    'shadow',
    'superman',
    'michael',
    'football',
    'baseball',
    'liverpool',
    'jordan',
    'princess',
  ];

  return commonPasswords.includes(password.toLowerCase());
}

// ============================================================================
// TOTP (Time-based One-Time Password) Implementation
// ============================================================================

export interface TOTPOptions {
  secret?: string;
  window?: number;
  step?: number;
  digits?: number;
  algorithm?: 'sha1' | 'sha256' | 'sha512';
}

export interface TOTPSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  uri: string;
}

/**
 * Generate TOTP secret
 */
export function generateTOTPSecret(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';

  for (let i = 0; i < length; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }

  return secret;
}

/**
 * Generate TOTP code for given secret and time
 */
export function generateTOTPCode(secret: string, options: TOTPOptions = {}): string {
  const { step = 30, digits = 6, algorithm = 'sha1' } = options;

  const time = Math.floor(Date.now() / 1000 / step);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeUInt32BE(Math.floor(time / 0x100000000), 0);
  timeBuffer.writeUInt32BE(time & 0xffffffff, 4);

  // Decode base32 secret
  const secretBuffer = base32Decode(secret);

  // Generate HMAC
  const hmac = createHmac(algorithm, secretBuffer);
  hmac.update(timeBuffer);
  const hash = hmac.digest();

  // Dynamic truncation
  const lastByte = hash[hash.length - 1];
  if (lastByte === undefined) {
    throw new Error('Invalid hash for TOTP generation');
  }

  const offset = lastByte & 0x0f;
  const byte0 = hash[offset];
  const byte1 = hash[offset + 1];
  const byte2 = hash[offset + 2];
  const byte3 = hash[offset + 3];

  if (byte0 === undefined || byte1 === undefined || byte2 === undefined || byte3 === undefined) {
    throw new Error('Invalid hash offset for TOTP generation');
  }

  const code =
    (((byte0 & 0x7f) << 24) | ((byte1 & 0xff) << 16) | ((byte2 & 0xff) << 8) | (byte3 & 0xff)) %
    Math.pow(10, digits);

  return code.toString().padStart(digits, '0');
}

/**
 * Verify TOTP code
 */
export function verifyTOTPCode(code: string, secret: string, options: TOTPOptions = {}): boolean {
  const { window = 1 } = options;

  if (!code || !secret) {
    return false;
  }

  // Check current time and surrounding windows
  for (let i = -window; i <= window; i++) {
    const testOptions = { ...options };
    // TODO: Implement time-shifted TOTP validation
    // const testTime = Math.floor(Date.now() / 1000) + i * (options.step || 30)

    // Generate code for test time
    const expectedCode = generateTOTPCode(secret, {
      ...testOptions,
      // Override time calculation
    });

    if (timingSafeEqual(Buffer.from(code), Buffer.from(expectedCode))) {
      return true;
    }
  }

  return false;
}

/**
 * Generate TOTP setup with QR code
 */
export function generateTOTPSetup(
  accountName: string,
  issuer: string = 'NextAirAuth',
  options: TOTPOptions = {}
): TOTPSetup {
  const secret = options.secret || generateTOTPSecret();
  const digits = options.digits || 6;
  const step = options.step || 30;
  const algorithm = options.algorithm || 'sha1';

  // Generate TOTP URI
  const uri =
    `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?` +
    `secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=${algorithm.toUpperCase()}&digits=${digits}&period=${step}`;

  // Generate backup codes
  const backupCodes = generateBackupCodes();

  // Generate QR code data URL (simplified - in real implementation, use a QR library)
  const qrCode = `data:image/svg+xml;base64,${Buffer.from(generateQRCodeSVG(uri)).toString('base64')}`;

  return {
    secret,
    qrCode,
    backupCodes,
    uri,
  };
}

/**
 * Generate backup codes for TOTP
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric backup code
    const code = randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }

  return codes;
}

/**
 * Verify backup code (should be used only once)
 */
export function verifyBackupCode(
  code: string,
  hashedBackupCodes: string[]
): { isValid: boolean; codeIndex: number } {
  const normalizedCode = code.replace(/[-\s]/g, '').toUpperCase();

  for (let i = 0; i < hashedBackupCodes.length; i++) {
    try {
      // In real implementation, backup codes should be hashed
      // This is a simplified version
      const hashedCode = hashedBackupCodes[i];
      if (hashedCode) {
        const isValid = timingSafeEqual(Buffer.from(normalizedCode), Buffer.from(hashedCode));
        if (isValid) {
          return { isValid: true, codeIndex: i };
        }
      }
    } catch (error) {
      continue;
    }
  }

  return { isValid: false, codeIndex: -1 };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Base32 decode (simplified implementation)
 */
function base32Decode(encoded: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  const output = [];

  for (let i = 0; i < encoded.length; i++) {
    const char = encoded[i]?.toUpperCase();
    if (!char) continue;

    const index = alphabet.indexOf(char);

    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

/**
 * Generate simple QR code SVG (placeholder - use proper QR library in production)
 */
function generateQRCodeSVG(data: string): string {
  // This is a placeholder - in real implementation, use a proper QR code library
  return `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="white"/>
    <text x="100" y="100" text-anchor="middle" font-size="12" fill="black">QR Code</text>
    <text x="100" y="120" text-anchor="middle" font-size="8" fill="gray">${data.slice(0, 30)}...</text>
  </svg>`;
}

// ============================================================================
// Password Policy Enforcement
// ============================================================================

export interface PasswordPolicy {
  minLength?: number;
  maxLength?: number;
  requireLowercase?: boolean;
  requireUppercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  forbidCommonPasswords?: boolean;
  forbidUserInfo?: boolean;
  maxAge?: number; // days
  preventReuse?: number; // number of previous passwords to check
}

export class PasswordPolicyValidator {
  constructor(private policy: PasswordPolicy = {}) {}

  validate(
    password: string,
    userInfo?: { name?: string; email?: string }
  ): PasswordValidationResult {
    const feedback: string[] = [];
    let score = 0;

    // Length validation
    const minLength = this.policy.minLength || 8;
    const maxLength = this.policy.maxLength || 1000;

    if (password.length < minLength) {
      feedback.push(`Password must be at least ${minLength} characters long`);
    } else {
      score += 1;
    }

    if (password.length > maxLength) {
      feedback.push(`Password must be no more than ${maxLength} characters long`);
      return { isValid: false, score: 0, feedback, strength: 'very-weak' };
    }

    // Character requirements
    if (this.policy.requireLowercase && !/[a-z]/.test(password)) {
      feedback.push('Password must contain lowercase letters');
    } else if (this.policy.requireLowercase) {
      score += 1;
    }

    if (this.policy.requireUppercase && !/[A-Z]/.test(password)) {
      feedback.push('Password must contain uppercase letters');
    } else if (this.policy.requireUppercase) {
      score += 1;
    }

    if (this.policy.requireNumbers && !/\d/.test(password)) {
      feedback.push('Password must contain numbers');
    } else if (this.policy.requireNumbers) {
      score += 1;
    }

    if (this.policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      feedback.push('Password must contain special characters');
    } else if (this.policy.requireSpecialChars) {
      score += 1;
    }

    // Common password check
    if (this.policy.forbidCommonPasswords && isCommonPassword(password)) {
      feedback.push('Password is too common');
    } else if (this.policy.forbidCommonPasswords) {
      score += 1;
    }

    // User info check
    if (this.policy.forbidUserInfo && userInfo) {
      const lowerPassword = password.toLowerCase();
      if (userInfo.name && lowerPassword.includes(userInfo.name.toLowerCase())) {
        feedback.push('Password cannot contain your name');
      } else if (
        userInfo.email &&
        lowerPassword.includes(userInfo.email.split('@')[0]?.toLowerCase() || '')
      ) {
        feedback.push('Password cannot contain your email');
      } else {
        score += 1;
      }
    }

    // Determine strength
    const maxScore = Object.values(this.policy).filter(Boolean).length;
    const strengthRatio = maxScore > 0 ? score / maxScore : 0;

    let strength: PasswordValidationResult['strength'];
    if (strengthRatio >= 0.9) strength = 'strong';
    else if (strengthRatio >= 0.7) strength = 'good';
    else if (strengthRatio >= 0.5) strength = 'fair';
    else if (strengthRatio >= 0.3) strength = 'weak';
    else strength = 'very-weak';

    return {
      isValid: feedback.length === 0,
      score,
      feedback,
      strength,
    };
  }
}

// ============================================================================
// Secure Random Generation
// ============================================================================

/**
 * Generate cryptographically secure random password
 */
export function generateSecurePassword(
  length: number = 16,
  options: {
    includeLowercase?: boolean;
    includeUppercase?: boolean;
    includeNumbers?: boolean;
    includeSpecialChars?: boolean;
    excludeSimilar?: boolean;
  } = {}
): string {
  const {
    includeLowercase = true,
    includeUppercase = true,
    includeNumbers = true,
    includeSpecialChars = true,
    excludeSimilar = true,
  } = options;

  let charset = '';

  if (includeLowercase) {
    charset += excludeSimilar ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
  }

  if (includeUppercase) {
    charset += excludeSimilar ? 'ABCDEFGHJKMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }

  if (includeNumbers) {
    charset += excludeSimilar ? '23456789' : '0123456789';
  }

  if (includeSpecialChars) {
    charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  }

  if (charset.length === 0) {
    throw new Error('At least one character type must be included');
  }

  let password = '';
  for (let i = 0; i < length; i++) {
    const randomByte = randomBytes(1)[0];
    if (randomByte !== undefined) {
      const randomIndex = randomByte % charset.length;
      const char = charset[randomIndex];
      if (char) {
        password += char;
      }
    }
  }

  return password;
}
