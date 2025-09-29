/**
 * Advanced CSRF protection with double-submit cookie pattern
 * Implements secure CSRF token generation, validation, and management
 */
import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest, NextApiResponse } from 'next';
import { createHash, timingSafeEqual } from 'crypto';
import { nanoid } from 'nanoid';
import { AuthenticationError, NextAirAuthError } from '../types';
import { getCookie, setCookie, getApiCookie, setApiCookie, COOKIE_NAMES } from './cookies';
import { getConfig } from '../core';

// ============================================================================
// CSRF Token Configuration
// ============================================================================

export interface CSRFOptions {
  secret?: string;
  tokenLength?: number;
  cookieOptions?: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
  };
  headerName?: string;
  formFieldName?: string;
  skipMethods?: string[];
  skipPaths?: string[];
}

export interface CSRFTokenPair {
  token: string;
  hashedToken: string;
}

// Default CSRF configuration
const DEFAULT_CSRF_OPTIONS: Required<CSRFOptions> = {
  secret: '',
  tokenLength: 32,
  cookieOptions: {
    httpOnly: false, // CSRF token needs to be accessible to client
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  headerName: 'x-csrf-token',
  formFieldName: 'csrf_token',
  skipMethods: ['GET', 'HEAD', 'OPTIONS'],
  skipPaths: ['/api/auth/csrf', '/api/auth/session'],
};

// ============================================================================
// CSRF Token Generation
// ============================================================================

/**
 * Generate CSRF token pair (token + hashed token)
 */
export function generateCSRFTokenPair(secret?: string): CSRFTokenPair {
  const token = nanoid(32);
  const hashedToken = hashCSRFToken(token, secret);

  return { token, hashedToken };
}

/**
 * Hash CSRF token with secret for double-submit cookie pattern
 */
export function hashCSRFToken(token: string, secret?: string): string {
  const config = getConfig();
  const csrfSecret = secret || config.jwt?.secret || process.env.NEXTAUTH_SECRET;

  if (!csrfSecret) {
    throw new NextAirAuthError(
      'CSRF secret is required. Set NEXTAUTH_SECRET or provide jwt.secret in config.',
      'CONFIGURATION_ERROR'
    );
  }

  return createHash('sha256')
    .update(token + csrfSecret)
    .digest('hex');
}

/**
 * Verify CSRF token against hashed token
 */
export function verifyCSRFToken(token: string, hashedToken: string, secret?: string): boolean {
  if (!token || !hashedToken) {
    return false;
  }

  try {
    const expectedHash = hashCSRFToken(token, secret);
    return timingSafeEqual(Buffer.from(expectedHash), Buffer.from(hashedToken));
  } catch (error) {
    return false;
  }
}

// ============================================================================
// CSRF Middleware
// ============================================================================

export class CSRFProtection {
  private options: Required<CSRFOptions>;

  constructor(options: CSRFOptions = {}) {
    this.options = { ...DEFAULT_CSRF_OPTIONS, ...options };

    // Use JWT secret as CSRF secret if not provided
    if (!this.options.secret) {
      const config = getConfig();
      this.options.secret = config.jwt?.secret || process.env.NEXTAUTH_SECRET || '';
    }
  }

  /**
   * Generate and set CSRF token (App Router)
   */
  generateToken(request: NextRequest, response: NextResponse): string {
    const { token, hashedToken } = generateCSRFTokenPair(this.options.secret);

    // Set CSRF token in cookie
    setCookie(response, COOKIE_NAMES.CSRF_TOKEN, hashedToken, this.options.cookieOptions);

    return token;
  }

  /**
   * Generate and set CSRF token (Pages Router)
   */
  generateApiToken(req: NextApiRequest, res: NextApiResponse): string {
    const { token, hashedToken } = generateCSRFTokenPair(this.options.secret);

    // Set CSRF token in cookie
    setApiCookie(res, COOKIE_NAMES.CSRF_TOKEN, hashedToken, this.options.cookieOptions);

    return token;
  }

  /**
   * Validate CSRF token (App Router)
   */
  validateToken(request: NextRequest): boolean {
    // Skip validation for safe methods
    if (this.options.skipMethods.includes(request.method)) {
      return true;
    }

    // Skip validation for specific paths
    const pathname = new URL(request.url).pathname;
    if (this.options.skipPaths.some(path => pathname.startsWith(path))) {
      return true;
    }

    // Get token from header or form data
    const token = this.extractToken(request);
    if (!token) {
      return false;
    }

    // Get hashed token from cookie
    const hashedToken = getCookie(request, COOKIE_NAMES.CSRF_TOKEN);
    if (!hashedToken) {
      return false;
    }

    return verifyCSRFToken(token, hashedToken, this.options.secret);
  }

  /**
   * Validate CSRF token (Pages Router)
   */
  validateApiToken(req: NextApiRequest): boolean {
    // Skip validation for safe methods
    if (this.options.skipMethods.includes(req.method || 'GET')) {
      return true;
    }

    // Skip validation for specific paths
    if (this.options.skipPaths.some(path => req.url?.startsWith(path))) {
      return true;
    }

    // Get token from header or body
    const token = this.extractApiToken(req);
    if (!token) {
      return false;
    }

    // Get hashed token from cookie
    const hashedToken = getApiCookie(req, COOKIE_NAMES.CSRF_TOKEN);
    if (!hashedToken) {
      return false;
    }

    return verifyCSRFToken(token, hashedToken, this.options.secret);
  }

  /**
   * Extract CSRF token from request
   */
  private extractToken(request: NextRequest): string | null {
    // Try header first
    const headerToken = request.headers.get(this.options.headerName);
    if (headerToken) {
      return headerToken;
    }

    // Try form data for POST requests (note: formData() is async, so we skip it in sync context)
    // For form data token extraction, use the async verifyCSRFToken method instead

    return null;
  }

  /**
   * Extract CSRF token from API request
   */
  private extractApiToken(req: NextApiRequest): string | null {
    // Try header first
    const headerToken = req.headers[this.options.headerName] as string;
    if (headerToken) {
      return headerToken;
    }

    // Try body for POST requests
    if (req.method === 'POST' && req.body) {
      const bodyToken = req.body[this.options.formFieldName];
      if (bodyToken) {
        return bodyToken;
      }
    }

    return null;
  }
}

// ============================================================================
// CSRF Middleware Functions
// ============================================================================

/**
 * CSRF protection middleware for App Router
 */
export function withCSRFProtection(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse,
  options?: CSRFOptions
): Promise<NextResponse> | NextResponse {
  const csrf = new CSRFProtection(options);

  // Validate CSRF token
  if (!csrf.validateToken(request)) {
    return NextResponse.json(
      {
        error: 'CSRF token validation failed',
        code: 'CSRF_TOKEN_INVALID',
      },
      { status: 403 }
    );
  }

  return handler(request);
}

/**
 * CSRF protection middleware for Pages Router
 */
export async function withApiCSRFProtection(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options?: CSRFOptions
): Promise<void> {
  const csrf = new CSRFProtection(options);

  // Validate CSRF token
  if (!csrf.validateApiToken(req)) {
    res.status(403).json({
      error: 'CSRF token validation failed',
      code: 'CSRF_TOKEN_INVALID',
    });
    return;
  }

  return handler(req, res);
}

// ============================================================================
// CSRF Token API Endpoints
// ============================================================================

/**
 * Get CSRF token endpoint (App Router)
 */
export function createCSRFTokenHandler(options?: CSRFOptions) {
  return function handler(request: NextRequest): NextResponse {
    const csrf = new CSRFProtection(options);
    const response = NextResponse.json({ success: true });

    const token = csrf.generateToken(request, response);

    return NextResponse.json(
      {
        csrfToken: token,
        expires: new Date(Date.now() + (options?.cookieOptions?.maxAge || 24 * 60 * 60) * 1000),
      },
      { headers: response.headers }
    );
  };
}

/**
 * Get CSRF token endpoint (Pages Router)
 */
export function createApiCSRFTokenHandler(options?: CSRFOptions) {
  return function handler(req: NextApiRequest, res: NextApiResponse): void {
    const csrf = new CSRFProtection(options);
    const token = csrf.generateApiToken(req, res);

    res.json({
      csrfToken: token,
      expires: new Date(Date.now() + (options?.cookieOptions?.maxAge || 24 * 60 * 60) * 1000),
    });
  };
}

// ============================================================================
// CSRF Utilities
// ============================================================================

/**
 * Get current CSRF token from cookie
 */
export function getCSRFToken(request: NextRequest | NextApiRequest): string | null {
  if (request instanceof NextRequest) {
    return getCookie(request, COOKIE_NAMES.CSRF_TOKEN) ?? null;
  } else {
    return getApiCookie(request, COOKIE_NAMES.CSRF_TOKEN) ?? null;
  }
}

/**
 * Check if request needs CSRF protection
 */
export function needsCSRFProtection(
  request: NextRequest | NextApiRequest,
  options: CSRFOptions = {}
): boolean {
  const method = request instanceof NextRequest ? request.method : request.method || 'GET';
  const skipMethods = options.skipMethods || DEFAULT_CSRF_OPTIONS.skipMethods;

  if (skipMethods.includes(method)) {
    return false;
  }

  const url = request instanceof NextRequest ? request.url : request.url || '';
  const pathname = new URL(url, 'http://localhost').pathname;
  const skipPaths = options.skipPaths || DEFAULT_CSRF_OPTIONS.skipPaths;

  return !skipPaths.some(path => pathname.startsWith(path));
}

/**
 * Create CSRF-protected form HTML
 */
export function createCSRFForm(
  action: string,
  csrfToken: string,
  fields: Record<string, string> = {},
  options: { method?: string; formFieldName?: string } = {}
): string {
  const method = options.method || 'POST';
  const fieldName = options.formFieldName || DEFAULT_CSRF_OPTIONS.formFieldName;

  const fieldInputs = Object.entries(fields)
    .map(([name, value]) => `<input type="hidden" name="${name}" value="${value}">`)
    .join('\n  ');

  return `<form action="${action}" method="${method}">
  <input type="hidden" name="${fieldName}" value="${csrfToken}">
  ${fieldInputs}
  <button type="submit">Submit</button>
</form>`;
}

/**
 * Create CSRF-protected fetch request
 */
export function createCSRFRequest(
  url: string,
  csrfToken: string,
  options: RequestInit = {}
): RequestInit {
  const headers = new Headers(options.headers);
  headers.set(DEFAULT_CSRF_OPTIONS.headerName, csrfToken);

  return {
    ...options,
    headers,
  };
}

// ============================================================================
// CSRF Error Handling
// ============================================================================

export class CSRFError extends AuthenticationError {
  constructor(
    message: string = 'CSRF token validation failed',
    metadata?: Record<string, unknown>
  ) {
    super(message, metadata);
    this.name = 'CSRFError';
  }
}

/**
 * Handle CSRF validation errors
 */
export function handleCSRFError(
  error: unknown,
  request: NextRequest | NextApiRequest,
  response?: NextApiResponse
): NextResponse | void {
  const config = getConfig();

  if (config.debug) {
    // eslint-disable-next-line no-console
    console.error('[NextAirAuth] CSRF validation failed:', {
      method: request instanceof NextRequest ? request.method : request.method,
      url: request instanceof NextRequest ? request.url : request.url,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  if (request instanceof NextRequest) {
    return NextResponse.json(
      {
        error: 'CSRF protection failed',
        code: 'CSRF_TOKEN_INVALID',
        message: 'Request blocked by CSRF protection',
      },
      { status: 403 }
    );
  } else if (response) {
    response.status(403).json({
      error: 'CSRF protection failed',
      code: 'CSRF_TOKEN_INVALID',
      message: 'Request blocked by CSRF protection',
    });
  } else {
    throw new CSRFError('CSRF protection failed - no response object provided for NextApiRequest');
  }
}

// ============================================================================
// Global CSRF Protection Instance
// ============================================================================

let globalCSRFProtection: CSRFProtection | null = null;

export function getCSRFProtection(options?: CSRFOptions): CSRFProtection {
  if (!globalCSRFProtection) {
    globalCSRFProtection = new CSRFProtection(options);
  }
  return globalCSRFProtection;
}

export function resetCSRFProtection(): void {
  globalCSRFProtection = null;
}

// ============================================================================
// CSRF Token Rotation
// ============================================================================

/**
 * Rotate CSRF token for enhanced security
 */
export function rotateCSRFToken(
  request: NextRequest,
  response: NextResponse,
  options?: CSRFOptions
): string {
  const csrf = new CSRFProtection(options);
  return csrf.generateToken(request, response);
}

/**
 * Rotate CSRF token for API routes
 */
export function rotateApiCSRFToken(
  req: NextApiRequest,
  res: NextApiResponse,
  options?: CSRFOptions
): string {
  const csrf = new CSRFProtection(options);
  return csrf.generateApiToken(req, res);
}

// ============================================================================
// CSRF Debugging
// ============================================================================

/**
 * Debug CSRF token information
 */
export function debugCSRFToken(request: NextRequest | NextApiRequest): {
  hasToken: boolean;
  tokenSource: 'header' | 'form' | 'none';
  hasCookie: boolean;
  isValid: boolean;
  error?: string;
} {
  try {
    // Check for token in request
    let tokenSource: 'header' | 'form' | 'none' = 'none';
    let token: string | null = null;

    if (request instanceof NextRequest) {
      token = request.headers.get(DEFAULT_CSRF_OPTIONS.headerName);
      if (token) tokenSource = 'header';
    } else {
      token = request.headers[DEFAULT_CSRF_OPTIONS.headerName] as string;
      if (token) tokenSource = 'header';
      else if (request.body?.[DEFAULT_CSRF_OPTIONS.formFieldName]) {
        token = request.body[DEFAULT_CSRF_OPTIONS.formFieldName];
        tokenSource = 'form';
      }
    }

    // Check for cookie
    const hashedToken =
      request instanceof NextRequest
        ? getCookie(request, COOKIE_NAMES.CSRF_TOKEN)
        : getApiCookie(request, COOKIE_NAMES.CSRF_TOKEN);

    // Validate token
    const isValid = token && hashedToken ? verifyCSRFToken(token, hashedToken) : false;

    return {
      hasToken: !!token,
      tokenSource,
      hasCookie: !!hashedToken,
      isValid,
    };
  } catch (error) {
    return {
      hasToken: false,
      tokenSource: 'none',
      hasCookie: false,
      isValid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
