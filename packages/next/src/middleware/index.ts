/**
 * Next.js Middleware for protecting routes
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { NextAirAuthOptions } from '../index';

export interface MiddlewareOptions {
  /**
   * Routes that require authentication
   * @default ['/dashboard', '/profile', '/settings']
   */
  protected?: string[];

  /**
   * Routes that should redirect to dashboard if user is authenticated
   * @default ['/login', '/signin', '/register', '/signup']
   */
  public?: string[];

  /**
   * URL to redirect to when not authenticated
   * @default '/auth/signin'
   */
  signInUrl?: string;

  /**
   * URL to redirect to after sign in
   * @default '/dashboard'
   */
  callbackUrl?: string;

  /**
   * Custom authorization logic
   */
  authorized?: (params: { auth: any; request: NextRequest }) => boolean | Promise<boolean>;
}

/**
 * Create Next.js middleware for authentication
 *
 * @example
 * ```ts
 * // middleware.ts
 * import { withAuth } from '@airauth/next/middleware'
 *
 * export default withAuth({
 *   protected: ['/dashboard', '/admin'],
 *   signInUrl: '/auth/signin',
 * })
 *
 * export const config = {
 *   matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
 * }
 * ```
 */
export function withAuth(options: MiddlewareOptions = {}) {
  const {
    protected: protectedRoutes = ['/dashboard', '/profile', '/settings'],
    public: publicRoutes = ['/login', '/signin', '/register', '/signup'],
    signInUrl = '/auth/signin',
    callbackUrl = '/dashboard',
    authorized,
  } = options;

  return async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if route requires authentication
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // Get session from cookie
    const sessionToken = request.cookies.get('next-airauth.session-token')?.value;
    const isAuthenticated = !!sessionToken;

    // Custom authorization check
    if (authorized) {
      const isAuthorized = await authorized({
        auth: isAuthenticated ? { sessionToken } : null,
        request,
      });

      if (!isAuthorized && isProtectedRoute) {
        const signInUrlWithCallback = new URL(signInUrl, request.url);
        signInUrlWithCallback.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(signInUrlWithCallback);
      }
    }

    // Redirect to sign in if accessing protected route without auth
    if (isProtectedRoute && !isAuthenticated) {
      const signInUrlWithCallback = new URL(signInUrl, request.url);
      signInUrlWithCallback.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrlWithCallback);
    }

    // Redirect to dashboard if accessing public route with auth
    if (isPublicRoute && isAuthenticated) {
      return NextResponse.redirect(new URL(callbackUrl, request.url));
    }

    return NextResponse.next();
  };
}

/**
 * Create authorized middleware with role-based access control
 */
export function withRoleAuth(requiredRole: string | string[], options?: MiddlewareOptions) {
  return withAuth({
    ...options,
    authorized: async ({ auth }) => {
      if (!auth) return false;

      // In real implementation, decode JWT or fetch session to get user role
      // This is a simplified version
      const userRole = 'user'; // Get from session/JWT

      if (Array.isArray(requiredRole)) {
        return requiredRole.includes(userRole);
      }

      return userRole === requiredRole;
    },
  });
}

/**
 * Protect API routes
 */
export function withApiAuth(handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) {
  return async function protectedApiRoute(request: NextRequest) {
    const sessionToken = request.cookies.get('next-airauth.session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session token
    // In real implementation, verify JWT or check database session

    return handler(request);
  };
}

/**
 * Edge runtime compatible middleware
 */
export function createEdgeMiddleware(options: MiddlewareOptions = {}) {
  return withAuth(options);
}

export default withAuth;
