/**
 * OAuth provider implementations
 * Built-in providers for popular OAuth services with PKCE support
 */
import {
  OAuthProvider,
  GitHubProviderOptions,
  GoogleProviderOptions,
  LinkedInProviderOptions,
  MicrosoftProviderOptions,
  DiscordProviderOptions,
  CustomOAuthProviderOptions,
  EmailProviderOptions,
  GitHubProfile,
  GoogleProfile,
  LinkedInProfile,
  MicrosoftProfile,
  DiscordProfile,
  User,
} from '../types';
import { BaseOAuthProvider, BaseEmailProvider } from './base';

// ============================================================================
// GitHub Provider
// ============================================================================

/**
 * GitHub OAuth provider with PKCE support
 */
export class GitHubProvider extends BaseOAuthProvider {
  constructor(options: GitHubProviderOptions) {
    super({
      id: 'github',
      name: 'GitHub',
      authorization: {
        url: 'https://github.com/login/oauth/authorize',
        params: {
          scope: options.scope || 'read:user user:email',
        },
      },
      token: 'https://github.com/login/oauth/access_token',
      userinfo: 'https://api.github.com/user',
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      checks: ['state', 'pkce'],
      enablePKCE: true,
      profile: async (profile: Record<string, unknown>): Promise<User> => {
        const githubProfile = profile as unknown as GitHubProfile;
        return {
          id: githubProfile.id.toString(),
          name: githubProfile.name ?? null,
          email: githubProfile.email ?? null,
          image: githubProfile.avatar_url ?? null,
        };
      },
      options: {
        allowDangerousEmailAccountLinking: options.allowDangerousEmailAccountLinking,
        description: 'Sign in with your GitHub account',
        iconUrl: 'https://github.com/favicon.ico',
        brandColor: '#24292e',
      },
    });
  }

  protected override getDefaultUserProfile(profile: Record<string, unknown>): User {
    const githubProfile = profile as unknown as GitHubProfile;
    return {
      id: githubProfile.id.toString(),
      name: githubProfile.name ?? null,
      email: githubProfile.email ?? null,
      image: githubProfile.avatar_url ?? null,
    };
  }
}

/**
 * GitHub provider factory function (for backward compatibility)
 */
export function GitHub(options: GitHubProviderOptions): OAuthProvider {
  const provider = new GitHubProvider(options);
  return {
    id: provider.id,
    name: provider.name,
    type: provider.type,
    authorization: provider.authorization,
    token: provider.token,
    userinfo: provider.userinfo,
    clientId: provider.clientId,
    clientSecret: provider.clientSecret,
    checks: provider.checks,
    enablePKCE: provider.enablePKCE,
    profile: provider.profile,
    options: provider.options,
  };
}

// ============================================================================
// Email Provider with OTP Support
// ============================================================================

/**
 * Email Provider for OTP/Magic Link Authentication
 */
export class EmailProvider extends BaseEmailProvider {
  private isDevelopment: boolean;

  constructor(options: EmailProviderOptions = {}) {
    const isDev = process.env.NODE_ENV === 'development';

    super({
      id: 'email',
      name: 'Email',
      server: options.server || (isDev ? 'development' : ''),
      from: options.from || 'noreply@example.com',
      maxAge: options.maxAge || 600, // 10 minutes by default
      generateVerificationToken:
        options.generateVerificationToken ||
        (() => {
          // In development, always return '000000'
          if (isDev) {
            return '000000';
          }
          // In production, generate a random 6-digit OTP
          return Math.floor(100000 + Math.random() * 900000).toString();
        }),
      sendVerificationRequest:
        options.sendVerificationRequest ||
        ((async (params: { identifier: string; url: string; expires: Date; token: string }) => {
          const { identifier, token, expires } = params;

          if (isDev) {
            // In development, just log the OTP
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📧 Email Authentication (Development Mode)');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`To: ${identifier}`);
            console.log(`OTP Code: ${token}`);
            console.log(`Expires: ${expires.toLocaleString()}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('💡 Tip: Use code "000000" in development');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          } else {
            // In production, you would send an actual email here
            // This would integrate with your email service (SendGrid, AWS SES, etc.)
            throw new Error(
              'Email sending not configured for production. Please provide sendVerificationRequest function.'
            );
          }
        }) as (params: { identifier: string; url: string; expires: Date; token: string }) => Promise<void>),
    });

    this.isDevelopment = isDev;
  }

  override async validate(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!this.isDevelopment && !this.server) {
      errors.push('Email server configuration is required in production');
    }

    if (!this.from) {
      errors.push('From email address is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Send verification email implementation
   */
  async sendVerificationEmail(params: {
    identifier: string;
    url: string;
    token: string;
    expires: Date;
  }): Promise<void> {
    if (this.sendVerificationRequest) {
      await this.sendVerificationRequest(params);
    } else {
      throw new Error('sendVerificationRequest function not configured');
    }
  }
}

// ============================================================================
// Google Provider
// ============================================================================

/**
 * Google OAuth provider with OpenID Connect support
 */
export function Google(options: GoogleProviderOptions): OAuthProvider {
  const defaultScope = 'openid email profile';
  const scope = options.authorization?.params?.scope || defaultScope;

  return {
    id: 'google',
    name: 'Google',
    type: 'oauth',
    authorization: {
      url: 'https://accounts.google.com/o/oauth2/v2/auth',
      params: {
        scope,
        response_type: 'code',
        access_type: options.authorization?.params?.access_type || 'offline',
        prompt: options.authorization?.params?.prompt || 'consent',
        ...options.authorization?.params,
      },
    },
    token: 'https://oauth2.googleapis.com/token',
    userinfo: 'https://openidconnect.googleapis.com/v1/userinfo',
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    checks: ['state', 'pkce', 'nonce'], // Full security checks
    enablePKCE: true,
    profile: async (profile: Record<string, unknown>): Promise<User> => {
      const googleProfile = profile as unknown as GoogleProfile;
      return {
        id: googleProfile.sub,
        name: googleProfile.name,
        email: googleProfile.email,
        image: googleProfile.picture,
        emailVerified: googleProfile.email_verified ? new Date() : null,
      };
    },
    options: {
      allowDangerousEmailAccountLinking: options.allowDangerousEmailAccountLinking,
    },
  };
}

// ============================================================================
// LinkedIn Provider
// ============================================================================

/**
 * LinkedIn OAuth provider
 */
export function LinkedIn(options: LinkedInProviderOptions): OAuthProvider {
  return {
    id: 'linkedin',
    name: 'LinkedIn',
    type: 'oauth',
    authorization: {
      url: 'https://www.linkedin.com/oauth/v2/authorization',
      params: {
        scope: options.scope || 'r_liteprofile r_emailaddress',
      },
    },
    token: 'https://www.linkedin.com/oauth/v2/accessToken',
    userinfo: 'https://api.linkedin.com/v2/people/~',
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    checks: ['state', 'pkce'],
    enablePKCE: true,
    profile: async (profile: Record<string, unknown>): Promise<User> => {
      const linkedinProfile = profile as unknown as LinkedInProfile;
      const firstName =
        linkedinProfile.firstName?.localized?.en_US ||
        Object.values(linkedinProfile.firstName?.localized || {})[0] ||
        '';
      const lastName =
        linkedinProfile.lastName?.localized?.en_US ||
        Object.values(linkedinProfile.lastName?.localized || {})[0] ||
        '';

      const image =
        linkedinProfile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]
          ?.identifier;

      return {
        id: linkedinProfile.id,
        name: `${firstName} ${lastName}`.trim() || null,
        email: null, // LinkedIn requires separate API call for email
        image: image ?? null,
      };
    },
    options: {
      allowDangerousEmailAccountLinking: options.allowDangerousEmailAccountLinking,
    },
  };
}

// ============================================================================
// Microsoft Provider
// ============================================================================

/**
 * Microsoft OAuth provider (Azure AD)
 */
export function Microsoft(options: MicrosoftProviderOptions): OAuthProvider {
  const tenantId = options.tenantId || 'common';
  const scope = options.scope || 'openid email profile';

  return {
    id: 'microsoft',
    name: 'Microsoft',
    type: 'oauth',
    authorization: {
      url: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
      params: {
        scope,
        response_type: 'code',
        response_mode: 'query',
      },
    },
    token: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    userinfo: 'https://graph.microsoft.com/oidc/userinfo',
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    checks: ['state', 'pkce', 'nonce'],
    enablePKCE: true,
    profile: async (profile: Record<string, unknown>): Promise<User> => {
      const microsoftProfile = profile as unknown as MicrosoftProfile;
      return {
        id: microsoftProfile.sub,
        name: microsoftProfile.name,
        email: microsoftProfile.email,
        image: microsoftProfile.picture,
      };
    },
    options: {
      allowDangerousEmailAccountLinking: options.allowDangerousEmailAccountLinking,
    },
  };
}

// ============================================================================
// Discord Provider
// ============================================================================

/**
 * Discord OAuth provider
 */
export function Discord(options: DiscordProviderOptions): OAuthProvider {
  return {
    id: 'discord',
    name: 'Discord',
    type: 'oauth',
    authorization: {
      url: 'https://discord.com/api/oauth2/authorize',
      params: {
        scope: options.scope || 'identify email',
      },
    },
    token: 'https://discord.com/api/oauth2/token',
    userinfo: 'https://discord.com/api/users/@me',
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    checks: ['state', 'pkce'],
    enablePKCE: true,
    profile: async (profile: Record<string, unknown>): Promise<User> => {
      const discordProfile = profile as unknown as DiscordProfile;
      const avatarUrl = discordProfile.avatar
        ? `https://cdn.discordapp.com/avatars/${discordProfile.id}/${discordProfile.avatar}.png`
        : null;

      return {
        id: discordProfile.id,
        name: discordProfile.username,
        email: discordProfile.email,
        image: avatarUrl,
      };
    },
    options: {
      allowDangerousEmailAccountLinking: options.allowDangerousEmailAccountLinking,
    },
  };
}

// ============================================================================
// Custom OAuth Provider
// ============================================================================

/**
 * Custom OAuth provider for any OAuth 2.0 compliant service
 */
export function OAuth(options: CustomOAuthProviderOptions): OAuthProvider {
  return {
    id: options.id,
    name: options.name,
    type: 'oauth',
    authorization: options.authorization,
    token: options.token,
    userinfo: options.userinfo,
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    checks: options.checks || ['state', 'pkce'],
    enablePKCE: options.enablePKCE ?? true, // Enable PKCE by default
    profile: options.profile,
    options: {
      allowDangerousEmailAccountLinking: options.allowDangerousEmailAccountLinking,
    },
  };
}

// ============================================================================
// Provider Registry
// ============================================================================

/**
 * Registry of all available providers
 */
export const providers = {
  GitHub,
  Google,
  LinkedIn,
  Microsoft,
  Discord,
  OAuth,
};

/**
 * Get provider by ID from a list of configured providers
 */
export function getProviderById(providers: OAuthProvider[], id: string): OAuthProvider | undefined {
  return providers.find(provider => provider.id === id);
}

/**
 * Validate provider configuration
 */
export function validateProviderConfig(provider: OAuthProvider): void {
  if (!provider.id) {
    throw new Error('Provider ID is required');
  }

  if (!provider.clientId) {
    throw new Error(`Provider ${provider.id}: clientId is required`);
  }

  if (!provider.clientSecret) {
    throw new Error(`Provider ${provider.id}: clientSecret is required`);
  }

  if (!provider.authorization) {
    throw new Error(`Provider ${provider.id}: authorization URL is required`);
  }

  if (!provider.token) {
    throw new Error(`Provider ${provider.id}: token URL is required`);
  }
}

/**
 * Get provider display name for UI
 */
export function getProviderDisplayName(provider: OAuthProvider): string {
  return provider.name || provider.id;
}

/**
 * Check if provider supports PKCE
 */
export function providerSupportsPKCE(provider: OAuthProvider): boolean {
  return (
    provider.enablePKCE !== false &&
    (provider.checks?.includes('pkce') || provider.enablePKCE === true)
  );
}

/**
 * Get provider scopes
 */
export function getProviderScopes(provider: OAuthProvider): string[] {
  if (typeof provider.authorization === 'object' && provider.authorization.params?.scope) {
    return provider.authorization.params.scope.split(' ');
  }
  return [];
}

// ============================================================================
// Provider Testing Utilities
// ============================================================================

/**
 * Test provider configuration (for development)
 */
export async function testProviderConfig(
  provider: OAuthProvider,
  _testCallbackUrl: string = 'http://localhost:3000/api/auth/callback/test'
): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    validateProviderConfig(provider);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  // Test authorization URL generation
  try {
    const authUrl =
      typeof provider.authorization === 'string'
        ? provider.authorization
        : provider.authorization.url;

    new URL(authUrl); // Validate URL format
  } catch (error) {
    errors.push(
      `Invalid authorization URL: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Test token URL
  try {
    const tokenUrl = typeof provider.token === 'string' ? provider.token : provider.token.url;

    new URL(tokenUrl); // Validate URL format
  } catch (error) {
    errors.push(`Invalid token URL: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Test userinfo URL if provided
  if (provider.userinfo) {
    try {
      const userinfoUrl =
        typeof provider.userinfo === 'string' ? provider.userinfo : provider.userinfo.url;

      new URL(userinfoUrl); // Validate URL format
    } catch (error) {
      errors.push(
        `Invalid userinfo URL: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Check for PKCE support
  if (!providerSupportsPKCE(provider)) {
    warnings.push('PKCE is not enabled for this provider (recommended for security)');
  }

  // Check for required profile function
  if (!provider.profile) {
    warnings.push('No profile function provided - using default profile mapping');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
// ============================================================================
// Export Base Classes and Utilities
// ============================================================================
export * from './base';

// ============================================================================
// Provider Registry
// ============================================================================

const globalProviders: Map<string, BaseOAuthProvider> = new Map();

export function getProviderInstance(id: string): BaseOAuthProvider | undefined {
  return globalProviders.get(id);
}

export function registerProviderInstance(provider: BaseOAuthProvider): void {
  globalProviders.set(provider.id, provider);
}

export function getAllProviderInstances(): BaseOAuthProvider[] {
  return Array.from(globalProviders.values());
}

export function resetProviderRegistry(): void {
  globalProviders.clear();
}

// ============================================================================
// Provider Aliases for Backward Compatibility
// ============================================================================

/**
 * Provider aliases to support both naming conventions
 * Allows importing as GitHub or GitHubProviderFn, etc.
 * Note: GitHubProvider class already exists, so we use GitHubProviderFn for the function
 */
export { GitHub as GitHubProviderFn };
export { Google as GoogleProviderFn };
export { LinkedIn as LinkedInProviderFn };
export { Microsoft as MicrosoftProviderFn };
export { Discord as DiscordProviderFn };
export { OAuth as OAuthProviderFn };
