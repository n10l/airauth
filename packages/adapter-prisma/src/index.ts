/**
 * @airauth/adapter-prisma
 * Prisma adapter for AirAuth authentication library
 */

import type { PrismaClient } from '@prisma/client';
import type { Adapter, User, Account, Session, VerificationToken } from '@airauth/core';

export interface PrismaAdapterOptions {
  prisma: PrismaClient;
}

/**
 * Create a Prisma adapter for AirAuth
 */
export function PrismaAdapter(prisma: PrismaClient): Adapter {
  return {
    // ========================================================================
    // User Methods
    // ========================================================================

    async createUser(user: Omit<User, 'id'>) {
      const dbUser = await prisma.user.create({
        data: {
          email: user.email,
          email_verified: user.emailVerified,
          name: user.name,
          image: user.image,
          role: user.role,
        },
      });

      return {
        id: dbUser.id,
        email: dbUser.email,
        emailVerified: dbUser.email_verified,
        name: dbUser.name,
        image: dbUser.image,
        role: dbUser.role,
      };
    },

    async getUser(id: string) {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        emailVerified: user.email_verified,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    },

    async getUserByEmail(email: string) {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        emailVerified: user.email_verified,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const account = await prisma.account.findUnique({
        where: {
          provider_provider_account_id: {
            provider,
            provider_account_id: providerAccountId,
          },
        },
        include: {
          user: true,
        },
      });

      if (!account?.user) return null;

      return {
        id: account.user.id,
        email: account.user.email,
        emailVerified: account.user.email_verified,
        name: account.user.name,
        image: account.user.image,
        role: account.user.role,
      };
    },

    async updateUser(user: Partial<User> & { id: string }) {
      const { id, ...data } = user;

      const updated = await prisma.user.update({
        where: { id },
        data: {
          email: data.email,
          email_verified: data.emailVerified,
          name: data.name,
          image: data.image,
          role: data.role,
        },
      });

      return {
        id: updated.id,
        email: updated.email,
        emailVerified: updated.email_verified,
        name: updated.name,
        image: updated.image,
        role: updated.role,
      };
    },

    async deleteUser(userId: string) {
      await prisma.user.delete({
        where: { id: userId },
      });
    },

    // ========================================================================
    // Account Methods
    // ========================================================================

    async linkAccount(account: Account) {
      await prisma.account.create({
        data: {
          user_id: account.userId,
          type: account.type,
          provider: account.provider,
          provider_account_id: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
        },
      });

      return account;
    },

    async unlinkAccount({ providerAccountId, provider }) {
      await prisma.account.delete({
        where: {
          provider_provider_account_id: {
            provider,
            provider_account_id: providerAccountId,
          },
        },
      });
    },

    // ========================================================================
    // Session Methods
    // ========================================================================

    async createSession(session: { sessionToken: string; userId: string; expires: Date }) {
      const dbSession = await prisma.session.create({
        data: {
          session_token: session.sessionToken,
          user_id: session.userId,
          expires: session.expires,
        },
      });

      return {
        sessionToken: dbSession.session_token,
        userId: dbSession.user_id,
        expires: dbSession.expires,
      };
    },

    async getSessionAndUser(sessionToken: string) {
      const session = await prisma.session.findUnique({
        where: { session_token: sessionToken },
        include: { user: true },
      });

      if (!session) return null;

      return {
        session: {
          sessionToken: session.session_token,
          userId: session.user_id,
          expires: session.expires,
        },
        user: {
          id: session.user.id,
          email: session.user.email,
          emailVerified: session.user.email_verified,
          name: session.user.name,
          image: session.user.image,
          role: session.user.role,
        },
      };
    },

    async updateSession(session: { sessionToken: string; userId?: string; expires?: Date }) {
      const updated = await prisma.session.update({
        where: { session_token: session.sessionToken },
        data: {
          user_id: session.userId,
          expires: session.expires,
        },
      });

      return {
        sessionToken: updated.session_token,
        userId: updated.user_id,
        expires: updated.expires,
      };
    },

    async deleteSession(sessionToken: string) {
      await prisma.session.delete({
        where: { session_token: sessionToken },
      });
    },

    // ========================================================================
    // Verification Token Methods
    // ========================================================================

    async createVerificationToken(verificationToken: VerificationToken) {
      const token = await prisma.verificationToken.create({
        data: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
          expires: verificationToken.expires,
        },
      });

      return {
        identifier: token.identifier,
        token: token.token,
        expires: token.expires,
      };
    },

    async useVerificationToken({ identifier, token }) {
      try {
        const verificationToken = await prisma.verificationToken.delete({
          where: {
            identifier_token: {
              identifier,
              token,
            },
          },
        });

        return {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
          expires: verificationToken.expires,
        };
      } catch (error) {
        // Token not found or already used
        return null;
      }
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format Prisma user to AirAuth User type
 */
export function formatUser(user: any): User {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    name: user.name,
    image: user.image,
    role: user.role,
  };
}

/**
 * Format Prisma account to AirAuth Account type
 */
export function formatAccount(account: any): Account {
  return {
    userId: account.userId,
    type: account.type,
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    refresh_token: account.refresh_token,
    access_token: account.access_token,
    expires_at: account.expires_at,
    token_type: account.token_type,
    scope: account.scope,
    id_token: account.id_token,
    session_state: account.session_state,
  };
}

/**
 * Format Prisma session to AirAuth Session type
 */
export function formatSession(session: any): Session {
  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      role: session.user.role,
    },
    expires: session.expires.toISOString(),
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  };
}

// ============================================================================
// Migration SQL Scripts
// ============================================================================

/**
 * PostgreSQL migration script for AirAuth tables
 */
export const postgresqlSchema = `
-- CreateTable Users
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "role" TEXT DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable Accounts
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable Sessions
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable VerificationTokens
CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
`;

/**
 * MySQL migration script for AirAuth tables
 */
export const mysqlSchema = `
-- CreateTable Users
CREATE TABLE IF NOT EXISTS User (
    id VARCHAR(191) NOT NULL DEFAULT (UUID()),
    email VARCHAR(191) NULL,
    emailVerified DATETIME(3) NULL,
    name VARCHAR(191) NULL,
    image VARCHAR(191) NULL,
    role VARCHAR(191) DEFAULT 'user',
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX User_email_key(email),
    PRIMARY KEY (id)
);

-- CreateTable Accounts
CREATE TABLE IF NOT EXISTS Account (
    id VARCHAR(191) NOT NULL DEFAULT (UUID()),
    userId VARCHAR(191) NOT NULL,
    type VARCHAR(191) NOT NULL,
    provider VARCHAR(191) NOT NULL,
    providerAccountId VARCHAR(191) NOT NULL,
    refresh_token TEXT NULL,
    access_token TEXT NULL,
    expires_at INTEGER NULL,
    token_type VARCHAR(191) NULL,
    scope VARCHAR(191) NULL,
    id_token TEXT NULL,
    session_state VARCHAR(191) NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX Account_provider_providerAccountId_key(provider, providerAccountId),
    INDEX Account_userId_idx(userId),
    PRIMARY KEY (id),
    CONSTRAINT Account_userId_fkey FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable Sessions
CREATE TABLE IF NOT EXISTS Session (
    id VARCHAR(191) NOT NULL DEFAULT (UUID()),
    sessionToken VARCHAR(191) NOT NULL,
    userId VARCHAR(191) NOT NULL,
    expires DATETIME(3) NOT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX Session_sessionToken_key(sessionToken),
    INDEX Session_userId_idx(userId),
    PRIMARY KEY (id),
    CONSTRAINT Session_userId_fkey FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable VerificationTokens
CREATE TABLE IF NOT EXISTS VerificationToken (
    identifier VARCHAR(191) NOT NULL,
    token VARCHAR(191) NOT NULL,
    expires DATETIME(3) NOT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX VerificationToken_token_key(token),
    UNIQUE INDEX VerificationToken_identifier_token_key(identifier, token)
);
`;
