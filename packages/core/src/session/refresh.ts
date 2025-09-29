/* eslint-disable no-console */
/**
 * Automatic session refresh and token management
 * Handles OAuth token refresh and session extension
 */
import { NextRequest } from 'next/server';
import { NextApiRequest } from 'next';
import { Session, User, TokenSet, OAuthProvider } from '../types';
import { getConfig } from '../core';
import { getSessionManager } from './index';

// ============================================================================
// Token Refresh Interface
// ============================================================================

export interface TokenRefreshResult {
  success: boolean;
  tokens?: TokenSet;
  user?: User;
  error?: string;
}

export interface RefreshTokenOptions {
  provider: OAuthProvider;
  refreshToken: string;
  user: User;
}

// ============================================================================
// OAuth Token Refresh
// ============================================================================

/**
 * Refresh OAuth access token using refresh token
 */
export async function refreshOAuthTokens(
  options: RefreshTokenOptions
): Promise<TokenRefreshResult> {
  const { provider, refreshToken, user } = options;

  if (!refreshToken) {
    return {
      success: false,
      error: 'No refresh token available',
    };
  }

  const tokenUrl = typeof provider.token === 'string' ? provider.token : provider.token.url;

  const tokenParams = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: provider.clientId,
    client_secret: provider.clientSecret,
  });

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
      return {
        success: false,
        error: `Token refresh failed: ${response.status} ${response.statusText} - ${errorText}`,
      };
    }

    const tokens = (await response.json()) as TokenSet;

    // Validate required token fields
    if (!tokens.access_token) {
      return {
        success: false,
        error: 'No access token received from refresh',
      };
    }

    // Calculate expires_at if expires_in is provided
    if (tokens.expires_in && !tokens.expires_at) {
      tokens.expires_at = Math.floor(Date.now() / 1000) + tokens.expires_in;
    }

    // If no new refresh token provided, keep the old one
    if (!tokens.refresh_token) {
      tokens.refresh_token = refreshToken;
    }

    return {
      success: true,
      tokens,
      user,
    };
  } catch (error) {
    return {
      success: false,
      error: `Token refresh request failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ============================================================================
// Session Refresh Manager
// ============================================================================

export class SessionRefreshManager {
  private refreshPromises = new Map<string, Promise<TokenRefreshResult>>();

  /**
   * Refresh session with new tokens
   */
  async refreshSession(session: Session, provider: OAuthProvider): Promise<Session | null> {
    if (!session.refreshToken) {
      return null;
    }

    // Prevent concurrent refresh requests for the same user
    const userId = session.user.id;
    if (this.refreshPromises.has(userId)) {
      const result = await this.refreshPromises.get(userId)!;
      return this.createUpdatedSession(session, result);
    }

    // Start refresh process
    const refreshPromise = this.performTokenRefresh(session, provider);
    this.refreshPromises.set(userId, refreshPromise);

    try {
      const result = await refreshPromise;
      return this.createUpdatedSession(session, result);
    } finally {
      this.refreshPromises.delete(userId);
    }
  }

  private async performTokenRefresh(
    session: Session,
    provider: OAuthProvider
  ): Promise<TokenRefreshResult> {
    return refreshOAuthTokens({
      provider,
      refreshToken: session.refreshToken!,
      user: session.user,
    });
  }

  private createUpdatedSession(
    originalSession: Session,
    refreshResult: TokenRefreshResult
  ): Session | null {
    if (!refreshResult.success || !refreshResult.tokens) {
      return null;
    }

    const config = getConfig();
    const maxAge = config.session?.maxAge || 30 * 24 * 60 * 60; // 30 days
    const newExpiry = new Date(Date.now() + maxAge * 1000);

    return {
      ...originalSession,
      ...(refreshResult.tokens.access_token && { accessToken: refreshResult.tokens.access_token }),
      ...(refreshResult.tokens.refresh_token && {
        refreshToken: refreshResult.tokens.refresh_token,
      }),
      expires: newExpiry.toISOString(),
    };
  }
}

// ============================================================================
// Automatic Session Refresh
// ============================================================================

/**
 * Check if session tokens need refresh
 */
export function shouldRefreshTokens(session: Session): boolean {
  if (!session.accessToken || !session.refreshToken) {
    return false;
  }

  // If we have token expiry information, check if it's close to expiring
  // This would need to be stored in the session or JWT
  // For now, we'll use a simple time-based approach

  const sessionExpiry = new Date(session.expires).getTime();
  const now = Date.now();
  const timeUntilExpiry = sessionExpiry - now;
  const refreshThreshold = 5 * 60 * 1000; // 5 minutes

  return timeUntilExpiry < refreshThreshold;
}

/**
 * Automatically refresh session if needed
 */
export async function autoRefreshSession(
  session: Session,
  provider: OAuthProvider
): Promise<Session | null> {
  if (!shouldRefreshTokens(session)) {
    return session;
  }

  const refreshManager = new SessionRefreshManager();
  return refreshManager.refreshSession(session, provider);
}

// ============================================================================
// Background Token Refresh
// ============================================================================

export class BackgroundRefreshManager {
  private refreshIntervals = new Map<string, NodeJS.Timeout>();
  private isEnabled = false;

  /**
   * Start background refresh for a session
   */
  startBackgroundRefresh(
    sessionId: string,
    session: Session,
    provider: OAuthProvider,
    onRefresh?: (newSession: Session) => void
  ): void {
    if (!this.isEnabled || !session.refreshToken) {
      return;
    }

    // Clear existing interval
    this.stopBackgroundRefresh(sessionId);

    // Calculate refresh interval (refresh when 80% of session time has passed)
    const sessionExpiry = new Date(session.expires).getTime();
    const now = Date.now();
    const sessionDuration = sessionExpiry - now;
    const refreshInterval = Math.max(sessionDuration * 0.8, 5 * 60 * 1000); // At least 5 minutes

    const interval = setInterval(async () => {
      try {
        const refreshManager = new SessionRefreshManager();
        const refreshedSession = await refreshManager.refreshSession(session, provider);

        if (refreshedSession && onRefresh) {
          onRefresh(refreshedSession);
        } else {
          // Refresh failed, stop trying
          this.stopBackgroundRefresh(sessionId);
        }
      } catch (error) {
        const config = getConfig();
        if (config.debug) {
          console.warn('[NextAirAuth] Background refresh failed:', error);
        }
        this.stopBackgroundRefresh(sessionId);
      }
    }, refreshInterval);

    this.refreshIntervals.set(sessionId, interval);
  }

  /**
   * Stop background refresh for a session
   */
  stopBackgroundRefresh(sessionId: string): void {
    const interval = this.refreshIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.refreshIntervals.delete(sessionId);
    }
  }

  /**
   * Enable/disable background refresh
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;

    if (!enabled) {
      // Stop all active refreshes
      for (const [sessionId] of this.refreshIntervals) {
        this.stopBackgroundRefresh(sessionId);
      }
    }
  }

  /**
   * Stop all background refreshes
   */
  stopAll(): void {
    for (const [sessionId] of this.refreshIntervals) {
      this.stopBackgroundRefresh(sessionId);
    }
  }
}

// ============================================================================
// Global Background Refresh Manager
// ============================================================================

let globalBackgroundRefreshManager: BackgroundRefreshManager | null = null;

export function getBackgroundRefreshManager(): BackgroundRefreshManager {
  if (!globalBackgroundRefreshManager) {
    globalBackgroundRefreshManager = new BackgroundRefreshManager();
  }
  return globalBackgroundRefreshManager;
}

// ============================================================================
// Session Refresh Utilities
// ============================================================================

/**
 * Refresh session and update storage
 */
export async function refreshAndUpdateSession(
  session: Session,
  provider: OAuthProvider
): Promise<Session | null> {
  const sessionManager = getSessionManager();
  const refreshManager = new SessionRefreshManager();

  try {
    const refreshedSession = await refreshManager.refreshSession(session, provider);

    if (refreshedSession) {
      // Update session in storage
      return await sessionManager.updateSession(session, refreshedSession);
    }

    return null;
  } catch (error) {
    const config = getConfig();
    if (config.debug) {
      console.error('[NextAirAuth] Session refresh failed:', error);
    }
    return null;
  }
}

/**
 * Get session with automatic refresh
 */
export async function getSessionWithRefresh(
  request: { headers: Headers; url: string; method: string },
  provider?: OAuthProvider
): Promise<Session | null> {
  const sessionManager = getSessionManager();

  try {
    // Create a mock NextApiRequest for getSession
    const mockRequest = {
      ...request,
      query: {},
      cookies: {},
      body: undefined,
      env: {},
    } as unknown as NextRequest | NextApiRequest;

    const session = await sessionManager.getSession(mockRequest);

    if (!session || !provider) {
      return session;
    }

    // Check if refresh is needed
    if (shouldRefreshTokens(session)) {
      const refreshedSession = await refreshAndUpdateSession(session, provider);
      return refreshedSession || session;
    }

    return session;
  } catch (error) {
    return null;
  }
}

// ============================================================================
// Token Refresh Error Handling
// ============================================================================

/**
 * Handle token refresh errors
 */
export function handleRefreshError(error: unknown, session: Session): Session {
  const config = getConfig();

  if (config.debug) {
    console.error('[NextAirAuth] Token refresh error:', error);
  }

  // Mark session with error but don't invalidate it immediately
  return {
    ...session,
    error: 'token_refresh_failed',
  };
}

/**
 * Check if session has refresh errors
 */
export function hasRefreshError(session: Session): boolean {
  return session.error === 'token_refresh_failed';
}

/**
 * Clear refresh errors from session
 */
export function clearRefreshError(session: Session): Session {
  const { error: _error, ...cleanSession } = session;
  void _error; // Intentionally unused - error is being removed from session
  return cleanSession;
}

// ============================================================================
// Aliases for backward compatibility and test compatibility
// ============================================================================

/**
 * Alias for refreshOAuthTokens - simplified interface for tests
 */
export async function refreshAccessToken(
  provider: OAuthProvider,
  refreshToken: string
): Promise<TokenSet> {
  const result = await refreshOAuthTokens({
    provider,
    refreshToken,
    user: { id: 'temp', name: null, email: null }, // Minimal user for token refresh
  });

  if (!result.success || !result.tokens) {
    throw new Error(result.error || 'Token refresh failed');
  }

  return result.tokens;
}

/**
 * Alias for shouldRefreshTokens - simplified interface for tests
 */
export function shouldRefreshToken(
  tokens: { expires_at?: number; refresh_token?: string },
  bufferTime = 300000
): boolean {
  if (!tokens.refresh_token) {
    return false;
  }

  if (!tokens.expires_at) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = tokens.expires_at;
  const bufferSeconds = Math.floor(bufferTime / 1000);

  return expiresAt - now <= bufferSeconds;
}
