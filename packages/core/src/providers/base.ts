/**
 * Base provider interface and abstract implementations
 * Provides foundation for all authentication providers
 */
import {
  Provider,
  OAuthProvider,
  EmailProvider,
  CredentialsProvider,
  User,
  TokenSet,
  AuthenticationError,
  NextAirAuthError,
} from '../types';

// ============================================================================
// Base Provider Abstract Class
// ============================================================================

export abstract class BaseProvider implements Provider {
  public readonly id: string;
  public readonly name: string;
  public readonly type: Provider['type'];
  public readonly options?: Record<string, unknown>;

  constructor(config: {
    id: string;
    name: string;
    type: Provider['type'];
    options?: Record<string, unknown>;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.options = config.options || {};
  }

  /**
   * Validate provider configuration
   */
  abstract validate(): Promise<{ isValid: boolean; errors: string[] }>;

  /**
   * Get provider display information
   */
  getDisplayInfo(): {
    id: string;
    name: string;
    type: string;
    description?: string;
    iconUrl?: string;
    brandColor?: string;
  } {
    const config: {
      id: string;
      name: string;
      type: string;
      description?: string;
      iconUrl?: string;
      brandColor?: string;
    } = {
      id: this.id,
      name: this.name,
      type: this.type,
    };

    const description = this.options?.description;
    if (typeof description === 'string') {
      config.description = description;
    }

    const iconUrl = this.options?.iconUrl;
    if (typeof iconUrl === 'string') {
      config.iconUrl = iconUrl;
    }

    const brandColor = this.options?.brandColor;
    if (typeof brandColor === 'string') {
      config.brandColor = brandColor;
    }

    return config;
  }

  /**
   * Check if provider supports a specific feature
   */
  supportsFeature(feature: string): boolean {
    const supportedFeatures = this.getSupportedFeatures();
    return supportedFeatures.includes(feature);
  }

  /**
   * Get list of supported features
   */
  protected getSupportedFeatures(): string[] {
    return ['authentication'];
  }

  /**
   * Get provider-specific configuration schema
   */
  abstract getConfigSchema(): Record<string, unknown>;

  /**
   * Test provider connectivity (for development/debugging)
   */
  abstract testConnection(): Promise<{
    success: boolean;
    message: string;
    details?: Record<string, unknown>;
  }>;
}

// ============================================================================
// OAuth Provider Base Class
// ============================================================================

export abstract class BaseOAuthProvider extends BaseProvider implements OAuthProvider {
  public override readonly type = 'oauth' as const;
  public readonly authorization: string | { url: string; params?: Record<string, string> };
  public readonly token: string | { url: string; params?: Record<string, string> };
  public readonly userinfo?: string | { url: string; params?: Record<string, string> } | undefined;
  public readonly clientId: string;
  public readonly clientSecret: string;
  public readonly issuer?: string | undefined;
  public readonly wellKnown?: string | undefined;
  public readonly profile?:
    | ((profile: Record<string, unknown>, tokens: TokenSet) => Promise<User>)
    | undefined;
  public readonly checks?: ('pkce' | 'state' | 'nonce')[] | undefined;
  public readonly client?: Partial<Record<string, unknown>> | undefined;
  public readonly enablePKCE?: boolean | undefined;

  constructor(config: {
    id: string;
    name: string;
    authorization: string | { url: string; params?: Record<string, string> };
    token: string | { url: string; params?: Record<string, string> };
    userinfo?: string | { url: string; params?: Record<string, string> };
    clientId: string;
    clientSecret: string;
    issuer?: string;
    wellKnown?: string;
    profile?: (profile: Record<string, unknown>, tokens: TokenSet) => Promise<User>;
    checks?: ('pkce' | 'state' | 'nonce')[];
    client?: Partial<Record<string, unknown>>;
    enablePKCE?: boolean;
    options?: Record<string, unknown>;
  }) {
    super({
      id: config.id,
      name: config.name,
      type: 'oauth',
      options: config.options || {},
    });

    this.authorization = config.authorization;
    this.token = config.token;
    this.userinfo = config.userinfo ?? undefined;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.issuer = config.issuer ?? undefined;
    this.wellKnown = config.wellKnown ?? undefined;
    this.profile = config.profile ?? undefined;
    this.checks = config.checks || ['state', 'pkce'];
    this.client = config.client ?? undefined;
    this.enablePKCE = config.enablePKCE ?? true;
  }

  /**
   * Validate OAuth provider configuration
   */
  async validate(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Required fields validation
    if (!this.clientId) {
      errors.push('clientId is required');
    }

    if (!this.clientSecret) {
      errors.push('clientSecret is required');
    }

    if (!this.authorization) {
      errors.push('authorization URL is required');
    }

    if (!this.token) {
      errors.push('token URL is required');
    }

    // URL validation
    try {
      const authUrl =
        typeof this.authorization === 'string' ? this.authorization : this.authorization.url;
      new URL(authUrl);
    } catch (error) {
      errors.push('Invalid authorization URL');
    }

    try {
      const tokenUrl = typeof this.token === 'string' ? this.token : this.token.url;
      new URL(tokenUrl);
    } catch (error) {
      errors.push('Invalid token URL');
    }

    if (this.userinfo) {
      try {
        const userinfoUrl = typeof this.userinfo === 'string' ? this.userinfo : this.userinfo.url;
        new URL(userinfoUrl);
      } catch (error) {
        errors.push('Invalid userinfo URL');
      }
    }

    // Well-known endpoint validation
    if (this.wellKnown) {
      try {
        new URL(this.wellKnown);
      } catch (error) {
        errors.push('Invalid well-known URL');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get OAuth-specific supported features
   */
  protected override getSupportedFeatures(): string[] {
    const features = ['authentication', 'oauth2'];

    if (this.enablePKCE) {
      features.push('pkce');
    }

    if (this.checks?.includes('nonce')) {
      features.push('openid_connect');
    }

    if (this.userinfo) {
      features.push('user_profile');
    }

    return features;
  }

  /**
   * Get OAuth configuration schema
   */
  getConfigSchema(): Record<string, unknown> {
    return {
      type: 'object',
      required: ['clientId', 'clientSecret'],
      properties: {
        clientId: {
          type: 'string',
          description: 'OAuth client ID',
        },
        clientSecret: {
          type: 'string',
          description: 'OAuth client secret',
        },
        scope: {
          type: 'string',
          description: 'OAuth scopes (space-separated)',
        },
        enablePKCE: {
          type: 'boolean',
          description: 'Enable PKCE for enhanced security',
          default: true,
        },
      },
    };
  }

  /**
   * Test OAuth provider connectivity
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    details?: Record<string, unknown>;
  }> {
    try {
      // Test authorization endpoint
      const authUrl =
        typeof this.authorization === 'string' ? this.authorization : this.authorization.url;

      const authResponse = await fetch(authUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!authResponse.ok && authResponse.status !== 405) {
        return {
          success: false,
          message: `Authorization endpoint unreachable: ${authResponse.status}`,
          details: { endpoint: authUrl, status: authResponse.status },
        };
      }

      // Test token endpoint
      const tokenUrl = typeof this.token === 'string' ? this.token : this.token.url;

      const tokenResponse = await fetch(tokenUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });

      if (!tokenResponse.ok && tokenResponse.status !== 405) {
        return {
          success: false,
          message: `Token endpoint unreachable: ${tokenResponse.status}`,
          details: { endpoint: tokenUrl, status: tokenResponse.status },
        };
      }

      return {
        success: true,
        message: 'OAuth endpoints are reachable',
        details: {
          authEndpoint: authUrl,
          tokenEndpoint: tokenUrl,
          features: this.getSupportedFeatures(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  /**
   * Get authorization URL with parameters
   */
  getAuthorizationUrl(params: {
    redirectUri: string;
    state: string;
    scopes?: string[];
    codeChallenge?: string;
    codeChallengeMethod?: string;
    nonce?: string;
    additionalParams?: Record<string, string>;
  }): string {
    const authUrl =
      typeof this.authorization === 'string' ? this.authorization : this.authorization.url;

    const urlParams = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: params.redirectUri,
      response_type: 'code',
      state: params.state,
      ...params.additionalParams,
    });

    // Add scopes
    if (params.scopes?.length) {
      urlParams.set('scope', params.scopes.join(' '));
    } else if (typeof this.authorization === 'object' && this.authorization.params?.scope) {
      urlParams.set('scope', this.authorization.params.scope);
    }

    // Add PKCE parameters
    if (params.codeChallenge && params.codeChallengeMethod) {
      urlParams.set('code_challenge', params.codeChallenge);
      urlParams.set('code_challenge_method', params.codeChallengeMethod);
    }

    // Add nonce for OpenID Connect
    if (params.nonce) {
      urlParams.set('nonce', params.nonce);
    }

    // Add provider-specific parameters
    if (typeof this.authorization === 'object' && this.authorization.params) {
      Object.entries(this.authorization.params).forEach(([key, value]) => {
        if (!urlParams.has(key)) {
          urlParams.set(key, value);
        }
      });
    }

    return `${authUrl}?${urlParams.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(params: {
    code: string;
    redirectUri: string;
    codeVerifier?: string;
  }): Promise<TokenSet> {
    const tokenUrl = typeof this.token === 'string' ? this.token : this.token.url;

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: params.code,
      redirect_uri: params.redirectUri,
    });

    // Add PKCE code verifier
    if (params.codeVerifier) {
      tokenParams.set('code_verifier', params.codeVerifier);
    }

    // Add provider-specific token parameters
    if (typeof this.token === 'object' && this.token.params) {
      Object.entries(this.token.params).forEach(([key, value]) => {
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
        throw new AuthenticationError(
          `Token exchange failed: ${response.status} ${response.statusText}`,
          { status: response.status, error: errorText }
        );
      }

      const tokens = (await response.json()) as TokenSet;

      if (!tokens.access_token) {
        throw new AuthenticationError('No access token received from provider');
      }

      // Calculate expires_at if expires_in is provided
      if (tokens.expires_in && !tokens.expires_at) {
        tokens.expires_at = Math.floor(Date.now() / 1000) + tokens.expires_in;
      }

      return tokens;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }

      throw new AuthenticationError(
        `Token exchange request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          originalError: error,
        }
      );
    }
  }

  /**
   * Fetch user profile from provider
   */
  async fetchUserProfile(accessToken: string): Promise<Record<string, unknown>> {
    if (!this.userinfo) {
      throw new AuthenticationError('Provider does not support user profile fetching');
    }

    const userinfoUrl = typeof this.userinfo === 'string' ? this.userinfo : this.userinfo.url;

    try {
      const response = await fetch(userinfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'User-Agent': 'airauth/0.1.0',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new AuthenticationError(
          `User profile request failed: ${response.status} ${response.statusText}`,
          { status: response.status, error: errorText }
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }

      throw new AuthenticationError(
        `User profile request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          originalError: error,
        }
      );
    }
  }

  /**
   * Process user profile using provider's profile function
   */
  async processUserProfile(profile: Record<string, unknown>, tokens: TokenSet): Promise<User> {
    if (this.profile) {
      try {
        return await this.profile(profile, tokens);
      } catch (error) {
        throw new AuthenticationError(
          `Profile processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          {
            profile,
            originalError: error,
          }
        );
      }
    }

    // Default profile processing
    return this.getDefaultUserProfile(profile);
  }

  /**
   * Default user profile extraction (override in subclasses)
   */
  protected getDefaultUserProfile(profile: Record<string, unknown>): User {
    return {
      id: (profile.id || profile.sub || profile.user_id) as string,
      name: (profile.name || profile.display_name || profile.username) as string,
      email: profile.email as string,
      image: (profile.avatar_url || profile.picture || profile.image_url) as string,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenSet> {
    const tokenUrl = typeof this.token === 'string' ? this.token : this.token.url;

    const tokenParams = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
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
        throw new AuthenticationError(
          `Token refresh failed: ${response.status} ${response.statusText}`,
          { status: response.status, error: errorText }
        );
      }

      const tokens = (await response.json()) as TokenSet;

      if (!tokens.access_token) {
        throw new AuthenticationError('No access token received from refresh');
      }

      // Calculate expires_at if expires_in is provided
      if (tokens.expires_in && !tokens.expires_at) {
        tokens.expires_at = Math.floor(Date.now() / 1000) + tokens.expires_in;
      }

      // If no new refresh token provided, keep the old one
      if (!tokens.refresh_token) {
        tokens.refresh_token = refreshToken;
      }

      return tokens;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }

      throw new AuthenticationError(
        `Token refresh request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          originalError: error,
        }
      );
    }
  }
}

// ============================================================================
// Email Provider Base Class
// ============================================================================

export abstract class BaseEmailProvider extends BaseProvider implements EmailProvider {
  public override readonly type = 'email' as const;
  public readonly server:
    | string
    | { host: string; port: number; auth: { user: string; pass: string }; secure?: boolean };
  public readonly from: string;
  public readonly sendVerificationRequest?:
    | ((params: { identifier: string; url: string; expires: Date; token: string }) => Promise<void>)
    | undefined;
  public readonly generateVerificationToken?: (() => string) | undefined;
  public readonly maxAge?: number | undefined;

  constructor(config: {
    id: string;
    name: string;
    server:
      | string
      | { host: string; port: number; auth: { user: string; pass: string }; secure?: boolean };
    from: string;
    sendVerificationRequest?: (params: {
      identifier: string;
      url: string;
      expires: Date;
      token: string;
    }) => Promise<void>;
    generateVerificationToken?: () => string;
    maxAge?: number;
    options?: Record<string, unknown>;
  }) {
    super({
      id: config.id,
      name: config.name,
      type: 'email',
      options: config.options ?? {},
    });

    this.server = config.server;
    this.from = config.from;
    this.sendVerificationRequest = config.sendVerificationRequest ?? undefined;
    this.generateVerificationToken = config.generateVerificationToken ?? undefined;
    this.maxAge = config.maxAge ?? undefined;
  }

  /**
   * Validate email provider configuration
   */
  async validate(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!this.server) {
      errors.push('SMTP server configuration is required');
    }

    if (!this.from) {
      errors.push('From email address is required');
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.from)) {
        errors.push('Invalid from email address format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get email provider configuration schema
   */
  getConfigSchema(): Record<string, unknown> {
    return {
      type: 'object',
      required: ['server', 'from'],
      properties: {
        server: {
          type: 'string',
          description: 'SMTP server connection string',
        },
        from: {
          type: 'string',
          format: 'email',
          description: 'From email address',
        },
        maxAge: {
          type: 'number',
          description: 'Verification token expiry in seconds',
          default: 24 * 60 * 60,
        },
      },
    };
  }

  /**
   * Test email provider connectivity
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    details?: Record<string, unknown>;
  }> {
    try {
      // This would need to be implemented based on the specific email service
      // For now, just validate configuration
      const validation = await this.validate();

      if (!validation.isValid) {
        return {
          success: false,
          message: `Configuration invalid: ${validation.errors.join(', ')}`,
          details: { errors: validation.errors },
        };
      }

      return {
        success: true,
        message: 'Email provider configuration is valid',
        details: { from: this.from },
      };
    } catch (error) {
      return {
        success: false,
        message: `Email provider test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  /**
   * Send verification email (abstract method)
   */
  abstract sendVerificationEmail(params: {
    identifier: string;
    url: string;
    expires: Date;
    token: string;
  }): Promise<void>;
}

// ============================================================================
// Credentials Provider Base Class
// ============================================================================

export abstract class BaseCredentialsProvider extends BaseProvider implements CredentialsProvider {
  public override readonly type = 'credentials' as const;
  public readonly credentials: Record<
    string,
    { label?: string; type?: string; placeholder?: string }
  >;
  public readonly authorize: (
    credentials: Record<string, string> | undefined
  ) => Promise<User | null>;

  constructor(config: {
    id: string;
    name: string;
    credentials: Record<string, { label?: string; type?: string; placeholder?: string }>;
    authorize: (credentials: Record<string, string> | undefined) => Promise<User | null>;
    options?: Record<string, unknown>;
  }) {
    super({
      id: config.id,
      name: config.name,
      type: 'credentials',
      options: config.options ?? {},
    });

    this.credentials = config.credentials;
    this.authorize = config.authorize;
  }

  /**
   * Validate credentials provider configuration
   */
  async validate(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!this.credentials || Object.keys(this.credentials).length === 0) {
      errors.push('Credentials configuration is required');
    }

    if (!this.authorize || typeof this.authorize !== 'function') {
      errors.push('Authorize function is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get credentials provider configuration schema
   */
  getConfigSchema(): Record<string, unknown> {
    return {
      type: 'object',
      required: ['credentials', 'authorize'],
      properties: {
        credentials: {
          type: 'object',
          description: 'Credential field definitions',
        },
        authorize: {
          type: 'function',
          description: 'Function to authorize user credentials',
        },
      },
    };
  }

  /**
   * Test credentials provider
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    details?: Record<string, unknown>;
  }> {
    const validation = await this.validate();

    if (!validation.isValid) {
      return {
        success: false,
        message: `Configuration invalid: ${validation.errors.join(', ')}`,
        details: { errors: validation.errors },
      };
    }

    return {
      success: true,
      message: 'Credentials provider configuration is valid',
      details: {
        credentialFields: Object.keys(this.credentials),
        hasAuthorizeFunction: typeof this.authorize === 'function',
      },
    };
  }
}

// ============================================================================
// Provider Factory
// ============================================================================

export class ProviderFactory {
  private static providers = new Map<string, typeof BaseProvider>();

  /**
   * Register a provider class
   */
  static register(type: string, providerClass: typeof BaseProvider): void {
    this.providers.set(type, providerClass);
  }

  /**
   * Create provider instance
   */
  static create(config: { type: string; [key: string]: unknown }): BaseProvider {
    const ProviderClass = this.providers.get(config.type);

    if (!ProviderClass) {
      throw new NextAirAuthError(`Unknown provider type: ${config.type}`, 'CONFIGURATION_ERROR');
    }

    // Cast to concrete class constructor to avoid abstract class instantiation error
    const ConcreteProviderClass = ProviderClass as new (config: {
      [key: string]: unknown;
    }) => BaseProvider;
    return new ConcreteProviderClass(config);
  }

  /**
   * Get available provider types
   */
  static getAvailableTypes(): string[] {
    return Array.from(this.providers.keys());
  }
}

// ============================================================================
// Provider Validation Utilities
// ============================================================================

/**
 * Validate multiple providers
 */
export async function validateProviders(providers: BaseProvider[]): Promise<{
  isValid: boolean;
  results: Array<{
    provider: string;
    isValid: boolean;
    errors: string[];
  }>;
}> {
  const results = await Promise.all(
    providers.map(async provider => {
      const validation = await provider.validate();
      return {
        provider: provider.id,
        isValid: validation.isValid,
        errors: validation.errors,
      };
    })
  );

  const isValid = results.every(result => result.isValid);

  return { isValid, results };
}

/**
 * Test multiple provider connections
 */
export async function testProviderConnections(providers: BaseProvider[]): Promise<{
  results: Array<{
    provider: string;
    success: boolean;
    message: string;
    details?: Record<string, unknown>;
  }>;
}> {
  const results = await Promise.all(
    providers.map(async provider => {
      const test = await provider.testConnection();
      const result: {
        provider: string;
        success: boolean;
        message: string;
        details?: Record<string, unknown>;
      } = {
        provider: provider.id,
        success: test.success,
        message: test.message,
      };

      if (test.details !== undefined) {
        result.details = test.details;
      }

      return result;
    })
  );

  return { results };
}
