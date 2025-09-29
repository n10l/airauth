/**
 * Utility functions for AirAuth
 */
import { NextRequest } from 'next/server';
import { NextApiRequest } from 'next';
import { getBaseUrl } from '../core';

// ============================================================================
// URL Utilities
// ============================================================================

/**
 * Build absolute URL from relative path
 */
export function buildUrl(path: string, baseUrl?: string): string {
  const base = baseUrl || getBaseUrl();
  return new URL(path, base).toString();
}

/**
 * Parse callback URL and validate it
 */
export function parseCallbackUrl(
  callbackUrl: string | null | undefined,
  defaultUrl: string = '/'
): string {
  if (!callbackUrl) return defaultUrl;

  try {
    const url = new URL(callbackUrl, getBaseUrl());
    const baseUrl = new URL(getBaseUrl());

    // Only allow same-origin redirects for security
    if (url.origin === baseUrl.origin) {
      return url.pathname + url.search + url.hash;
    }

    return defaultUrl;
  } catch {
    return defaultUrl;
  }
}

/**
 * Get current URL from request
 */
export function getCurrentUrl(request: NextRequest | NextApiRequest): string {
  if (request instanceof NextRequest) {
    return request.url;
  } else {
    const protocol = request.headers['x-forwarded-proto'] || 'http';
    const host = request.headers.host;
    const url = request.url;
    return `${protocol}://${host}${url}`;
  }
}

/**
 * Extract search params from URL
 */
export function getSearchParams(url: string): URLSearchParams {
  try {
    return new URL(url).searchParams;
  } catch {
    return new URLSearchParams();
  }
}

// ============================================================================
// Request Utilities
// ============================================================================

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest | NextApiRequest): string {
  if (request instanceof NextRequest) {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded && typeof forwarded === 'string') {
      return forwarded.split(',')[0]?.trim() || 'unknown';
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
      return realIp;
    }

    return 'unknown';
  } else {
    const forwarded = request.headers['x-forwarded-for'];
    const realIp = request.headers['x-real-ip'];

    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0]?.trim() || 'unknown';
    }

    if (typeof realIp === 'string') {
      return realIp;
    }

    return request.socket?.remoteAddress || 'unknown';
  }
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: NextRequest | NextApiRequest): string {
  if (request instanceof NextRequest) {
    return request.headers.get('user-agent') || 'unknown';
  } else {
    return request.headers['user-agent'] || 'unknown';
  }
}

/**
 * Check if request is from mobile device
 */
export function isMobileDevice(request: NextRequest | NextApiRequest): boolean {
  const userAgent = getUserAgent(request).toLowerCase();
  return /mobile|android|iphone|ipad|phone/i.test(userAgent);
}

/**
 * Get request method
 */
export function getRequestMethod(request: NextRequest | NextApiRequest): string {
  return request.method || 'GET';
}

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert camelCase to kebab-case
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert kebab-case to camelCase
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Generate slug from string
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length - 3) + '...';
}

// ============================================================================
// Object Utilities
// ============================================================================

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * Check if value is an object
 */
function isObject(item: unknown): item is Record<string, unknown> {
  return item !== null && item !== undefined && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Pick specific keys from object
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Omit specific keys from object
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Check if object is empty
 */
export function isEmpty(obj: unknown): boolean {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  if (obj instanceof Map || obj instanceof Set) return obj.size === 0;
  return Object.keys(obj).length === 0;
}

// ============================================================================
// Array Utilities
// ============================================================================

/**
 * Remove duplicates from array
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Group array items by key
 */
export function groupBy<T>(
  array: T[],
  keyFn: (item: T) => string | number
): Record<string | number, T[]> {
  return array.reduce(
    (groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    },
    {} as Record<string | number, T[]>
  );
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Format date to ISO string
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Parse date from various formats
 */
export function parseDate(date: string | number | Date): Date {
  if (date instanceof Date) return date;
  return new Date(date);
}

/**
 * Check if date is expired
 */
export function isExpired(expiresAt: Date | string | number): boolean {
  const expiry = parseDate(expiresAt);
  return expiry.getTime() < Date.now();
}

/**
 * Add time to date
 */
export function addTime(
  date: Date,
  amount: number,
  unit: 'seconds' | 'minutes' | 'hours' | 'days' = 'seconds'
): Date {
  const result = new Date(date);
  const multipliers = {
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
  };

  result.setTime(result.getTime() + amount * multipliers[unit]);
  return result;
}

/**
 * Get time until expiration in seconds
 */
export function getTimeUntilExpiry(expiresAt: Date | string | number): number {
  const expiry = parseDate(expiresAt);
  const now = Date.now();
  const diff = expiry.getTime() - now;
  return Math.max(0, Math.floor(diff / 1000));
}

// ============================================================================
// Async Utilities
// ============================================================================

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    backoff?: number;
  } = {}
): Promise<T> {
  const { retries = 3, delay = 1000, backoff = 2 } = options;

  let lastError: Error;

  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (i === retries) {
        throw lastError;
      }

      await sleep(delay * Math.pow(backoff, i));
    }
  }

  throw lastError!;
}

/**
 * Timeout promise
 */
export function timeout<T>(
  promise: Promise<T>,
  ms: number,
  message = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Check if string is valid UUID
 */
export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Check if string is valid email
 */
export function isEmail(str: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
}

/**
 * Check if string is valid URL
 */
export function isUrl(str: string): boolean {
  try {
    const url = new URL(str);
    // Only allow http and https protocols for security
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Check if value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// ============================================================================
// Error Utilities
// ============================================================================

/**
 * Create error with additional metadata
 */
export function createError(
  message: string,
  code?: string,
  metadata?: Record<string, unknown>
): Error & { code?: string; metadata?: Record<string, unknown> } {
  const error = new Error(message) as Error & { code?: string; metadata?: Record<string, unknown> };
  if (code) error.code = code;
  if (metadata) error.metadata = metadata;
  return error;
}

/**
 * Check if error has specific code
 */
export function hasErrorCode(error: unknown, code: string): boolean {
  return (
    error !== null &&
    error !== undefined &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code: unknown }).code === code
  );
}

/**
 * Extract error message safely
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (
    error !== null &&
    error !== undefined &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return 'Unknown error occurred';
}

/**
 * Safely get error message from unknown error type
 */
export function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error occurred';
}

// ============================================================================
// Aliases for test compatibility
// ============================================================================

/**
 * Alias for isUrl
 */
export const isValidUrl = isUrl;

/**
 * Alias for isEmail
 */
export const isValidEmail = isEmail;

/**
 * Generate random string with specified length
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Sanitize URL to prevent XSS
 */
export function sanitizeUrl(url: string): string {
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];

  try {
    const parsed = new URL(url);
    if (dangerousProtocols.some(protocol => parsed.protocol.toLowerCase().startsWith(protocol))) {
      return 'about:blank';
    }
    return url;
  } catch {
    // If it's not a valid URL, check if it's a relative path
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return url;
    }
    return 'about:blank';
  }
}
