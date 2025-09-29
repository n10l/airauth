/* eslint-disable no-console */
/**
 * Example: Complete OAuth flow with PKCE support
 * This demonstrates how to implement secure OAuth authentication
 * Note: Console statements are used for demonstration purposes
 */
import { NextApiRequest, NextApiResponse } from 'next';
import {
  GitHub,
  Google,
  generateAuthorizationUrl,
  completeOAuthFlow,
  validateCallbackParams,
} from '../index';

// ============================================================================
// Provider Configuration
// ============================================================================

// GitHub provider with PKCE enabled by default
const githubProvider = GitHub({
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  scope: 'read:user user:email', // Optional: custom scopes
});

// Google provider with OpenID Connect and PKCE
const googleProvider = Google({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      scope: 'openid email profile',
      access_type: 'offline', // Get refresh token
      prompt: 'consent',
    },
  },
});

// ============================================================================
// Step 1: Initiate OAuth Flow (Sign In Button Click)
// ============================================================================

export function initiateOAuthFlow(providerId: string, callbackUrl: string) {
  const provider = providerId === 'github' ? githubProvider : googleProvider;

  // Generate authorization URL with PKCE
  const { url, state, codeVerifier } = generateAuthorizationUrl(provider, callbackUrl, {
    enablePKCE: true, // Explicitly enable PKCE (default: true)
    scopes: ['read:user', 'user:email'], // Optional: override scopes
    additionalParams: {
      // Optional: additional OAuth parameters
      prompt: 'consent',
    },
  });

  console.log('🔐 OAuth Flow Initiated:');
  console.log('Provider:', provider.name);
  console.log('PKCE Enabled:', provider.enablePKCE);
  console.log('State:', state);
  console.log('Code Verifier:', codeVerifier ? 'Generated' : 'Not used');
  console.log('Authorization URL:', url);

  // In a real app, you would:
  // 1. Store state and codeVerifier in secure cookies/session
  // 2. Redirect user to the authorization URL
  return { url, state, codeVerifier };
}

// ============================================================================
// Step 2: Handle OAuth Callback
// ============================================================================

export async function handleOAuthCallback(
  providerId: string,
  callbackParams: {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  },
  callbackUrl: string
) {
  try {
    // Validate callback parameters
    const { code, state } = validateCallbackParams(callbackParams);

    console.log('📥 OAuth Callback Received:');
    console.log('Code:', code ? 'Received' : 'Missing');
    console.log('State:', state);

    const provider = providerId === 'github' ? githubProvider : googleProvider;

    // Complete OAuth flow with PKCE verification
    const result = await completeOAuthFlow(provider, code, state, callbackUrl);

    console.log('✅ OAuth Flow Completed:');
    console.log('User ID:', result.user.id);
    console.log('User Name:', result.user.name);
    console.log('User Email:', result.user.email);
    console.log('Access Token:', result.tokens.access_token ? 'Received' : 'Missing');
    console.log('Refresh Token:', result.tokens.refresh_token ? 'Received' : 'Not provided');

    return result;
  } catch (error) {
    console.error('❌ OAuth Flow Failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// ============================================================================
// Step 3: Next.js API Route Example
// ============================================================================

/**
 * Example Next.js API route for OAuth sign-in
 * File: pages/api/auth/signin/[provider].ts or app/api/auth/signin/[provider]/route.ts
 */
export function createSignInHandler() {
  return async function handler(request: NextApiRequest, response: NextApiResponse) {
    const { provider } = request.query;
    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/auth/callback/${provider}`;

    try {
      if (!provider || typeof provider !== 'string') {
        throw new Error('Provider parameter is required and must be a string');
      }
      const { url } = initiateOAuthFlow(provider, callbackUrl);

      // Redirect to OAuth provider
      if (response.redirect) {
        // Next.js Pages Router
        response.redirect(302, url);
        return;
      } else {
        // Next.js App Router
        return Response.redirect(url, 302);
      }
    } catch (error) {
      console.error('Sign-in error:', error);

      if (response.status) {
        // Pages Router
        response.status(500).json({ error: 'Authentication failed' });
        return;
      } else {
        // App Router
        return Response.json({ error: 'Authentication failed' }, { status: 500 });
      }
    }
  };
}

/**
 * Example Next.js API route for OAuth callback
 * File: pages/api/auth/callback/[provider].ts or app/api/auth/callback/[provider]/route.ts
 */
export function createCallbackHandler() {
  return async function handler(request: NextApiRequest, response: NextApiResponse) {
    const { provider } = request.query;
    const callbackParams =
      request.query || (request.url ? Object.fromEntries(new URL(request.url).searchParams) : {});
    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/auth/callback/${provider}`;

    try {
      if (!provider || typeof provider !== 'string') {
        throw new Error('Provider parameter is required and must be a string');
      }
      await handleOAuthCallback(provider, callbackParams, callbackUrl);

      // Create user session (implementation depends on your session strategy)
      // For JWT strategy:
      // const sessionToken = await createJWTSession(result.user)
      // For database strategy:
      // const session = await createDatabaseSession(result.user, result.tokens)

      // Set session cookie and redirect
      const callbackUrlParam = callbackParams.callbackUrl;
      const redirectUrl = Array.isArray(callbackUrlParam)
        ? callbackUrlParam[0]
        : callbackUrlParam || '/';

      if (!redirectUrl) {
        throw new Error('Invalid redirect URL');
      }

      if (response.redirect) {
        // Pages Router
        response.redirect(302, redirectUrl);
        return;
      } else {
        // App Router
        return Response.redirect(redirectUrl, 302);
      }
    } catch (error) {
      console.error('Callback error:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorUrl = `/auth/error?error=${encodeURIComponent(errorMessage)}`;

      if (response.redirect) {
        response.redirect(302, errorUrl);
        return;
      } else {
        return Response.redirect(errorUrl, 302);
      }
    }
  };
}

// ============================================================================
// Security Benefits of PKCE
// ============================================================================

/**
 * Why PKCE is Important:
 *
 * 1. **Authorization Code Interception Protection**
 *    - Without PKCE: Attacker can intercept authorization code and exchange it for tokens
 *    - With PKCE: Attacker needs both code AND code_verifier (which never leaves the client)
 *
 * 2. **Public Client Security**
 *    - Mobile apps and SPAs cannot securely store client secrets
 *    - PKCE eliminates the need for client secrets in the authorization flow
 *
 * 3. **Man-in-the-Middle Attack Prevention**
 *    - Code verifier is generated on the client and never transmitted
 *    - Only the SHA256 hash (code challenge) is sent to the authorization server
 *
 * 4. **Compliance with OAuth 2.1**
 *    - OAuth 2.1 mandates PKCE for all OAuth clients
 *    - Future-proofs your authentication implementation
 *
 * 5. **Zero Trust Architecture**
 *    - Assumes network communications can be compromised
 *    - Provides cryptographic proof of client identity
 */

// ============================================================================
// PKCE Flow Diagram
// ============================================================================

/**
 * PKCE OAuth Flow:
 *
 * 1. Client generates code_verifier (random string)
 * 2. Client creates code_challenge = SHA256(code_verifier)
 * 3. Client redirects to authorization server with code_challenge
 * 4. User authenticates and authorizes
 * 5. Authorization server redirects back with authorization code
 * 6. Client exchanges code + code_verifier for tokens
 * 7. Authorization server verifies SHA256(code_verifier) == code_challenge
 * 8. If valid, authorization server returns access token
 *
 * Security: Even if authorization code is intercepted, attacker cannot
 * exchange it for tokens without the code_verifier.
 */

export const PKCEFlowExample = {
  initiateOAuthFlow,
  handleOAuthCallback,
  createSignInHandler,
  createCallbackHandler,
};
