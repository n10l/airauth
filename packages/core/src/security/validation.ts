/**
 * Input validation and sanitization utilities
 */
import { z } from 'zod';
import { NextAirAuthConfig, Provider } from '../types';

// ============================================================================
// Configuration Validation Schemas
// ============================================================================

const UserSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  image: z.string().url().nullable().optional(),
  role: z.string().optional(),
  emailVerified: z.date().nullable().optional(),
});

const SessionSchema = z.object({
  strategy: z.enum(['jwt', 'database']).optional(),
  maxAge: z.number().positive().optional(),
  updateAge: z.number().positive().optional(),
  generateSessionToken: z.function().optional(),
});

const JWTSchema = z.object({
  secret: z.string().min(32).optional(),
  maxAge: z.number().positive().optional(),
  encode: z.function().optional(),
  decode: z.function().optional(),
});

const PagesSchema = z.object({
  signIn: z.string().optional(),
  signOut: z.string().optional(),
  error: z.string().optional(),
  verifyRequest: z.string().optional(),
  newUser: z.string().optional(),
});

const CallbacksSchema = z.object({
  signIn: z.function().optional(),
  redirect: z.function().optional(),
  session: z.function().optional(),
  jwt: z.function().optional(),
});

const EventsSchema = z.object({
  signIn: z.function().optional(),
  signOut: z.function().optional(),
  createUser: z.function().optional(),
  updateUser: z.function().optional(),
  linkAccount: z.function().optional(),
  session: z.function().optional(),
});

const LoggerSchema = z.object({
  error: z.function(),
  warn: z.function(),
  debug: z.function(),
});

const CookieOptionSchema = z.object({
  httpOnly: z.boolean().optional(),
  sameSite: z.enum(['lax', 'strict', 'none']).optional(),
  path: z.string().optional(),
  secure: z.boolean().optional(),
  domain: z.string().optional(),
  maxAge: z.number().positive().optional(),
});

const CookiesSchema = z.object({
  sessionToken: z
    .object({
      name: z.string(),
      options: CookieOptionSchema,
    })
    .optional(),
  callbackUrl: z
    .object({
      name: z.string(),
      options: CookieOptionSchema,
    })
    .optional(),
  csrfToken: z
    .object({
      name: z.string(),
      options: CookieOptionSchema,
    })
    .optional(),
  pkceCodeVerifier: z
    .object({
      name: z.string(),
      options: CookieOptionSchema,
    })
    .optional(),
  state: z
    .object({
      name: z.string(),
      options: CookieOptionSchema,
    })
    .optional(),
  nonce: z
    .object({
      name: z.string(),
      options: CookieOptionSchema,
    })
    .optional(),
});

// ============================================================================
// Provider Validation Schemas
// ============================================================================

const BaseProviderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['oauth', 'email', 'credentials', 'magic-link']),
  options: z.record(z.unknown()).optional(),
});

const OAuthProviderSchema = BaseProviderSchema.extend({
  type: z.literal('oauth'),
  authorization: z.union([
    z.string().url(),
    z.object({
      url: z.string().url(),
      params: z.record(z.string()).optional(),
    }),
  ]),
  token: z.union([
    z.string().url(),
    z.object({
      url: z.string().url(),
      params: z.record(z.string()).optional(),
    }),
  ]),
  userinfo: z
    .union([
      z.string().url(),
      z.object({
        url: z.string().url(),
        params: z.record(z.string()).optional(),
      }),
      z.undefined(),
    ])
    .optional(),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  issuer: z.string().url().optional(),
  wellKnown: z.string().url().optional(),
  profile: z.function().optional(),
  checks: z.array(z.enum(['pkce', 'state', 'nonce'])).optional(),
  client: z.record(z.unknown()).optional(),
});

const EmailProviderSchema = BaseProviderSchema.extend({
  type: z.literal('email'),
  server: z.union([
    z.string(),
    z.object({
      host: z.string(),
      port: z.number().positive(),
      auth: z.object({
        user: z.string(),
        pass: z.string(),
      }),
      secure: z.boolean().optional(),
    }),
  ]),
  from: z.string().email(),
  sendVerificationRequest: z.function().optional(),
  generateVerificationToken: z.function().optional(),
  maxAge: z.number().positive().optional(),
});

const CredentialsProviderSchema = BaseProviderSchema.extend({
  type: z.literal('credentials'),
  credentials: z.record(
    z.object({
      label: z.string().optional(),
      type: z.string().optional(),
      value: z.string().optional(),
      placeholder: z.string().optional(),
    })
  ),
  authorize: z.function(),
});

const MagicLinkProviderSchema = BaseProviderSchema.extend({
  type: z.literal('magic-link'),
  sendMagicLink: z.function(),
  generateToken: z.function().optional(),
  maxAge: z.number().positive().optional(),
});

const ProviderSchema = z.union([
  OAuthProviderSchema,
  EmailProviderSchema,
  CredentialsProviderSchema,
  MagicLinkProviderSchema,
]);

// ============================================================================
// Main Configuration Schema
// ============================================================================

const NextAirAuthConfigSchema = z.object({
  providers: z.array(ProviderSchema).min(1),
  adapter: z.unknown().optional(), // Adapter interface is too complex for Zod
  session: SessionSchema.optional(),
  jwt: JWTSchema.optional(),
  pages: PagesSchema.optional(),
  callbacks: CallbacksSchema.optional(),
  events: EventsSchema.optional(),
  debug: z.boolean().optional(),
  logger: LoggerSchema.optional(),
  cookies: CookiesSchema.optional(),
});

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate NextAirAuth configuration
 */
export function validateConfig(config: NextAirAuthConfig): {
  success: boolean;
  errors: string[];
  data?: NextAirAuthConfig;
} {
  try {
    const result = NextAirAuthConfigSchema.parse(config);

    // Additional validation logic
    const errors: string[] = [];

    // Validate provider IDs are unique
    const providerIds = new Set<string>();
    for (const provider of result.providers) {
      if (providerIds.has(provider.id)) {
        errors.push(`Duplicate provider ID: ${provider.id}`);
      }
      providerIds.add(provider.id);
    }

    // Validate JWT secret if using JWT strategy
    if (result.session?.strategy === 'jwt' || !result.session?.strategy) {
      const secret = process.env.NEXT_AIRAUTH_SECRET || process.env.NEXTAUTH_SECRET;
      if (!result.jwt?.secret && !secret) {
        errors.push('JWT secret is required when using JWT session strategy');
      }
    }

    // Validate database adapter if using database strategy
    if (result.session?.strategy === 'database' && !result.adapter) {
      errors.push('Database adapter is required when using database session strategy');
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, errors: [], data: result as NextAirAuthConfig };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }

    return {
      success: false,
      errors: [
        `Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

/**
 * Validate provider configuration
 */
export function validateProvider(provider: Provider): {
  success: boolean;
  errors: string[];
  data?: Provider;
} {
  try {
    const result = ProviderSchema.parse(provider);
    return { success: true, errors: [], data: result as Provider };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }

    return {
      success: false,
      errors: [
        `Provider validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

/**
 * Validate user object
 */
export function validateUser(user: unknown): {
  success: boolean;
  errors: string[];
  data?: Record<string, unknown>;
} {
  try {
    const result = UserSchema.parse(user);
    return { success: true, errors: [], data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }

    return {
      success: false,
      errors: [
        `User validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

// ============================================================================
// Input Sanitization
// ============================================================================

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Sanitize URL input
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    throw new Error('Invalid URL format');
  }
}

/**
 * Sanitize provider ID
 */
export function sanitizeProviderId(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9-_]/g, '');
}

/**
 * Validate and sanitize callback URL
 */
export function validateCallbackUrl(url: string, allowedOrigins: string[]): string {
  try {
    const parsed = new URL(url);
    const isAllowed = allowedOrigins.some(origin => {
      const allowedUrl = new URL(origin);
      return parsed.origin === allowedUrl.origin;
    });

    if (!isAllowed) {
      throw new Error('Callback URL not in allowed origins');
    }

    return parsed.toString();
  } catch (error) {
    throw new Error(
      `Invalid callback URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ============================================================================
// Environment Variable Validation
// ============================================================================

/**
 * Validate required environment variables
 */
export function validateEnvironment(): {
  success: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for required environment variables
  if (!process.env.NEXT_AIRAUTH_URL && !process.env.NEXTAUTH_URL && !process.env.VERCEL_URL) {
    errors.push('NEXT_AIRAUTH_URL, NEXTAUTH_URL, or VERCEL_URL environment variable is required');
  }

  const secret = process.env.NEXT_AIRAUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    errors.push('NEXT_AIRAUTH_SECRET or NEXTAUTH_SECRET environment variable is required');
  }

  // Validate secret length
  if (secret && secret.length < 32) {
    errors.push('Authentication secret must be at least 32 characters long');
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Get validated base URL from environment
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

// ============================================================================
// Security Validation
// ============================================================================

/**
 * Basic password strength validation (simple version)
 */
export function validateBasicPasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password must be at least 8 characters long');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one uppercase letter');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one lowercase letter');
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one number');
  }

  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one special character');
  }

  return {
    isValid: score >= 4,
    score,
    feedback,
  };
}

/**
 * Validate OAuth state parameter
 */
export function validateOAuthState(state: string): boolean {
  // State should be a random string of sufficient length
  return typeof state === 'string' && state.length >= 16 && /^[a-zA-Z0-9_-]+$/.test(state);
}

/**
 * Validate PKCE code verifier
 */
export function validatePKCECodeVerifier(codeVerifier: string): boolean {
  // Code verifier should be 43-128 characters, URL-safe
  return (
    typeof codeVerifier === 'string' &&
    codeVerifier.length >= 43 &&
    codeVerifier.length <= 128 &&
    /^[a-zA-Z0-9._~-]+$/.test(codeVerifier)
  );
}

/**
 * Validate JWT token format
 */
export function validateJWTFormat(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}
