/* eslint-disable no-console */
/**
 * Example: Advanced cookie and CSRF security
 * Demonstrates secure cookie handling and CSRF protection
 * Note: Console statements are used for demonstration purposes
 */
import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  CSRFProtection,
  withCSRFProtection,
  withApiCSRFProtection,
  createCSRFTokenHandler,
  setSecureCookie,
  validateCookieSecurity,
  parseSecureCookies,
  signCookieValue,
  verifyCookieValue,
} from '../security';

// ============================================================================
// CSRF Protection Examples
// ============================================================================

/**
 * Example: CSRF-protected API route (App Router)
 */
export async function protectedApiRoute(request: NextRequest) {
  return withCSRFProtection(
    request,
    async req => {
      // This handler only runs if CSRF token is valid
      const data = await req.json();

      return NextResponse.json({
        message: 'Data processed successfully',
        data,
        timestamp: new Date().toISOString(),
      });
    },
    {
      // Custom CSRF options
      secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-32-characters-long',
      skipMethods: ['GET', 'HEAD', 'OPTIONS'],
      skipPaths: ['/api/auth/', '/api/public/'],
      headerName: 'x-csrf-token',
      formFieldName: 'csrf_token',
    }
  );
}

/**
 * Example: CSRF token endpoint (App Router)
 */
export const getCSRFToken = createCSRFTokenHandler({
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-32-characters-long',
  cookieOptions: {
    httpOnly: false, // Client needs access to read token
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
  },
});

/**
 * Example: CSRF-protected form submission (Pages Router)
 */
export function createProtectedFormHandler() {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    return withApiCSRFProtection(req, res, async (request, response) => {
      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }

      const { name, email, message } = request.body;

      // Process form data
      console.log('Processing form submission:', { name, email, message });

      response.json({
        success: true,
        message: 'Form submitted successfully',
        data: { name, email },
      });
    });
  };
}

/**
 * Example: Custom CSRF protection with advanced options
 */
export class AdvancedCSRFProtection {
  private csrf: CSRFProtection;

  constructor() {
    this.csrf = new CSRFProtection({
      secret: process.env.NEXTAUTH_SECRET!,
      tokenLength: 32,
      cookieOptions: {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', // Stricter than default
        maxAge: 12 * 60 * 60, // 12 hours
      },
      headerName: 'x-csrf-token',
      formFieldName: 'csrf_token',
      skipMethods: ['GET', 'HEAD', 'OPTIONS', 'TRACE'],
      skipPaths: ['/api/auth/', '/api/public/', '/api/health', '/api/csrf'],
    });
  }

  /**
   * Generate CSRF token for client
   */
  async generateTokenForClient(request: NextRequest): Promise<{
    token: string;
    expires: Date;
    instructions: string[];
  }> {
    const response = new NextResponse();
    const token = this.csrf.generateToken(request, response);
    const expires = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours

    return {
      token,
      expires,
      instructions: [
        'Include this token in the X-CSRF-Token header for all POST/PUT/DELETE requests',
        'Or include it as a form field named "csrf_token"',
        'Token expires in 12 hours',
        'Get a new token from /api/csrf if expired',
      ],
    };
  }

  /**
   * Validate request with detailed error information
   */
  validateRequestWithDetails(request: NextRequest): {
    isValid: boolean;
    error?: string;
    details: {
      method: string;
      path: string;
      hasToken: boolean;
      hasCookie: boolean;
      tokenSource?: string;
      skipReason?: string;
    };
  } {
    const method = request.method;
    const path = new URL(request.url).pathname;

    // Check if request should be skipped
    if (this.csrf['options'].skipMethods.includes(method)) {
      return {
        isValid: true,
        details: {
          method,
          path,
          hasToken: false,
          hasCookie: false,
          skipReason: `Method ${method} is in skip list`,
        },
      };
    }

    if (this.csrf['options'].skipPaths.some(skipPath => path.startsWith(skipPath))) {
      return {
        isValid: true,
        details: {
          method,
          path,
          hasToken: false,
          hasCookie: false,
          skipReason: `Path ${path} is in skip list`,
        },
      };
    }

    // Check for token
    const token = request.headers.get('x-csrf-token');
    const hasCookie = !!request.cookies.get('next-airauth.csrf-token');

    if (!token) {
      return {
        isValid: false,
        error: 'CSRF token missing from request',
        details: {
          method,
          path,
          hasToken: false,
          hasCookie,
          tokenSource: 'none',
        },
      };
    }

    if (!hasCookie) {
      return {
        isValid: false,
        error: 'CSRF cookie missing',
        details: {
          method,
          path,
          hasToken: true,
          hasCookie: false,
          tokenSource: 'header',
        },
      };
    }

    // Validate token
    const isValid = this.csrf.validateToken(request);

    if (isValid) {
      return {
        isValid: true,
        details: {
          method,
          path,
          hasToken: true,
          hasCookie: true,
          tokenSource: 'header',
        },
      };
    } else {
      return {
        isValid: false,
        error: 'CSRF token validation failed',
        details: {
          method,
          path,
          hasToken: true,
          hasCookie: true,
          tokenSource: 'header',
        },
      };
    }
  }
}

// ============================================================================
// Secure Cookie Examples
// ============================================================================

/**
 * Example: Setting secure cookies with validation
 */
export class SecureCookieManager {
  /**
   * Set user preference cookie with security validation
   */
  setUserPreference(
    response: NextResponse,
    preferences: Record<string, unknown>
  ): {
    success: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    const cookieValue = JSON.stringify(preferences);

    const cookieOptions = {
      httpOnly: false, // User preferences need client access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/',
    };

    // Validate security settings
    const security = validateCookieSecurity(cookieOptions);

    // Set the cookie
    setSecureCookie(response, 'user-preferences', cookieValue, {
      ...cookieOptions,
      prefix: 'secure', // Use __Secure- prefix
    });

    return {
      success: true,
      warnings: security.warnings,
      recommendations: security.recommendations,
    };
  }

  /**
   * Set signed session data cookie
   */
  setSignedSessionData(
    response: NextResponse,
    sessionData: Record<string, unknown>,
    secret: string
  ): void {
    const dataString = JSON.stringify(sessionData);
    const signedValue = signCookieValue(dataString, secret);

    setSecureCookie(response, 'session-data', signedValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      prefix: 'host', // Use __Host- prefix for maximum security
    });
  }

  /**
   * Get and verify signed session data
   */
  getSignedSessionData(
    request: NextRequest,
    secret: string
  ): { isValid: boolean; data?: Record<string, unknown>; error?: string } {
    const cookieValue = request.cookies.get('__Host-session-data')?.value;

    if (!cookieValue) {
      return { isValid: false, error: 'Session data cookie not found' };
    }

    const verification = verifyCookieValue(cookieValue, secret);

    if (!verification.isValid) {
      return { isValid: false, error: 'Session data signature invalid' };
    }

    try {
      const data = JSON.parse(verification.value!);
      return { isValid: true, data };
    } catch (error) {
      return { isValid: false, error: 'Session data parsing failed' };
    }
  }

  /**
   * Analyze request cookies for security issues
   */
  analyzeCookieSecurity(request: NextRequest): {
    summary: {
      totalCookies: number;
      secureCookies: number;
      insecureCookies: number;
      hasSecurityPrefixes: boolean;
    };
    issues: string[];
    recommendations: string[];
  } {
    const { security } = parseSecureCookies(request);
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Analyze cookie security
    if (security.insecureCookies.length > 0) {
      issues.push(`${security.insecureCookies.length} cookies without security prefixes`);
    }

    if (!security.hasSecureCookies && process.env.NODE_ENV === 'production') {
      issues.push('No cookies using security prefixes (__Secure- or __Host-)');
      recommendations.push('Consider using __Secure- or __Host- prefixes for sensitive cookies');
    }

    if (security.totalCookies > 20) {
      recommendations.push('Consider reducing the number of cookies for better performance');
    }

    return {
      summary: {
        totalCookies: security.totalCookies,
        secureCookies: security.totalCookies - security.insecureCookies.length,
        insecureCookies: security.insecureCookies.length,
        hasSecurityPrefixes: security.hasSecureCookies,
      },
      issues,
      recommendations,
    };
  }
}

// ============================================================================
// Cookie and CSRF Middleware
// ============================================================================

/**
 * Example: Combined security middleware
 */
export function withSecurityMiddleware(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse
): Promise<NextResponse> | NextResponse {
  // Step 1: Analyze cookie security
  const cookieManager = new SecureCookieManager();
  const cookieAnalysis = cookieManager.analyzeCookieSecurity(request);

  // Step 2: Apply CSRF protection
  return withCSRFProtection(request, async req => {
    // Step 3: Execute handler with security context
    const response = await handler(req);

    // Step 4: Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Step 5: Add cookie security info to response (in development)
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('X-Cookie-Security', JSON.stringify(cookieAnalysis.summary));
    }

    return response;
  });
}

// ============================================================================
// Complete Security Example
// ============================================================================

/**
 * Example: Complete secure form with CSRF protection
 */
export class SecureFormHandler {
  private csrf = new AdvancedCSRFProtection();
  private cookieManager = new SecureCookieManager();

  /**
   * Render secure form with CSRF token
   */
  async renderForm(request: NextRequest): Promise<NextResponse> {
    const { token, expires } = await this.csrf.generateTokenForClient(request);

    const formHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Secure Form</title>
      <meta charset="utf-8">
    </head>
    <body>
      <h1>Secure Contact Form</h1>
      <form action="/api/contact" method="POST">
        <input type="hidden" name="csrf_token" value="${token}">
        
        <div>
          <label for="name">Name:</label>
          <input type="text" id="name" name="name" required>
        </div>
        
        <div>
          <label for="email">Email:</label>
          <input type="email" id="email" name="email" required>
        </div>
        
        <div>
          <label for="message">Message:</label>
          <textarea id="message" name="message" required></textarea>
        </div>
        
        <button type="submit">Send Message</button>
      </form>
      
      <script>
        // For AJAX requests, include CSRF token in header
        const csrfToken = '${token}';
        
        // Example AJAX request
        function sendAjaxRequest(data) {
          fetch('/api/contact', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify(data)
          });
        }
      </script>
      
      <p><small>CSRF token expires: ${expires.toISOString()}</small></p>
    </body>
    </html>
    `;

    return new NextResponse(formHTML, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  /**
   * Handle secure form submission
   */
  async handleFormSubmission(request: NextRequest): Promise<NextResponse> {
    return withSecurityMiddleware(request, async req => {
      const formData = await req.formData();
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message'),
      };

      // Process form data
      console.log('Secure form submission:', data);

      // Set success cookie
      const response = NextResponse.json({
        success: true,
        message: 'Form submitted successfully',
      });

      this.cookieManager.setUserPreference(response, {
        lastSubmission: new Date().toISOString(),
        formType: 'contact',
      });

      return response;
    });
  }

  /**
   * Security status endpoint
   */
  async getSecurityStatus(request: NextRequest): Promise<NextResponse> {
    const validation = this.csrf.validateRequestWithDetails(request);
    const cookieAnalysis = this.cookieManager.analyzeCookieSecurity(request);

    return NextResponse.json({
      csrf: validation,
      cookies: cookieAnalysis,
      security: {
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        recommendations: [
          ...cookieAnalysis.recommendations,
          'Use HTTPS in production',
          'Implement Content Security Policy',
          'Regular security audits',
        ],
      },
    });
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

export const securityExamples = {
  csrfProtection: new AdvancedCSRFProtection(),
  cookieManager: new SecureCookieManager(),
  formHandler: new SecureFormHandler(),
};

// Example API routes:
/*
// app/api/csrf/route.ts
export const GET = getCSRFToken

// app/api/protected/route.ts  
export const POST = protectedApiRoute

// app/form/route.ts
export const GET = securityExamples.formHandler.renderForm
export const POST = securityExamples.formHandler.handleFormSubmission

// app/api/security-status/route.ts
export const GET = securityExamples.formHandler.getSecurityStatus
*/
