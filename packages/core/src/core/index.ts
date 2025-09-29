/**
 * Core NextAirAuth configuration and initialization
 */
import { NextAirAuthConfig, ConfigurationError } from '../types';
import { validateConfig, validateEnvironment } from '../security/validation';

// ============================================================================
// Configuration Management
// ============================================================================

/**
 * Global configuration instance
 */
let globalConfig: NextAirAuthConfig | null = null;

/**
 * Initialize NextAirAuth with configuration
 */
export function NextAirAuth(config: NextAirAuthConfig): NextAirAuthConfig {
  // Validate environment variables
  const envValidation = validateEnvironment();
  if (!envValidation.success) {
    throw new ConfigurationError(
      `Environment validation failed: ${envValidation.errors.join(', ')}`,
      { errors: envValidation.errors }
    );
  }

  // Validate configuration
  const configValidation = validateConfig(config);
  if (!configValidation.success) {
    throw new ConfigurationError(
      `Configuration validation failed: ${configValidation.errors.join(', ')}`,
      { errors: configValidation.errors }
    );
  }

  // Apply default configuration
  const finalConfig = applyDefaults(configValidation.data!);

  // Store global configuration
  globalConfig = finalConfig;

  return finalConfig;
}

/**
 * Get the current configuration
 */
export function getConfig(): NextAirAuthConfig {
  if (!globalConfig) {
    throw new ConfigurationError(
      'NextAirAuth has not been initialized. Call NextAirAuth(config) first.',
      { hint: 'Make sure to call NextAirAuth() in your configuration file' }
    );
  }

  return globalConfig;
}

/**
 * Check if NextAirAuth is initialized
 */
export function isInitialized(): boolean {
  return globalConfig !== null;
}

/**
 * Reset configuration (mainly for testing)
 */
export function resetConfig(): void {
  globalConfig = null;
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Apply default values to configuration
 */
function applyDefaults(config: NextAirAuthConfig): NextAirAuthConfig {
  const secret =
    config.jwt?.secret || process.env.NEXT_AIRAUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new ConfigurationError(
      'JWT secret is required. Set NEXT_AIRAUTH_SECRET or NEXTAUTH_SECRET environment variable or provide jwt.secret in config.'
    );
  }

  return {
    ...config,
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      updateAge: 24 * 60 * 60, // 24 hours
      ...config.session,
    },
    jwt: {
      secret,
      maxAge: 30 * 24 * 60 * 60, // 30 days
      ...config.jwt,
    },
    pages: {
      signIn: '/auth/signin',
      signOut: '/auth/signout',
      error: '/auth/error',
      verifyRequest: '/auth/verify-request',
      newUser: '/auth/new-user',
      ...config.pages,
    },
    cookies: {
      sessionToken: {
        name: 'next-airauth.session-token',
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
        },
      },
      callbackUrl: {
        name: 'next-airauth.callback-url',
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
        },
      },
      csrfToken: {
        name: 'next-airauth.csrf-token',
        options: {
          httpOnly: false,
          sameSite: 'lax',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
        },
      },
      pkceCodeVerifier: {
        name: 'next-airauth.pkce.code_verifier',
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 10 * 60, // 10 minutes
        },
      },
      state: {
        name: 'next-airauth.state',
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 10 * 60, // 10 minutes
        },
      },
      nonce: {
        name: 'next-airauth.nonce',
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 10 * 60, // 10 minutes
        },
      },
      ...config.cookies,
    },
    debug: config.debug ?? process.env.NODE_ENV === 'development',
    logger:
      config.logger ?? createDefaultLogger(config.debug ?? process.env.NODE_ENV === 'development'),
  };
}

/**
 * Create default logger
 */
function createDefaultLogger(debug: boolean) {
  return {
    error: (code: string, metadata?: Record<string, unknown>) => {
      // Use structured logging in production environments
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error(`[NextAirAuth] ERROR ${code}:`, metadata);
      }
    },
    warn: (code: string) => {
      // Use structured logging in production environments
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(`[NextAirAuth] WARN ${code}`);
      }
    },
    debug: (code: string, metadata?: Record<string, unknown>) => {
      if (debug && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log(`[NextAirAuth] DEBUG ${code}:`, metadata);
      }
    },
  };
}

// ============================================================================
// Configuration Helpers
// ============================================================================

/**
 * Get provider by ID
 */
export function getProvider(id: string) {
  const config = getConfig();
  const provider = config.providers.find(p => p.id === id);

  if (!provider) {
    throw new ConfigurationError(`Provider with ID "${id}" not found`, {
      availableProviders: config.providers.map(p => p.id),
    });
  }

  return provider;
}

/**
 * Get all providers of a specific type
 */
export function getProvidersByType(type: string) {
  const config = getConfig();
  return config.providers.filter(p => p.type === type);
}

/**
 * Check if a provider exists
 */
export function hasProvider(id: string): boolean {
  const config = getConfig();
  return config.providers.some(p => p.id === id);
}

/**
 * Get session strategy
 */
export function getSessionStrategy(): 'jwt' | 'database' {
  const config = getConfig();
  return config.session?.strategy ?? 'jwt';
}

/**
 * Get JWT secret
 */
export function getJWTSecret(): string {
  const config = getConfig();
  const secret = config.jwt?.secret;

  if (!secret) {
    throw new ConfigurationError('JWT secret not configured');
  }

  return secret;
}

/**
 * Get base URL from configuration or environment
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_AIRAUTH_URL) {
    return process.env.NEXT_AIRAUTH_URL;
  }

  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Fallback for development
  return 'http://localhost:3000';
}

/**
 * Get callback URL for a provider
 */
export function getCallbackUrl(providerId: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/auth/callback/${providerId}`;
}

// ============================================================================
// Configuration Validation Helpers
// ============================================================================

/**
 * Validate configuration at runtime
 */
export function validateRuntimeConfig(): {
  success: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const config = getConfig();

    // Check for common misconfigurations
    if (config.session?.strategy === 'database' && !config.adapter) {
      errors.push('Database session strategy requires an adapter');
    }

    if (config.session?.strategy === 'jwt' && !config.jwt?.secret) {
      errors.push('JWT session strategy requires a secret');
    }

    // Check provider configurations
    for (const provider of config.providers) {
      if (provider.type === 'oauth') {
        const oauthProvider = provider as { clientId?: string; clientSecret?: string };
        if (!oauthProvider.clientId || !oauthProvider.clientSecret) {
          errors.push(`OAuth provider "${provider.id}" missing clientId or clientSecret`);
        }
      }
    }

    // Check environment-specific settings
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.NEXTAUTH_URL) {
        warnings.push('NEXTAUTH_URL should be set in production');
      }

      if (config.debug) {
        warnings.push('Debug mode is enabled in production');
      }
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : String(error)],
      warnings,
    };
  }
}

/**
 * Print configuration summary
 */
export function printConfigSummary(): void {
  try {
    const config = getConfig();
    const validation = validateRuntimeConfig();

    // Only print in development environments
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('\n🔐 NextAirAuth Configuration Summary');
      // eslint-disable-next-line no-console
      console.log('=====================================');
      // eslint-disable-next-line no-console
      console.log(`Session Strategy: ${config.session?.strategy ?? 'jwt'}`);
      // eslint-disable-next-line no-console
      console.log(`Providers: ${config.providers.map(p => p.id).join(', ')}`);
      // eslint-disable-next-line no-console
      console.log(`Debug Mode: ${config.debug ? 'enabled' : 'disabled'}`);
      // eslint-disable-next-line no-console
      console.log(`Base URL: ${getBaseUrl()}`);

      if (validation.warnings.length > 0) {
        // eslint-disable-next-line no-console
        console.log('\n⚠️  Warnings:');
        // eslint-disable-next-line no-console
        validation.warnings.forEach(warning => console.log(`  - ${warning}`));
      }

      if (validation.errors.length > 0) {
        // eslint-disable-next-line no-console
        console.log('\n❌ Errors:');
        // eslint-disable-next-line no-console
        validation.errors.forEach(error => console.log(`  - ${error}`));
      } else {
        // eslint-disable-next-line no-console
        console.log('\n✅ Configuration is valid');
      }

      // eslint-disable-next-line no-console
      console.log('=====================================\n');
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error(
        'Failed to print configuration summary:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}
