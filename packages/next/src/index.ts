/**
 * @airauth/next
 * Next.js integration for AirAuth
 *
 * This is a placeholder implementation for the beta release.
 * Full implementation coming soon!
 */

import type { NextRequest } from 'next/server';

// Export placeholder types
export interface Session {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
  };
  expires?: string;
}

export interface NextAirAuthOptions {
  providers?: any[];
  adapter?: any;
  secret?: string;
  session?: {
    strategy?: 'jwt' | 'database';
    maxAge?: number;
  };
  callbacks?: {
    session?: (params: any) => Promise<any>;
    jwt?: (params: any) => Promise<any>;
  };
}

export interface NextAirAuthResult {
  handlers: {
    GET: (request: NextRequest) => Promise<Response>;
    POST: (request: NextRequest) => Promise<Response>;
  };
  auth: () => Promise<Session | null>;
  signIn: (provider: string, options?: any) => Promise<void>;
  signOut: (options?: any) => Promise<void>;
}

/**
 * Initialize NextAirAuth with configuration
 *
 * @example
 * ```ts
 * import { NextAirAuth } from '@airauth/next'
 * import GoogleProvider from '@airauth/next/providers/google'
 *
 * export const { auth, handlers, signIn, signOut } = NextAirAuth({
 *   providers: [
 *     GoogleProvider({
 *       clientId: process.env.GOOGLE_CLIENT_ID,
 *       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
 *     })
 *   ]
 * })
 * ```
 */
export function NextAirAuth(config: NextAirAuthOptions): NextAirAuthResult {
  // Placeholder implementation
  console.warn(
    '@airauth/next: This is a placeholder implementation. Full features coming in the next release!'
  );

  return {
    handlers: {
      GET: async (request: NextRequest) => {
        return new Response(
          JSON.stringify({
            message: 'AirAuth GET handler - Coming soon!',
          }),
          {
            headers: { 'content-type': 'application/json' },
          }
        );
      },
      POST: async (request: NextRequest) => {
        return new Response(
          JSON.stringify({
            message: 'AirAuth POST handler - Coming soon!',
          }),
          {
            headers: { 'content-type': 'application/json' },
          }
        );
      },
    },
    auth: async () => {
      // Return null session for now
      return null;
    },
    signIn: async (provider: string, options?: any) => {
      console.log(`Sign in with ${provider} - Coming soon!`);
    },
    signOut: async (options?: any) => {
      console.log('Sign out - Coming soon!');
    },
  };
}

// Export a simple AirAuth function for compatibility
export function AirAuth(config: NextAirAuthOptions) {
  return NextAirAuth(config);
}

// Re-export common types
export type { NextRequest, NextResponse } from 'next/server';

// Placeholder hooks for client-side usage
export function useSession() {
  return {
    data: null as Session | null,
    status: 'unauthenticated' as 'authenticated' | 'unauthenticated' | 'loading',
    update: async (data: any) => null as Session | null,
  };
}

export async function signIn(provider?: string, options?: any) {
  console.log(`Client-side sign in with ${provider} - Coming soon!`);
}

export async function signOut(options?: any) {
  console.log('Client-side sign out - Coming soon!');
}

// Placeholder SessionProvider for React
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return children as any;
}

export default NextAirAuth;
