/**
 * OAuth 2.0 flow implementation with PKCE support
 * Handles authorization URL generation, token exchange, and user info retrieval
 */
import { OAuthProvider, TokenSet, User, AuthorizationError } from '../types';
import { generatePKCE, generateState, generateNonce } from '../security';

// ============================================================================
// OAuth Flow State Management
// ============================================================================

export interface OAuthFlowState {
  state: string;
  nonce?: string;
  codeVerifier?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  provider: string;
  callbackUrl: string;
  createdAt: number;
}

// In-memory state storage (in production, this should be in cookies/session)
const oauthStates = new Map<string, OAuthFlowState>();

// ============================================================================
// Authorization URL Generation
// ============================================================================

/**
 * Generate OAuth authorization URL with PKCE support
 */
export function generateAuthorizationUrl(
  provider: OAuthProvider,
  callbackUrl: string,
  options: {
    enablePKCE?: boolean;
    scopes?: string[];
    additionalParams?: Record<string, string>;
  } = {}
): {
  url: string;
  state: string;
  codeVerifier?: string;
  nonce?: string;
} {
  const { enablePKCE = true, scopes, additionalParams = {} } = options;

  // Generate security parameters
  const state = generateState();
  const nonce = provider.checks?.includes('nonce') ? generateNonce() : undefined;

  let codeVerifier: string | undefined;
  let codeChallenge: string | undefined;
  let codeChallengeMethod: string | undefined;

  // Generate PKCE parameters if enabled
  if (enablePKCE || provider.checks?.includes('pkce')) {
    const pkce = generatePKCE();
    codeVerifier = pkce.codeVerifier;
    codeChallenge = pkce.codeChallenge;
    codeChallengeMethod = pkce.codeChallengeMethod;
  }

  // Store OAuth state
  const flowState: OAuthFlowState = {
    state,
    ...(nonce && { nonce }),
    ...(codeVerifier && { codeVerifier }),
    ...(codeChallenge && { codeChallenge }),
    ...(codeChallengeMethod && { codeChallengeMethod }),
    provider: provider.id,
    callbackUrl,
    createdAt: Date.now(),
  };
  oauthStates.set(state, flowState);

  // Build authorization URL
  const authUrl =
    typeof provider.authorization === 'string'
      ? provider.authorization
      : provider.authorization.url;

  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    state,
    ...additionalParams,
  });

  // Add PKCE parameters
  if (codeChallenge && codeChallengeMethod) {
    params.set('code_challenge', codeChallenge);
    params.set('code_challenge_method', codeChallengeMethod);
  }

  // Add nonce for OpenID Connect
  if (nonce) {
    params.set('nonce', nonce);
  }

  // Add scopes
  if (scopes?.length) {
    params.set('scope', scopes.join(' '));
  } else if (typeof provider.authorization === 'object' && provider.authorization.params?.scope) {
    params.set('scope', provider.authorization.params.scope);
  }

  // Add additional authorization parameters
  if (typeof provider.authorization === 'object' && provider.authorization.params) {
    Object.entries(provider.authorization.params).forEach(([key, value]) => {
      if (key !== 'scope') {
        // Don't override scope
        params.set(key, value);
      }
    });
  }

  const url = `${authUrl}?${params.toString()}`;

  return {
    url,
    state,
    ...(codeVerifier && { codeVerifier }),
    ...(nonce && { nonce }),
  };
}

// ============================================================================
// Token Exchange
// ============================================================================

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForTokens(
  provider: OAuthProvider,
  code: string,
  state: string,
  callbackUrl: string
): Promise<TokenSet> {
  // Retrieve and validate OAuth state
  const flowState = oauthStates.get(state);
  if (!flowState) {
    throw new AuthorizationError('Invalid or expired OAuth state', { state });
  }

  if (flowState.provider !== provider.id) {
    throw new AuthorizationError('OAuth state provider mismatch', {
      expected: provider.id,
      received: flowState.provider,
    });
  }

  // Clean up state
  oauthStates.delete(state);

  // Check state expiration (10 minutes)
  if (Date.now() - flowState.createdAt > 10 * 60 * 1000) {
    throw new AuthorizationError('OAuth state expired');
  }

  // Build token request
  const tokenUrl = typeof provider.token === 'string' ? provider.token : provider.token.url;

  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: provider.clientId,
    client_secret: provider.clientSecret,
    code,
    redirect_uri: callbackUrl,
  });

  // Add PKCE code verifier
  if (flowState.codeVerifier) {
    tokenParams.set('code_verifier', flowState.codeVerifier);
  }

  // Add additional token parameters
  if (typeof provider.token === 'object' && provider.token.params) {
    Object.entries(provider.token.params).forEach(([key, value]) => {
      tokenParams.set(key, value);
    });
  }

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'User-Agent': 'airauth/0.1.0',
      },
      body: tokenParams.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AuthorizationError(
        `Token exchange failed: ${response.status} ${response.statusText}`,
        { status: response.status, error: errorText }
      );
    }

    const tokens = (await response.json()) as TokenSet;

    // Validate required token fields
    if (!tokens.access_token) {
      throw new AuthorizationError('No access token received from provider');
    }

    // Calculate expires_at if expires_in is provided
    if (tokens.expires_in && !tokens.expires_at) {
      tokens.expires_at = Math.floor(Date.now() / 1000) + tokens.expires_in;
    }

    return tokens;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      throw error;
    }

    throw new AuthorizationError(
      `Token exchange request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        originalError: error,
      }
    );
  }
}

// ============================================================================
// User Info Retrieval
// ============================================================================

/**
 * Fetch user profile from OAuth provider
 */
export async function fetchUserProfile(
  provider: OAuthProvider,
  tokens: TokenSet
): Promise<Record<string, unknown>> {
  if (!provider.userinfo) {
    throw new AuthorizationError('Provider does not support userinfo endpoint');
  }

  const userinfoUrl =
    typeof provider.userinfo === 'string' ? provider.userinfo : provider.userinfo.url;

  try {
    const response = await fetch(userinfoUrl, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: 'application/json',
        'User-Agent': 'airauth/0.1.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AuthorizationError(
        `User info request failed: ${response.status} ${response.statusText}`,
        { status: response.status, error: errorText }
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      throw error;
    }

    throw new AuthorizationError(
      `User info request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        originalError: error,
      }
    );
  }
}

/**
 * Process user profile using provider's profile function
 */
export async function processUserProfile(
  provider: OAuthProvider,
  profile: Record<string, unknown>,
  tokens: TokenSet
): Promise<User> {
  if (!provider.profile) {
    // Default profile processing
    const profileObj = profile as Record<string, unknown>;
    return {
      id: (profileObj.id || profileObj.sub) as string,
      name: (profileObj.name || profileObj.login || profileObj.username) as
        | string
        | null
        | undefined,
      email: profileObj.email as string | null | undefined,
      image: (profileObj.avatar_url || profileObj.picture || profileObj.image) as
        | string
        | null
        | undefined,
    };
  }

  try {
    return await provider.profile(profile, tokens);
  } catch (error) {
    throw new AuthorizationError(
      `Profile processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        profile,
        originalError: error,
      }
    );
  }
}

// ============================================================================
// Complete OAuth Flow
// ============================================================================

/**
 * Complete OAuth flow: exchange code and fetch user profile
 */
export async function completeOAuthFlow(
  provider: OAuthProvider,
  code: string,
  state: string,
  callbackUrl: string
): Promise<{
  user: User;
  tokens: TokenSet;
  profile: Record<string, unknown>;
}> {
  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(provider, code, state, callbackUrl);

  // Fetch user profile
  const profile = await fetchUserProfile(provider, tokens);

  // Process user profile
  const user = await processUserProfile(provider, profile, tokens);

  return {
    user,
    tokens,
    profile,
  };
}

// ============================================================================
// State Management Utilities
// ============================================================================

/**
 * Clean up expired OAuth states
 */
export function cleanupExpiredStates(): void {
  const now = Date.now();
  const expiredStates: string[] = [];

  for (const [state, flowState] of oauthStates.entries()) {
    if (now - flowState.createdAt > 10 * 60 * 1000) {
      // 10 minutes
      expiredStates.push(state);
    }
  }

  expiredStates.forEach(state => oauthStates.delete(state));
}

/**
 * Get OAuth state
 */
export function getOAuthState(state: string): OAuthFlowState | undefined {
  return oauthStates.get(state);
}

/**
 * Validate OAuth state
 */
export function validateOAuthState(state: string, providerId: string): OAuthFlowState {
  const flowState = oauthStates.get(state);

  if (!flowState) {
    throw new AuthorizationError('Invalid or expired OAuth state');
  }

  if (flowState.provider !== providerId) {
    throw new AuthorizationError('OAuth state provider mismatch');
  }

  if (Date.now() - flowState.createdAt > 10 * 60 * 1000) {
    oauthStates.delete(state);
    throw new AuthorizationError('OAuth state expired');
  }

  return flowState;
}

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Handle OAuth error responses
 */
export function handleOAuthError(
  error: string,
  errorDescription?: string,
  errorUri?: string
): never {
  const message = errorDescription || error || 'OAuth authorization failed';

  throw new AuthorizationError(message, {
    error,
    error_description: errorDescription,
    error_uri: errorUri,
  });
}

/**
 * Validate OAuth callback parameters
 */
export function validateCallbackParams(params: {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}): { code: string; state: string } {
  // Check for OAuth errors
  if (params.error) {
    handleOAuthError(params.error, params.error_description, params.error_uri);
  }

  // Validate required parameters
  if (!params.code) {
    throw new AuthorizationError('Missing authorization code in callback');
  }

  if (!params.state) {
    throw new AuthorizationError('Missing state parameter in callback');
  }

  return {
    code: params.code,
    state: params.state,
  };
}
