/**
 * Provider-specific type definitions
 */
import { User, Provider, OAuthProvider } from './index';

// ============================================================================
// Built-in Provider Types
// ============================================================================

export interface GitHubProfile {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  hireable: boolean | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GoogleProfile {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
}

export interface LinkedInProfile {
  id: string;
  firstName: {
    localized: Record<string, string>;
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  lastName: {
    localized: Record<string, string>;
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  profilePicture: {
    'displayImage~': {
      elements: Array<{
        identifiers: Array<{
          identifier: string;
        }>;
      }>;
    };
  };
}

export interface MicrosoftProfile {
  sub: string;
  name: string;
  family_name: string;
  given_name: string;
  picture: string;
  email: string;
}

export interface DiscordProfile {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  banner?: string | null;
  accent_color?: number | null;
  locale?: string;
  verified?: boolean;
  email?: string | null;
  flags?: number;
  premium_type?: number;
  public_flags?: number;
}

// ============================================================================
// Provider Configuration Options
// ============================================================================

export interface GitHubProviderOptions {
  clientId: string;
  clientSecret: string;
  scope?: string;
  allowDangerousEmailAccountLinking?: boolean;
}

export interface GoogleProviderOptions {
  clientId: string;
  clientSecret: string;
  authorization?: {
    params: {
      scope?: string;
      prompt?: string;
      access_type?: string;
      response_type?: string;
    };
  };
  allowDangerousEmailAccountLinking?: boolean;
}

export interface LinkedInProviderOptions {
  clientId: string;
  clientSecret: string;
  scope?: string;
  allowDangerousEmailAccountLinking?: boolean;
}

export interface MicrosoftProviderOptions {
  clientId: string;
  clientSecret: string;
  tenantId?: string;
  scope?: string;
  allowDangerousEmailAccountLinking?: boolean;
}

export interface DiscordProviderOptions {
  clientId: string;
  clientSecret: string;
  scope?: string;
  allowDangerousEmailAccountLinking?: boolean;
}

export interface EmailProviderOptions {
  server?:
    | string
    | { host: string; port: number; auth: { user: string; pass: string }; secure?: boolean };
  from?: string;
  maxAge?: number;
  generateVerificationToken?: () => string;
  sendVerificationRequest?: (params: {
    identifier: string;
    url: string;
    token: string;
    expires: Date;
  }) => Promise<void>;
}

export interface EmailProvider extends Provider {
  type: 'email';
  server:
    | string
    | { host: string; port: number; auth: { user: string; pass: string }; secure?: boolean };
  from: string;
  maxAge: number;
  generateVerificationToken: () => string;
  sendVerificationRequest: (params: {
    identifier: string;
    url: string;
    token: string;
    expires: Date;
    provider: EmailProvider;
  }) => Promise<void>;
}

export interface CustomOAuthProviderOptions {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  authorization:
    | string
    | {
        url: string;
        params?: Record<string, string>;
      };
  token:
    | string
    | {
        url: string;
        params?: Record<string, string>;
      };
  userinfo:
    | string
    | {
        url: string;
        params?: Record<string, string>;
      };
  profile: (profile: Record<string, unknown>) => Promise<User>;
  checks?: ('pkce' | 'state' | 'nonce')[];
  allowDangerousEmailAccountLinking?: boolean;
  // Enhanced OAuth client security (enabled by default for better security)
  enablePKCE?: boolean; // Default: true - PKCE protection for OAuth flows
}

// ============================================================================
// Provider Factory Functions
// ============================================================================

export type ProviderFactory<T = Record<string, unknown>> = (options: T) => Provider;

export interface ProviderFactories {
  GitHub: ProviderFactory<GitHubProviderOptions>;
  Google: ProviderFactory<GoogleProviderOptions>;
  LinkedIn: ProviderFactory<LinkedInProviderOptions>;
  Microsoft: ProviderFactory<MicrosoftProviderOptions>;
  Discord: ProviderFactory<DiscordProviderOptions>;
  OAuth: ProviderFactory<CustomOAuthProviderOptions>;
}

// ============================================================================
// PKCE Types
// ============================================================================

export interface PKCECodeChallenge {
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  codeVerifier: string;
}

export interface OAuthState {
  state: string;
  nonce?: string;
  pkce?: PKCECodeChallenge;
}

// ============================================================================
// OAuth Flow Types
// ============================================================================

export interface AuthorizationUrlParams {
  provider: OAuthProvider;
  callbackUrl: string;
  state: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  nonce?: string;
}

export interface TokenRequestParams {
  provider: OAuthProvider;
  code: string;
  codeVerifier?: string;
  redirectUri: string;
}

export interface UserInfoRequestParams {
  provider: OAuthProvider;
  accessToken: string;
}

// ============================================================================
// Email Provider Types
// ============================================================================

export interface EmailTemplate {
  subject: string;
  text: string;
  html?: string;
}

export interface EmailTemplateParams {
  url: string;
  host: string;
  email: string;
  token: string;
  expires: Date;
}

export type EmailTemplateFunction = (params: EmailTemplateParams) => EmailTemplate;

// ============================================================================
// Magic Link Types
// ============================================================================

export interface MagicLinkTemplate {
  subject: string;
  text: string;
  html?: string;
}

export interface MagicLinkTemplateParams {
  url: string;
  host: string;
  email: string;
  token: string;
  expires: Date;
}

export type MagicLinkTemplateFunction = (params: MagicLinkTemplateParams) => MagicLinkTemplate;
