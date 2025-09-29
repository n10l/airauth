/**
 * Integration Test Setup
 * Provides shared utilities and mocks for integration testing
 */
import { vi } from 'vitest';
import type { User, Session, Adapter } from '../../types';

// Mock database for integration tests
export class MockDatabase {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, any> = new Map();
  private accounts: Map<string, any> = new Map();
  private verificationTokens: Map<string, any> = new Map();

  clear() {
    this.users.clear();
    this.sessions.clear();
    this.accounts.clear();
    this.verificationTokens.clear();
  }

  addUser(user: User) {
    this.users.set(user.id, user);
    return user;
  }

  getUser(id: string) {
    return this.users.get(id) || null;
  }

  getUserByEmail(email: string) {
    return Array.from(this.users.values()).find(u => u.email === email) || null;
  }

  addSession(sessionToken: string, userId: string, expires: Date) {
    const session = { sessionToken, userId, expires: expires.toISOString() };
    this.sessions.set(sessionToken, session);
    return session;
  }

  getSession(sessionToken: string) {
    return this.sessions.get(sessionToken) || null;
  }

  deleteSession(sessionToken: string) {
    return this.sessions.delete(sessionToken);
  }

  addAccount(userId: string, provider: string, providerAccountId: string, tokens?: any) {
    const accountId = `${provider}-${providerAccountId}`;
    const account = {
      userId,
      provider,
      providerAccountId,
      type: 'oauth',
      ...tokens,
    };
    this.accounts.set(accountId, account);
    return account;
  }

  getAccount(provider: string, providerAccountId: string) {
    return this.accounts.get(`${provider}-${providerAccountId}`) || null;
  }

  getUserAccounts(userId: string) {
    return Array.from(this.accounts.values()).filter(a => a.userId === userId);
  }

  addVerificationToken(identifier: string, token: string, expires: Date) {
    const verificationToken = { identifier, token, expires };
    this.verificationTokens.set(`${identifier}-${token}`, verificationToken);
    return verificationToken;
  }

  useVerificationToken(identifier: string, token: string) {
    const key = `${identifier}-${token}`;
    const verificationToken = this.verificationTokens.get(key);
    if (verificationToken) {
      this.verificationTokens.delete(key);
    }
    return verificationToken || null;
  }
}

// Create mock adapter
export function createMockAdapter(db: MockDatabase): Adapter {
  return {
    createUser: vi.fn(async user => {
      const newUser = {
        id: `user-${Date.now()}`,
        ...user,
        emailVerified: user.emailVerified || null,
      };
      return db.addUser(newUser);
    }),

    getUser: vi.fn(async id => db.getUser(id)),

    getUserByEmail: vi.fn(async email => db.getUserByEmail(email)),

    getUserByAccount: vi.fn(async ({ provider, providerAccountId }) => {
      const account = db.getAccount(provider, providerAccountId);
      return account ? db.getUser(account.userId) : null;
    }),

    updateUser: vi.fn(async user => {
      const existing = db.getUser(user.id);
      if (!existing) return null;
      const updated = { ...existing, ...user };
      db.addUser(updated);
      return updated;
    }),

    deleteUser: vi.fn(async (userId: string) => {
      const user = db.getUser(userId);
      if (user) {
        (db as any).users.delete(userId);
      }
      return;
    }),

    linkAccount: vi.fn(async account => {
      return db.addAccount(account.userId, account.provider, account.providerAccountId, {
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
      });
    }),

    unlinkAccount: vi.fn(async ({ provider, providerAccountId }) => {
      const account = db.getAccount(provider, providerAccountId);
      if (account) {
        (db as any).accounts.delete(`${provider}-${providerAccountId}`);
      }
      return account;
    }),

    createSession: vi.fn(async ({ sessionToken, userId, expires }: { sessionToken: string; userId: string; expires: Date; }) => {
      const session = db.addSession(sessionToken, userId, expires);
      return {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
        user: db.getUser(userId)!,
      } as Session;
    }),

    getSessionAndUser: vi.fn(async sessionToken => {
      const session = db.getSession(sessionToken);
      if (!session) return null;
      const user = db.getUser(session.userId);
      if (!user) return null;
      return { session, user };
    }),

    updateSession: vi.fn(async ({ sessionToken }) => {
      const session = db.getSession(sessionToken);
      if (!session) return null;
      // Update session expiry
      session.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      return session;
    }),

    deleteSession: vi.fn(async sessionToken => {
      const session = db.getSession(sessionToken);
      if (session) {
        db.deleteSession(sessionToken);
      }
      return session;
    }),

    createVerificationToken: vi.fn(async ({ identifier, token, expires }) => {
      return db.addVerificationToken(identifier, token, expires);
    }),

    useVerificationToken: vi.fn(async ({ identifier, token }) => {
      return db.useVerificationToken(identifier, token);
    }),
  };
}

// Mock HTTP Request/Response
export function createMockRequest(
  options: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
    body?: any;
  } = {}
) {
  const url = new URL(options.url || 'http://localhost:3000');
  const headers = new Map(Object.entries(options.headers || {}));

  if (options.cookies) {
    const cookieString = Object.entries(options.cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    headers.set('cookie', cookieString);
  }

  return {
    method: options.method || 'GET',
    url: url.toString(),
    headers,
    cookies: {
      get: (name: string) => options.cookies?.[name],
      getAll: () => Object.entries(options.cookies || {}).map(([name, value]) => ({ name, value })),
    },
    json: async () => options.body,
    text: async () => JSON.stringify(options.body),
    formData: async () => {
      const formData = new FormData();
      if (options.body) {
        Object.entries(options.body).forEach(([key, value]) => {
          formData.append(key, value as string);
        });
      }
      return formData;
    },
  };
}

export function createMockResponse() {
  const headers = new Map();
  const cookies: Array<{ name: string; value: string; options?: any }> = [];

  return {
    headers,
    cookies: {
      set: (name: string, value: string, options?: any) => {
        cookies.push({ name, value, options });
      },
      delete: (name: string) => {
        cookies.push({ name, value: '', options: { maxAge: 0 } });
      },
      get: (name: string) => {
        const cookie = cookies.find(c => c.name === name);
        return cookie?.value;
      },
      getAll: () => cookies,
    },
    status: 200,
    statusText: 'OK',
    json: (data: any) => {
      headers.set('content-type', 'application/json');
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: Object.fromEntries(headers),
      });
    },
    redirect: (url: string, status = 302) => {
      headers.set('location', url);
      return new Response(null, {
        status,
        headers: Object.fromEntries(headers),
      });
    },
  };
}

// Test users
export const testUsers = {
  alice: {
    id: 'user-alice',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    image: 'https://example.com/alice.jpg',
    role: 'user',
    emailVerified: new Date('2024-01-01'),
  },
  bob: {
    id: 'user-bob',
    name: 'Bob Smith',
    email: 'bob@example.com',
    image: null,
    role: 'admin',
    emailVerified: null,
  },
  charlie: {
    id: 'user-charlie',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    image: 'https://example.com/charlie.jpg',
    role: 'user',
    emailVerified: new Date('2024-02-01'),
  },
};

// Test OAuth providers data
export const testProviders = {
  github: {
    id: 'github',
    name: 'GitHub',
    clientId: 'test-github-client-id',
    clientSecret: 'test-github-client-secret',
  },
  google: {
    id: 'google',
    name: 'Google',
    clientId: 'test-google-client-id',
    clientSecret: 'test-google-client-secret',
  },
};

// Wait utility for async operations
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Environment setup
export function setupTestEnvironment() {
  // Set required environment variables
  process.env.NEXT_AIRAUTH_URL = 'http://localhost:3000';
  process.env.NEXT_AIRAUTH_SECRET = 'test-secret-key-for-integration-tests';
  (process.env as any).NODE_ENV = 'test';

  // Mock crypto.randomUUID if not available
  if (!global.crypto) {
    global.crypto = {
      randomUUID: () => `uuid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      getRandomValues: (arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
    } as any;
  }
}

export function teardownTestEnvironment() {
  delete process.env.NEXT_AIRAUTH_URL;
  delete process.env.NEXT_AIRAUTH_SECRET;
  delete (process.env as any).NODE_ENV;
}
