/**
 * @airauth/core - Modern, TypeScript-first authentication library for Next.js 14/15
 *
 * @description A comprehensive authentication solution with NextAuth.js compatibility,
 * modern security practices, and excellent developer experience.
 *
 * @author Your Name
 * @license MIT
 */

// ============================================================================
// Core Types and Interfaces
// ============================================================================
export * from './types';

// ============================================================================
// Security Utilities
// ============================================================================
export * from './security';

// Re-export specific functions that tests expect
export { generatePKCE, verifyPKCE, encodeJWT, decodeJWT } from './security';

// ============================================================================
// Provider System
// ============================================================================
export {
  GitHub,
  Google,
  Discord,
  LinkedIn,
  Microsoft,
  OAuth,
  EmailProvider,
  GitHubProvider,
  GitHubProviderFn,
  GoogleProviderFn,
  DiscordProviderFn,
  LinkedInProviderFn,
  MicrosoftProviderFn,
  OAuthProviderFn,
  providers,
  getProviderById,
  validateProviderConfig,
  getProviderDisplayName,
  providerSupportsPKCE,
  getProviderScopes,
  testProviderConfig,
} from './providers';

// ============================================================================
// OAuth Flow Implementation
// ============================================================================
export {
  generateAuthorizationUrl,
  exchangeCodeForTokens,
  fetchUserProfile,
  processUserProfile,
  completeOAuthFlow,
  getOAuthState,
  validateOAuthState,
  handleOAuthError,
  validateCallbackParams,
} from './oauth';

// ============================================================================
// Session Management
// ============================================================================
export * from './session';

// Re-export session functions for testing
export {
  createSessionManager,
  createSessionFromJWT,
  JWTSessionStrategy,
  DatabaseSessionStrategy,
} from './session';

// ============================================================================
// Database Adapters (TODO: Implement adapters)
// ============================================================================
// export * from './adapters'

// ============================================================================
// Next.js Integration (TODO: Implement Next.js specific features)
// ============================================================================
// export * from './next'

// ============================================================================
// React Hooks and Components (TODO: Implement React components)
// ============================================================================
// export * from './react'

// ============================================================================
// Utility Functions (selective exports to avoid conflicts)
// ============================================================================
export {
  buildUrl,
  parseCallbackUrl,
  getCurrentUrl,
  getSearchParams,
  getClientIP,
  getUserAgent,
  isMobileDevice,
  getRequestMethod,
  capitalize,
  camelToKebab,
  kebabToCamel,
  slugify,
  truncate,
  deepMerge,
  pick,
  omit,
  isEmpty,
  unique,
  groupBy,
  chunk,
  formatDate,
  parseDate,
  getTimeUntilExpiry,
  sleep,
  retry,
  timeout,
  isUUID,
  isDefined,
  createError,
  hasErrorCode,
  getErrorMessage,
  generateRandomString,
} from './utils';

// ============================================================================
// Main Configuration and Setup
// ============================================================================
export {
  NextAirAuth,
  getConfig,
  isInitialized,
  resetConfig,
  getProvider,
  getProvidersByType,
  hasProvider,
  getSessionStrategy,
  getJWTSecret,
  getBaseUrl,
  getCallbackUrl,
  validateRuntimeConfig,
  printConfigSummary,
} from './core';

// ============================================================================
// Version Information
// ============================================================================
export const version = '0.1.0';
