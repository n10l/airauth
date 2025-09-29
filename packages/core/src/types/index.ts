/**
 * Core type definitions for AirAuth
 * Provides complete TypeScript support with NextAuth.js compatibility
 */
import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest } from 'next';

// ============================================================================
// User and Session Types
// ============================================================================

/**
 * User object returned by providers and stored in sessions
 */
export interface User {
  id: string;
  name?: string | null | undefined;
  email?: string | null | undefined;
  image?: string | null | undefined;
  role?: string | undefined;
  emailVerified?: Date | null | undefined;
  /** Additional properties can be added by providers */
  [key: string]: unknown;
}

/**
 * Session object containing user information and metadata
 */
export interface Session {
  user: User;
  expires: string;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
  sessionToken?: string; // For database strategy
}

/**
 * Account linking information for OAuth providers
 */
export interface Account {
  id?: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string | null;
  access_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
}

/**
 * Verification token for email verification and magic links
 */
export interface VerificationToken {
  identifier: string;
  token: string;
  expires: Date;
}

// ============================================================================
// JWT Types
// ============================================================================

/**
 * JWT token payload
 */
export interface JWT {
  name?: string | null;
  email?: string | null;
  picture?: string | null;
  sub?: string;
  iat?: number;
  exp?: number;
  jti?: string;
  role?: string;
  /** Additional JWT claims */
  [key: string]: unknown;
}

/**
 * JWT encoding parameters
 */
export interface JWTEncodeParams {
  token?: JWT;
  secret: string | Buffer;
  maxAge?: number;
}

/**
 * JWT decoding parameters
 */
export interface JWTDecodeParams {
  token?: string;
  secret: string | Buffer;
}

// ============================================================================
// Provider Types
// ============================================================================

/**
 * Base provider configuration
 */
export interface Provider {
  id: string;
  name: string;
  type: 'oauth' | 'email' | 'credentials' | 'magic-link';
  options?: Record<string, unknown> | undefined;
}

/**
 * OAuth provider configuration
 */
export interface OAuthProvider extends Provider {
  type: 'oauth';
  authorization: string | AuthorizationConfig;
  token: string | TokenConfig;
  userinfo?: string | UserinfoConfig | undefined;
  clientId: string;
  clientSecret: string;
  issuer?: string | undefined;
  wellKnown?: string | undefined;
  profile?: ((profile: Record<string, unknown>, tokens: TokenSet) => Promise<User>) | undefined;
  checks?: ('pkce' | 'state' | 'nonce')[] | undefined;
  client?: Partial<ClientOptions> | undefined;
  // OAuth client security: PKCE enabled by default for secure authorization flows
  enablePKCE?: boolean | undefined;
}

/**
 * Email provider configuration
 */
export interface EmailProvider extends Provider {
  type: 'email';
  server: string | SMTPConfig;
  from: string;
  sendVerificationRequest?: ((params: SendVerificationRequestParams) => Promise<void>) | undefined;
  generateVerificationToken?: (() => string) | undefined;
  maxAge?: number | undefined;
}

/**
 * Credentials provider configuration
 */
export interface CredentialsProvider extends Provider {
  type: 'credentials';
  credentials: Record<string, CredentialInput>;
  authorize: (credentials: Record<string, string> | undefined) => Promise<User | null>;
}

/**
 * Magic link provider configuration
 */
export interface MagicLinkProvider extends Provider {
  type: 'magic-link';
  sendMagicLink: (params: SendMagicLinkParams) => Promise<void>;
  generateToken?: () => string;
  maxAge?: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Main NextAirAuth configuration
 */
export interface NextAirAuthConfig {
  providers: Provider[];
  adapter?: Adapter;
  session?: {
    strategy?: 'jwt' | 'database';
    maxAge?: number;
    updateAge?: number;
    generateSessionToken?: () => string;
  };
  jwt?: {
    secret?: string;
    maxAge?: number;
    encode?: (params: JWTEncodeParams) => Promise<string>;
    decode?: (params: JWTDecodeParams) => Promise<JWT | null>;
  };
  pages?: {
    signIn?: string;
    signOut?: string;
    error?: string;
    verifyRequest?: string;
    newUser?: string;
  };
  callbacks?: {
    signIn?: (params: SignInCallbackParams) => Promise<boolean>;
    redirect?: (params: RedirectCallbackParams) => Promise<string>;
    session?: (params: SessionCallbackParams) => Promise<Session>;
    jwt?: (params: JWTCallbackParams) => Promise<JWT>;
  };
  events?: {
    signIn?: (message: SignInEventMessage) => Promise<void>;
    signOut?: (message: SignOutEventMessage) => Promise<void>;
    createUser?: (message: CreateUserEventMessage) => Promise<void>;
    updateUser?: (message: UpdateUserEventMessage) => Promise<void>;
    linkAccount?: (message: LinkAccountEventMessage) => Promise<void>;
    session?: (message: SessionEventMessage) => Promise<void>;
  };
  debug?: boolean;
  logger?: {
    error: (code: string, metadata?: Record<string, unknown>) => void;
    warn: (code: string) => void;
    debug: (code: string, metadata?: Record<string, unknown>) => void;
  };
  cookies?: {
    sessionToken?: {
      name: string;
      options: CookieOption;
    };
    callbackUrl?: {
      name: string;
      options: CookieOption;
    };
    csrfToken?: {
      name: string;
      options: CookieOption;
    };
    pkceCodeVerifier?: {
      name: string;
      options: CookieOption;
    };
    state?: {
      name: string;
      options: CookieOption;
    };
    nonce?: {
      name: string;
      options: CookieOption;
    };
  };
}

// ============================================================================
// Adapter Types
// ============================================================================

/**
 * Database adapter interface
 */
export interface Adapter {
  // User operations
  createUser(user: Omit<User, 'id'>): Promise<User>;
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByAccount(provider: string, providerAccountId: string): Promise<User | null>;
  updateUser(user: Partial<User> & Pick<User, 'id'>): Promise<User>;
  deleteUser(userId: string): Promise<void>;

  // Account operations
  linkAccount(account: Account): Promise<Account>;
  unlinkAccount(provider: string, providerAccountId: string): Promise<void>;

  // Session operations (database strategy)
  createSession?(session: {
    sessionToken: string;
    userId: string;
    expires: Date;
  }): Promise<Session>;
  getSessionAndUser?(sessionToken: string): Promise<{
    session: Session;
    user: User;
  } | null>;
  updateSession?(session: Partial<Session> & Pick<Session, 'sessionToken'>): Promise<Session>;
  deleteSession?(sessionToken: string): Promise<void>;

  // Verification token operations
  createVerificationToken?(verificationToken: VerificationToken): Promise<VerificationToken>;
  useVerificationToken?(params: {
    identifier: string;
    token: string;
  }): Promise<VerificationToken | null>;
}

// ============================================================================
// Hook Types
// ============================================================================

/**
 * useSession hook return type
 */
export interface UseSessionReturn {
  data: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  update: (data?: Partial<Session>) => Promise<Session | null>;
}

/**
 * Sign in options
 */
export interface SignInOptions {
  callbackUrl?: string;
  redirect?: boolean;
}

/**
 * Sign in response
 */
export interface SignInResponse {
  error?: string;
  status: number;
  ok: boolean;
  url?: string;
}

/**
 * Sign out options
 */
export interface SignOutOptions {
  callbackUrl?: string;
  redirect?: boolean;
}

// ============================================================================
// Callback Parameter Types
// ============================================================================

export interface SignInCallbackParams {
  user: User;
  account: Account | null;
  profile?: Record<string, unknown>;
  email?: {
    verificationRequest?: boolean;
  };
  credentials?: Record<string, string>;
}

export interface RedirectCallbackParams {
  url: string;
  baseUrl: string;
}

export interface SessionCallbackParams {
  session: Session;
  user: User;
  token: JWT;
}

export interface JWTCallbackParams {
  token: JWT;
  user?: User;
  account?: Account | null;
  profile?: Record<string, unknown>;
  trigger?: 'signIn' | 'signUp' | 'update';
  isNewUser?: boolean;
  session?: Partial<Session>;
}

// ============================================================================
// Event Message Types
// ============================================================================

export interface SignInEventMessage {
  user: User;
  account: Account | null;
  profile?: Record<string, unknown>;
  isNewUser?: boolean;
}

export interface SignOutEventMessage {
  session: Session;
  token: JWT;
}

export interface CreateUserEventMessage {
  user: User;
}

export interface UpdateUserEventMessage {
  user: User;
}

export interface LinkAccountEventMessage {
  user: User;
  account: Account;
  profile: Record<string, unknown>;
}

export interface SessionEventMessage {
  session: Session;
  token: JWT;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface AuthorizationConfig {
  url: string;
  params?: Record<string, string>;
}

export interface TokenConfig {
  url: string;
  params?: Record<string, string>;
}

export interface UserinfoConfig {
  url: string;
  params?: Record<string, string>;
}

export interface TokenSet {
  access_token?: string;
  token_type?: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  scope?: string;
}

export interface ClientOptions {
  client_id?: string;
  client_secret?: string;
  redirect_uris?: string[];
  response_types?: string[];
  grant_types?: string[];
  application_type?: string;
  token_endpoint_auth_method?: string;
}

export interface SMTPConfig {
  host: string;
  port: number;
  auth: {
    user: string;
    pass: string;
  };
  secure?: boolean;
}

export interface SendVerificationRequestParams {
  identifier: string;
  url: string;
  expires: Date;
  provider: EmailProvider;
  token: string;
}

export interface SendMagicLinkParams {
  identifier: string;
  url: string;
  expires: Date;
  provider: MagicLinkProvider;
  token: string;
}

export interface CredentialInput {
  label?: string;
  type?: string;
  value?: string;
  placeholder?: string;
}

export interface CookieOption {
  httpOnly?: boolean | undefined;
  sameSite?: 'lax' | 'strict' | 'none' | undefined;
  path?: string | undefined;
  secure?: boolean | undefined;
  domain?: string | undefined;
  maxAge?: number | undefined;
  expires?: Date | undefined;
}

// ============================================================================
// Error Types
// ============================================================================

export class NextAirAuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'NextAirAuthError';
  }
}

export class ConfigurationError extends NextAirAuthError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', metadata);
  }
}

export class AuthenticationError extends NextAirAuthError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', metadata);
  }
}

export class AuthorizationError extends NextAirAuthError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', metadata);
  }
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface AuthRequest extends NextRequest {
  auth?: Session | null;
}

export interface AuthApiRequest extends NextApiRequest {
  auth?: Session | null;
}

export type NextMiddleware = (
  request: NextRequest,
  event: { waitUntil: (promise: Promise<unknown>) => void }
) => NextResponse | Promise<NextResponse>;

export interface WithAuthOptions {
  pages?: {
    signIn?: string;
    error?: string;
  };
  callbacks?: {
    authorized?: (params: { token?: JWT | null; req: NextRequest }) => boolean;
  };
}

// ============================================================================
// Export all types
// ============================================================================
export * from './providers';
export * from './adapters';
