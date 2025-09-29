/**
 * Adapter-specific type definitions
 */
import { User, Account, Session, VerificationToken, Adapter } from './index';

// ============================================================================
// Prisma Adapter Types
// ============================================================================

export interface PrismaClient {
  user: {
    create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    findUnique: (args: {
      where: Record<string, unknown>;
    }) => Promise<Record<string, unknown> | null>;
    findFirst: (args: {
      where: Record<string, unknown>;
    }) => Promise<Record<string, unknown> | null>;
    update: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<Record<string, unknown>>;
    delete: (args: { where: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  };
  account: {
    create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    delete: (args: { where: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  };
  session: {
    create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    findUnique: (args: {
      where: Record<string, unknown>;
      include?: Record<string, unknown>;
    }) => Promise<Record<string, unknown> | null>;
    update: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<Record<string, unknown>>;
    delete: (args: { where: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  };
  verificationToken: {
    create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    findUnique: (args: {
      where: Record<string, unknown>;
    }) => Promise<Record<string, unknown> | null>;
    delete: (args: { where: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  };
}

export interface PrismaAdapterOptions {
  prisma: PrismaClient;
}

// ============================================================================
// Drizzle Adapter Types
// ============================================================================

export interface DrizzleDatabase {
  select: () => unknown;
  insert: (table: Record<string, unknown>) => unknown;
  update: (table: Record<string, unknown>) => unknown;
  delete: (table: Record<string, unknown>) => unknown;
}

export interface DrizzleSchema {
  users: Record<string, unknown>;
  accounts: Record<string, unknown>;
  sessions: Record<string, unknown>;
  verificationTokens: Record<string, unknown>;
}

export interface DrizzleAdapterOptions {
  db: DrizzleDatabase;
  schema: DrizzleSchema;
}

// ============================================================================
// Memory Adapter Types (for testing)
// ============================================================================

export interface MemoryAdapterData {
  users: Map<string, User>;
  accounts: Map<string, Account>;
  sessions: Map<string, Session & { userId: string }>;
  verificationTokens: Map<string, VerificationToken>;
}

// ============================================================================
// Custom Adapter Types
// ============================================================================

export interface AdapterFactory<T = Record<string, unknown>> {
  (options: T): Adapter;
}

export interface AdapterFactories {
  Prisma: AdapterFactory<PrismaAdapterOptions>;
  Drizzle: AdapterFactory<DrizzleAdapterOptions>;
  Memory: AdapterFactory<{}>;
}

// ============================================================================
// Database Schema Types
// ============================================================================

export interface DatabaseUser {
  id: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: Date | null;
  image?: string | null;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseAccount {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseSession {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseVerificationToken {
  identifier: string;
  token: string;
  expires: Date;
  createdAt: Date;
}

// ============================================================================
// Migration Types
// ============================================================================

export interface MigrationScript {
  version: string;
  description: string;
  up: (adapter: Adapter) => Promise<void>;
  down: (adapter: Adapter) => Promise<void>;
}

export interface MigrationRunner {
  run: (scripts: MigrationScript[]) => Promise<void>;
  rollback: (version: string) => Promise<void>;
  status: () => Promise<{ version: string; appliedAt: Date }[]>;
}
