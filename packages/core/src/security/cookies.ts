/**
 * Cookie management utilities for AirAuth
 */
import { serialize, parse } from 'cookie';
import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest, NextApiResponse } from 'next';
import { CookieOption } from '../types';
import { getSecureCookieOptions } from './index';

/**
 * Convert CookieOption to cookie library compatible options
 */
function toCookieLibraryOptions(options: CookieOption | Partial<CookieOption>) {
  const result: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'lax';
    path?: string;
    maxAge?: number;
    expires?: Date;
  } = {};

  if (options.httpOnly !== undefined) result.httpOnly = options.httpOnly;
  if (options.secure !== undefined) result.secure = options.secure;
  if (options.sameSite === 'lax') result.sameSite = options.sameSite;
  if (options.path !== undefined) result.path = options.path;
  if (options.maxAge !== undefined) result.maxAge = options.maxAge;
  if (options.expires !== undefined) result.expires = options.expires;

  return result;
}

// ============================================================================
// Cookie Names
// ============================================================================

export const COOKIE_NAMES = {
  SESSION_TOKEN: 'next-airauth.session-token',
  CALLBACK_URL: 'next-airauth.callback-url',
  CSRF_TOKEN: 'next-airauth.csrf-token',
  PKCE_CODE_VERIFIER: 'next-airauth.pkce.code_verifier',
  STATE: 'next-airauth.state',
  NONCE: 'next-airauth.nonce',
} as const;

// ============================================================================
// Cookie Utilities
// ============================================================================

/**
 * Set cookie in Next.js App Router response
 */
export function setCookie(
  response: NextResponse,
  name: string,
  value: string,
  options: CookieOption = {}
): void {
  const secureOptions = getSecureCookieOptions(options);
  const cookieOptions = toCookieLibraryOptions(secureOptions);
  const serialized = serialize(name, value, cookieOptions);
  response.headers.append('Set-Cookie', serialized);
}

/**
 * Get cookie from Next.js App Router request
 */
export function getCookie(request: NextRequest, name: string): string | undefined {
  return request.cookies.get(name)?.value;
}

/**
 * Delete cookie in Next.js App Router response
 */
export function deleteCookie(
  response: NextResponse,
  name: string,
  options: Partial<CookieOption> = {}
): void {
  const secureOptions = getSecureCookieOptions(options);
  const cookieOptions = toCookieLibraryOptions({
    ...secureOptions,
    maxAge: 0,
    expires: new Date(0),
  });
  const serialized = serialize(name, '', cookieOptions);
  response.headers.append('Set-Cookie', serialized);
}

/**
 * Set cookie in Pages Router API response
 */
export function setApiCookie(
  res: NextApiResponse,
  name: string,
  value: string,
  options: CookieOption = {}
): void {
  const secureOptions = getSecureCookieOptions(options);
  const cookieOptions = toCookieLibraryOptions(secureOptions);
  const serialized = serialize(name, value, cookieOptions);

  const existingCookies = res.getHeader('Set-Cookie') || [];
  const cookies = Array.isArray(existingCookies) ? existingCookies : [String(existingCookies)];
  res.setHeader('Set-Cookie', [...cookies, serialized]);
}

/**
 * Get cookie from Pages Router API request
 */
export function getApiCookie(req: NextApiRequest, name: string): string | undefined {
  if (!req.headers.cookie) return undefined;
  const cookies = parse(req.headers.cookie);
  return cookies[name];
}

/**
 * Delete cookie in Pages Router API response
 */
export function deleteApiCookie(
  res: NextApiResponse,
  name: string,
  options: Partial<CookieOption> = {}
): void {
  const secureOptions = getSecureCookieOptions(options);
  const cookieOptions = toCookieLibraryOptions({
    ...secureOptions,
    maxAge: 0,
    expires: new Date(0),
  });
  const serialized = serialize(name, '', cookieOptions);

  const existingCookies = res.getHeader('Set-Cookie') || [];
  const cookies = Array.isArray(existingCookies) ? existingCookies : [String(existingCookies)];
  res.setHeader('Set-Cookie', [...cookies, serialized]);
}

// ============================================================================
// Session Cookie Management
// ============================================================================

/**
 * Set session token cookie
 */
export function setSessionCookie(
  response: NextResponse | NextApiResponse,
  sessionToken: string,
  maxAge?: number
): void {
  const options: CookieOption = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAge || 30 * 24 * 60 * 60, // 30 days
  };

  if (response instanceof NextResponse) {
    setCookie(response, COOKIE_NAMES.SESSION_TOKEN, sessionToken, options);
  } else {
    setApiCookie(response, COOKIE_NAMES.SESSION_TOKEN, sessionToken, options);
  }
}

/**
 * Get session token from cookie
 */
export function getSessionCookie(request: NextRequest | NextApiRequest): string | undefined {
  if (request instanceof NextRequest) {
    return getCookie(request, COOKIE_NAMES.SESSION_TOKEN);
  } else {
    return getApiCookie(request, COOKIE_NAMES.SESSION_TOKEN);
  }
}

/**
 * Delete session token cookie
 */
export function deleteSessionCookie(response: NextResponse | NextApiResponse): void {
  if (response instanceof NextResponse) {
    deleteCookie(response, COOKIE_NAMES.SESSION_TOKEN);
  } else {
    deleteApiCookie(response, COOKIE_NAMES.SESSION_TOKEN);
  }
}

// ============================================================================
// CSRF Token Cookie Management
// ============================================================================

/**
 * Set CSRF token cookie
 */
export function setCSRFCookie(response: NextResponse | NextApiResponse, csrfToken: string): void {
  const options: CookieOption = {
    httpOnly: false, // CSRF token needs to be accessible to client
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60, // 24 hours
  };

  if (response instanceof NextResponse) {
    setCookie(response, COOKIE_NAMES.CSRF_TOKEN, csrfToken, options);
  } else {
    setApiCookie(response, COOKIE_NAMES.CSRF_TOKEN, csrfToken, options);
  }
}

/**
 * Get CSRF token from cookie
 */
export function getCSRFCookie(request: NextRequest | NextApiRequest): string | undefined {
  if (request instanceof NextRequest) {
    return getCookie(request, COOKIE_NAMES.CSRF_TOKEN);
  } else {
    return getApiCookie(request, COOKIE_NAMES.CSRF_TOKEN);
  }
}

// ============================================================================
// PKCE Cookie Management
// ============================================================================

/**
 * Set PKCE code verifier cookie
 */
export function setPKCECookie(
  response: NextResponse | NextApiResponse,
  codeVerifier: string
): void {
  const options: CookieOption = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60, // 10 minutes
  };

  if (response instanceof NextResponse) {
    setCookie(response, COOKIE_NAMES.PKCE_CODE_VERIFIER, codeVerifier, options);
  } else {
    setApiCookie(response, COOKIE_NAMES.PKCE_CODE_VERIFIER, codeVerifier, options);
  }
}

/**
 * Get PKCE code verifier from cookie
 */
export function getPKCECookie(request: NextRequest | NextApiRequest): string | undefined {
  if (request instanceof NextRequest) {
    return getCookie(request, COOKIE_NAMES.PKCE_CODE_VERIFIER);
  } else {
    return getApiCookie(request, COOKIE_NAMES.PKCE_CODE_VERIFIER);
  }
}

/**
 * Delete PKCE code verifier cookie
 */
export function deletePKCECookie(response: NextResponse | NextApiResponse): void {
  if (response instanceof NextResponse) {
    deleteCookie(response, COOKIE_NAMES.PKCE_CODE_VERIFIER);
  } else {
    deleteApiCookie(response, COOKIE_NAMES.PKCE_CODE_VERIFIER);
  }
}

// ============================================================================
// State Cookie Management
// ============================================================================

/**
 * Set OAuth state cookie
 */
export function setStateCookie(response: NextResponse | NextApiResponse, state: string): void {
  const options: CookieOption = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60, // 10 minutes
  };

  if (response instanceof NextResponse) {
    setCookie(response, COOKIE_NAMES.STATE, state, options);
  } else {
    setApiCookie(response, COOKIE_NAMES.STATE, state, options);
  }
}

/**
 * Get OAuth state from cookie
 */
export function getStateCookie(request: NextRequest | NextApiRequest): string | undefined {
  if (request instanceof NextRequest) {
    return getCookie(request, COOKIE_NAMES.STATE);
  } else {
    return getApiCookie(request, COOKIE_NAMES.STATE);
  }
}

/**
 * Delete OAuth state cookie
 */
export function deleteStateCookie(response: NextResponse | NextApiResponse): void {
  if (response instanceof NextResponse) {
    deleteCookie(response, COOKIE_NAMES.STATE);
  } else {
    deleteApiCookie(response, COOKIE_NAMES.STATE);
  }
}

// ============================================================================
// Callback URL Cookie Management
// ============================================================================

/**
 * Set callback URL cookie
 */
export function setCallbackUrlCookie(
  response: NextResponse | NextApiResponse,
  callbackUrl: string
): void {
  const options: CookieOption = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60, // 10 minutes
  };

  if (response instanceof NextResponse) {
    setCookie(response, COOKIE_NAMES.CALLBACK_URL, callbackUrl, options);
  } else {
    setApiCookie(response, COOKIE_NAMES.CALLBACK_URL, callbackUrl, options);
  }
}

/**
 * Get callback URL from cookie
 */
export function getCallbackUrlCookie(request: NextRequest | NextApiRequest): string | undefined {
  if (request instanceof NextRequest) {
    return getCookie(request, COOKIE_NAMES.CALLBACK_URL);
  } else {
    return getApiCookie(request, COOKIE_NAMES.CALLBACK_URL);
  }
}

/**
 * Delete callback URL cookie
 */
export function deleteCallbackUrlCookie(response: NextResponse | NextApiResponse): void {
  if (response instanceof NextResponse) {
    deleteCookie(response, COOKIE_NAMES.CALLBACK_URL);
  } else {
    deleteApiCookie(response, COOKIE_NAMES.CALLBACK_URL);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clear all authentication cookies
 */
export function clearAllAuthCookies(response: NextResponse | NextApiResponse): void {
  deleteSessionCookie(response);
  deleteCallbackUrlCookie(response);
  deletePKCECookie(response);
  deleteStateCookie(response);

  if (response instanceof NextResponse) {
    deleteCookie(response, COOKIE_NAMES.CSRF_TOKEN);
    deleteCookie(response, COOKIE_NAMES.NONCE);
  } else {
    deleteApiCookie(response, COOKIE_NAMES.CSRF_TOKEN);
    deleteApiCookie(response, COOKIE_NAMES.NONCE);
  }
}

/**
 * Get all authentication cookies
 */
export function getAllAuthCookies(
  request: NextRequest | NextApiRequest
): Record<string, string | undefined> {
  return {
    sessionToken: getSessionCookie(request),
    callbackUrl: getCallbackUrlCookie(request),
    csrfToken: getCSRFCookie(request),
    pkceCodeVerifier: getPKCECookie(request),
    state: getStateCookie(request),
    nonce:
      request instanceof NextRequest
        ? getCookie(request, COOKIE_NAMES.NONCE)
        : getApiCookie(request, COOKIE_NAMES.NONCE),
  };
}

// ============================================================================
// Advanced Cookie Security
// ============================================================================

/**
 * Set secure cookie with enhanced security options
 */
export function setSecureCookie(
  response: NextResponse | NextApiResponse,
  name: string,
  value: string,
  options: CookieOption & {
    encrypt?: boolean;
    sign?: boolean;
    prefix?: 'host' | 'secure';
  } = {}
): void {
  const { encrypt, sign, prefix, ...baseCookieOptions } = options;

  // TODO: Implement encrypt and sign functionality
  void encrypt; // Intentionally unused - placeholder for future encryption
  void sign; // Intentionally unused - placeholder for future signing

  const finalValue = value;
  let finalName = name;

  // Create modified options for prefixes
  const cookieOptions: CookieOption = { ...baseCookieOptions };

  // Apply cookie prefixes for enhanced security
  if (prefix === 'host') {
    finalName = `__Host-${name}`;
    cookieOptions.secure = true;
    cookieOptions.path = '/';
    delete cookieOptions.domain; // __Host- prefix requires no domain
  } else if (prefix === 'secure') {
    finalName = `__Secure-${name}`;
    cookieOptions.secure = true;
  }

  // TODO: Implement encryption and signing if needed
  // This would require additional crypto utilities

  if (response instanceof NextResponse) {
    setCookie(response, finalName, finalValue, cookieOptions);
  } else {
    setApiCookie(response, finalName, finalValue, cookieOptions);
  }
}

/**
 * Validate cookie security settings
 */
export function validateCookieSecurity(options: CookieOption): {
  isSecure: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check for security flags
  if (process.env.NODE_ENV === 'production') {
    if (!options.secure) {
      warnings.push('Cookie should have Secure flag in production');
    }

    if (!options.httpOnly) {
      warnings.push('Cookie should have HttpOnly flag for security');
    }
  }

  // Check SameSite setting
  if (!options.sameSite || options.sameSite === 'none') {
    if (options.sameSite === 'none' && !options.secure) {
      warnings.push('SameSite=None requires Secure flag');
    } else if (!options.sameSite) {
      recommendations.push('Consider setting SameSite attribute');
    }
  }

  // Check expiration
  if (!options.maxAge && !options.expires) {
    recommendations.push('Consider setting cookie expiration');
  }

  // Check path
  if (!options.path) {
    recommendations.push('Consider setting explicit path');
  }

  const isSecure = warnings.length === 0;

  return { isSecure, warnings, recommendations };
}

/**
 * Create cookie with security validation
 */
export function createSecureCookie(
  name: string,
  value: string,
  options: CookieOption = {}
): {
  cookie: string;
  security: ReturnType<typeof validateCookieSecurity>;
} {
  const secureOptions = getSecureCookieOptions(options);
  const security = validateCookieSecurity(secureOptions);
  const cookieOptions = toCookieLibraryOptions(secureOptions);
  const cookie = serialize(name, value, cookieOptions);

  return { cookie, security };
}

/**
 * Parse and validate cookies from request
 */
export function parseSecureCookies(request: NextRequest | NextApiRequest): {
  cookies: Record<string, string>;
  security: {
    hasSecureCookies: boolean;
    insecureCookies: string[];
    totalCookies: number;
  };
} {
  let cookieHeader: string | undefined;

  if (request instanceof NextRequest) {
    cookieHeader = request.headers.get('cookie') || undefined;
  } else {
    cookieHeader = request.headers.cookie;
  }

  if (!cookieHeader) {
    return {
      cookies: {},
      security: {
        hasSecureCookies: false,
        insecureCookies: [],
        totalCookies: 0,
      },
    };
  }

  const cookies = parse(cookieHeader);
  const insecureCookies: string[] = [];

  // Check for security prefixes
  Object.keys(cookies).forEach(name => {
    if (!name.startsWith('__Secure-') && !name.startsWith('__Host-')) {
      // This is a simplified check - in reality, we'd need more context
      // about the cookie's attributes to determine if it's secure
      if (process.env.NODE_ENV === 'production') {
        insecureCookies.push(name);
      }
    }
  });

  return {
    cookies,
    security: {
      hasSecureCookies: Object.keys(cookies).some(
        name => name.startsWith('__Secure-') || name.startsWith('__Host-')
      ),
      insecureCookies,
      totalCookies: Object.keys(cookies).length,
    },
  };
}

// ============================================================================
// Cookie Integrity Protection
// ============================================================================

/**
 * Sign cookie value with HMAC
 */
export function signCookieValue(value: string, secret: string): string {
  const signature = createHmac('sha256', secret).update(value).digest('base64url');

  return `${value}.${signature}`;
}

/**
 * Verify signed cookie value
 */
export function verifyCookieValue(
  signedValue: string,
  secret: string
): { isValid: boolean; value?: string } {
  if (!signedValue || !secret) {
    return { isValid: false };
  }

  const parts = signedValue.split('.');
  if (parts.length !== 2) {
    return { isValid: false };
  }

  const [value, signature] = parts;
  if (!value || !signature) {
    return { isValid: false };
  }

  try {
    const expectedSignature = createHmac('sha256', secret).update(value).digest('base64url');
    const isValid = timingSafeEqual(
      Buffer.from(signature, 'base64url'),
      Buffer.from(expectedSignature, 'base64url')
    );

    return isValid ? { isValid, value } : { isValid };
  } catch (error) {
    return { isValid: false };
  }
}

// ============================================================================
// Cookie Cleanup and Management
// ============================================================================

/**
 * Clean up expired or invalid cookies
 */
export function cleanupCookies(
  response: NextResponse | NextApiResponse,
  cookiesToClean: string[] = []
): void {
  const defaultCookiesToClean = [
    COOKIE_NAMES.SESSION_TOKEN,
    COOKIE_NAMES.CSRF_TOKEN,
    COOKIE_NAMES.PKCE_CODE_VERIFIER,
    COOKIE_NAMES.STATE,
    COOKIE_NAMES.NONCE,
    COOKIE_NAMES.CALLBACK_URL,
  ];

  const allCookies = [...defaultCookiesToClean, ...cookiesToClean];

  allCookies.forEach(cookieName => {
    if (response instanceof NextResponse) {
      deleteCookie(response, cookieName);
    } else {
      deleteApiCookie(response, cookieName);
    }
  });
}

/**
 * Rotate all authentication cookies
 */
export function rotateAuthCookies(
  request: NextRequest | NextApiRequest,
  response: NextResponse | NextApiResponse
): void {
  // Get current session
  const sessionToken = getSessionCookie(request);

  if (sessionToken) {
    // Clear old cookies
    clearAllAuthCookies(response);

    // Set new session cookie with fresh expiration
    const config = getConfig();
    const maxAge = config.session?.maxAge || 30 * 24 * 60 * 60;
    setSessionCookie(response, sessionToken, maxAge);
  }
}

// Import required functions
import { createHmac, timingSafeEqual } from 'crypto';
import { getConfig } from '../core';
