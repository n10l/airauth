'use client';

import { motion } from 'framer-motion';
import { Webhook, Check, Copy, ArrowRight, Shield, AlertTriangle, Zap, Code } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function WebhooksPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    basicWebhook: `// app/api/webhooks/auth/route.ts
import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import crypto from "crypto"

const WEBHOOK_SECRET = process.env.NEXTAUTH_WEBHOOK_SECRET

function verifySignature(body: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false
  
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex')
    
  return crypto.timingSafeEqual(
    Buffer.from(\`sha256=\${expectedSignature}\`),
    Buffer.from(signature)
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = headers().get('x-nextauth-signature')
    
    // Verify webhook signature
    if (!signature || !verifySignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    const event = JSON.parse(body)
    
    // Handle different event types
    switch (event.type) {
      case 'user.created':
        await handleUserCreated(event.data)
        break
        
      case 'user.signedIn':
        await handleUserSignIn(event.data)
        break
        
      case 'user.signedOut':
        await handleUserSignOut(event.data)
        break
        
      case 'session.created':
        await handleSessionCreated(event.data)
        break
        
      default:
        console.log(\`Unhandled event type: \${event.type}\`)
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleUserCreated(data: any) {
  console.log('New user created:', data.user.email)
  
  // Example: Send welcome email
  // await sendWelcomeEmail(data.user.email, data.user.name)
  
  // Example: Create user profile
  // await createUserProfile(data.user.id, data.user)
  
  // Example: Add to analytics
  // await analytics.track('User Created', {
  //   userId: data.user.id,
  //   email: data.user.email,
  //   provider: data.account?.provider
  // })
}

async function handleUserSignIn(data: any) {
  console.log('User signed in:', data.user.email)
  
  // Example: Update last login
  // await updateLastLogin(data.user.id)
  
  // Example: Log security event
  // await logSecurityEvent('user_login', {
  //   userId: data.user.id,
  //   ip: data.session.ip,
  //   userAgent: data.session.userAgent
  // })
}

async function handleUserSignOut(data: any) {
  console.log('User signed out:', data.user.email)
  
  // Example: Clean up user sessions
  // await cleanupUserSessions(data.user.id)
}

async function handleSessionCreated(data: any) {
  console.log('New session created for user:', data.user.email)
  
  // Example: Track active sessions
  // await trackActiveSession(data.user.id, data.session.id)
}`,

    authConfig: `// app/api/auth/[...nextauth]/route.ts
import NextAuth from "@airauth/next"
import GoogleProvider from "@airauth/next/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Trigger webhook for sign in
      await triggerWebhook('user.signedIn', {
        user,
        account,
        profile,
        isNewUser,
        timestamp: new Date().toISOString()
      })
    },
    
    async signOut({ session, token }) {
      // Trigger webhook for sign out
      await triggerWebhook('user.signedOut', {
        user: session?.user || token?.user,
        timestamp: new Date().toISOString()
      })
    },
    
    async createUser({ user }) {
      // Trigger webhook for new user
      await triggerWebhook('user.created', {
        user,
        timestamp: new Date().toISOString()
      })
    },
    
    async session({ session, token }) {
      // Trigger webhook for session creation
      if (session.user) {
        await triggerWebhook('session.created', {
          user: session.user,
          session: {
            id: token.sub,
            expires: session.expires
          },
          timestamp: new Date().toISOString()
        })
      }
    }
  }
})

async function triggerWebhook(eventType: string, data: any) {
  const webhookUrl = process.env.NEXTAUTH_WEBHOOK_URL
  const webhookSecret = process.env.NEXTAUTH_WEBHOOK_SECRET
  
  if (!webhookUrl) return
  
  const payload = {
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  }
  
  const body = JSON.stringify(payload)
  const signature = createSignature(body, webhookSecret)
  
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-NextAuth-Signature': signature,
        'User-Agent': 'NextAuth-Webhook/1.0'
      },
      body
    })
  } catch (error) {
    console.error('Webhook delivery failed:', error)
  }
}

function createSignature(body: string, secret?: string): string {
  if (!secret) return ''
  
  return \`sha256=\${crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')}\`
}

export { handlers as GET, handlers as POST }`,

    advancedWebhook: `// lib/webhook-handler.ts
import crypto from "crypto"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface WebhookEvent {
  type: string
  data: any
  timestamp: string
  id?: string
}

interface WebhookConfig {
  secret: string
  retryAttempts: number
  timeout: number
  enableLogging: boolean
}

export class WebhookHandler {
  private config: WebhookConfig

  constructor(config: Partial<WebhookConfig> = {}) {
    this.config = {
      secret: process.env.NEXTAUTH_WEBHOOK_SECRET || '',
      retryAttempts: 3,
      timeout: 10000,
      enableLogging: true,
      ...config
    }
  }

  async processEvent(event: WebhookEvent): Promise<{ success: boolean; error?: string }> {
    try {
      // Log the event if enabled
      if (this.config.enableLogging) {
        await this.logEvent(event)
      }

      // Process based on event type
      switch (event.type) {
        case 'user.created':
          return await this.handleUserCreated(event.data)
          
        case 'user.signedIn':
          return await this.handleUserSignIn(event.data)
          
        case 'user.signedOut':
          return await this.handleUserSignOut(event.data)
          
        case 'user.updated':
          return await this.handleUserUpdated(event.data)
          
        case 'session.created':
          return await this.handleSessionCreated(event.data)
          
        case 'session.deleted':
          return await this.handleSessionDeleted(event.data)
          
        default:
          console.warn(\`Unhandled webhook event type: \${event.type}\`)
          return { success: true }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Webhook processing error:', errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  private async handleUserCreated(data: any) {
    console.log('Processing user.created event:', data.user.email)
    
    try {
      // Create user analytics record
      await prisma.userAnalytics.create({
        data: {
          userId: data.user.id,
          event: 'user_created',
          metadata: {
            provider: data.account?.provider,
            isNewUser: true,
            timestamp: data.timestamp
          }
        }
      })

      // Send welcome email (example)
      await this.sendWelcomeEmail(data.user)
      
      // Add to mailing list (example)
      await this.addToMailingList(data.user)
      
      return { success: true }
    } catch (error) {
      throw new Error(\`Failed to process user.created: \${error}\`)
    }
  }

  private async handleUserSignIn(data: any) {
    console.log('Processing user.signedIn event:', data.user.email)
    
    try {
      // Update last login timestamp
      await prisma.user.update({
        where: { id: data.user.id },
        data: { lastLoginAt: new Date() }
      })

      // Track login analytics
      await prisma.userAnalytics.create({
        data: {
          userId: data.user.id,
          event: 'user_signed_in',
          metadata: {
            provider: data.account?.provider,
            isNewUser: data.isNewUser,
            timestamp: data.timestamp
          }
        }
      })

      // Check for suspicious activity (example)
      await this.checkSuspiciousActivity(data.user.id)
      
      return { success: true }
    } catch (error) {
      throw new Error(\`Failed to process user.signedIn: \${error}\`)
    }
  }

  private async handleUserSignOut(data: any) {
    console.log('Processing user.signedOut event:', data.user.email)
    
    try {
      // Clean up active sessions if needed
      await this.cleanupUserSessions(data.user.id)
      
      // Track logout analytics
      await prisma.userAnalytics.create({
        data: {
          userId: data.user.id,
          event: 'user_signed_out',
          metadata: {
            timestamp: data.timestamp
          }
        }
      })
      
      return { success: true }
    } catch (error) {
      throw new Error(\`Failed to process user.signedOut: \${error}\`)
    }
  }

  private async sendWelcomeEmail(user: any) {
    // Implement your email service integration
    console.log(\`Sending welcome email to \${user.email}\`)
  }

  private async addToMailingList(user: any) {
    // Implement your mailing list integration
    console.log(\`Adding \${user.email} to mailing list\`)
  }

  private async checkSuspiciousActivity(userId: string) {
    // Implement security checks
    console.log(\`Checking suspicious activity for user \${userId}\`)
  }

  private async cleanupUserSessions(userId: string) {
    // Implement session cleanup
    console.log(\`Cleaning up sessions for user \${userId}\`)
  }

  private async logEvent(event: WebhookEvent) {
    await prisma.webhookLog.create({
      data: {
        eventType: event.type,
        payload: event.data,
        timestamp: new Date(event.timestamp),
        processed: false
      }
    })
  }

  verifySignature(body: string, signature: string): boolean {
    if (!this.config.secret) return false
    
    const expectedSignature = crypto
      .createHmac('sha256', this.config.secret)
      .update(body)
      .digest('hex')
      
    return crypto.timingSafeEqual(
      Buffer.from(\`sha256=\${expectedSignature}\`),
      Buffer.from(signature)
    )
  }
}`,

    eventTypes: `// types/webhook-events.ts
export interface BaseEvent {
  type: string
  timestamp: string
  id: string
}

export interface UserCreatedEvent extends BaseEvent {
  type: 'user.created'
  data: {
    user: {
      id: string
      name?: string
      email: string
      image?: string
    }
    account?: {
      provider: string
      type: string
      providerAccountId: string
    }
  }
}

export interface UserSignedInEvent extends BaseEvent {
  type: 'user.signedIn'
  data: {
    user: {
      id: string
      name?: string
      email: string
      image?: string
    }
    account?: {
      provider: string
      type: string
      providerAccountId: string
    }
    profile?: any
    isNewUser: boolean
  }
}

export interface UserSignedOutEvent extends BaseEvent {
  type: 'user.signedOut'
  data: {
    user: {
      id: string
      name?: string
      email: string
    }
  }
}

export interface SessionCreatedEvent extends BaseEvent {
  type: 'session.created'
  data: {
    user: {
      id: string
      name?: string
      email: string
    }
    session: {
      id: string
      expires: string
    }
  }
}

export type WebhookEvent = 
  | UserCreatedEvent 
  | UserSignedInEvent 
  | UserSignedOutEvent 
  | SessionCreatedEvent`,

    testingWebhooks: `// __tests__/webhooks.test.ts
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/webhooks/auth/route'
import crypto from 'crypto'

const WEBHOOK_SECRET = 'test-webhook-secret'

function createTestSignature(body: string): string {
  return \`sha256=\${crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex')}\`
}

describe('Webhook Handler', () => {
  beforeEach(() => {
    process.env.NEXTAUTH_WEBHOOK_SECRET = WEBHOOK_SECRET
  })

  it('should process user.created event', async () => {
    const payload = {
      type: 'user.created',
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User'
        }
      },
      timestamp: new Date().toISOString()
    }

    const body = JSON.stringify(payload)
    const signature = createTestSignature(body)

    const req = new NextRequest('http://localhost:3000/api/webhooks/auth', {
      method: 'POST',
      body,
      headers: {
        'x-nextauth-signature': signature,
        'content-type': 'application/json'
      }
    })

    const response = await POST(req)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.received).toBe(true)
  })

  it('should reject invalid signatures', async () => {
    const payload = {
      type: 'user.created',
      data: { user: { id: '1', email: 'test@example.com' } },
      timestamp: new Date().toISOString()
    }

    const body = JSON.stringify(payload)

    const req = new NextRequest('http://localhost:3000/api/webhooks/auth', {
      method: 'POST',
      body,
      headers: {
        'x-nextauth-signature': 'invalid-signature',
        'content-type': 'application/json'
      }
    })

    const response = await POST(req)
    expect(response.status).toBe(401)
  })

  it('should handle malformed JSON', async () => {
    const body = 'invalid json'
    const signature = createTestSignature(body)

    const req = new NextRequest('http://localhost:3000/api/webhooks/auth', {
      method: 'POST',
      body,
      headers: {
        'x-nextauth-signature': signature,
        'content-type': 'application/json'
      }
    })

    const response = await POST(req)
    expect(response.status).toBe(500)
  })
})`,

    retryMechanism: `// lib/webhook-retry.ts
interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
}

export class WebhookRetry {
  private config: RetryConfig

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      ...config
    }
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (attempt === this.config.maxAttempts) {
          console.error(\`Final attempt failed for \${context}:\`, lastError.message)
          throw lastError
        }
        
        const delay = this.calculateDelay(attempt)
        console.warn(
          \`Attempt \${attempt} failed for \${context}, retrying in \${delay}ms:\`,
          lastError.message
        )
        
        await this.sleep(delay)
      }
    }
    
    throw lastError!
  }

  private calculateDelay(attempt: number): number {
    const delay = this.config.baseDelay * Math.pow(this.config.backoffFactor, attempt - 1)
    return Math.min(delay, this.config.maxDelay)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Usage example
export async function deliverWebhook(url: string, payload: any) {
  const retry = new WebhookRetry({
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 60000
  })

  return retry.executeWithRetry(async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NextAuth-Webhook/1.0'
      },
      body: JSON.stringify(payload),
      timeout: 10000
    })

    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`)
    }

    return response.json()
  }, \`webhook delivery to \${url}\`)
}`,
  };

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl'>
            <Webhook className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Webhooks</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Listen to authentication events in real-time and integrate with external systems
          seamlessly.
        </p>
      </motion.div>

      {/* Overview */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>Overview</h2>
        <div className='prose prose-slate dark:prose-invert max-w-none'>
          <p className='text-slate-600 dark:text-slate-400 mb-4'>
            Webhooks allow you to receive real-time notifications when authentication events occur
            in your application. This enables you to synchronize user data, trigger automated
            workflows, and integrate with external systems like CRMs, analytics platforms, or
            notification services.
          </p>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <div className='p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center'>
              <Zap className='w-8 h-8 text-yellow-600 mx-auto mb-2' />
              <h3 className='font-medium text-slate-900 dark:text-white'>Real-time</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Instant event notifications
              </p>
            </div>
            <div className='p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center'>
              <Shield className='w-8 h-8 text-blue-600 mx-auto mb-2' />
              <h3 className='font-medium text-slate-900 dark:text-white'>Secure</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                HMAC signature verification
              </p>
            </div>
            <div className='p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center'>
              <Code className='w-8 h-8 text-purple-600 mx-auto mb-2' />
              <h3 className='font-medium text-slate-900 dark:text-white'>Flexible</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Customizable event handling
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Webhook Events */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Available Events
        </h2>
        <div className='overflow-x-auto'>
          <table className='w-full border-collapse bg-white dark:bg-slate-800 rounded-lg shadow-sm'>
            <thead>
              <tr className='border-b border-slate-200 dark:border-slate-600'>
                <th className='text-left p-4 font-semibold text-slate-900 dark:text-white'>
                  Event
                </th>
                <th className='text-left p-4 font-semibold text-slate-900 dark:text-white'>
                  Trigger
                </th>
                <th className='text-left p-4 font-semibold text-slate-900 dark:text-white'>
                  Data Included
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className='border-b border-slate-100 dark:border-slate-700'>
                <td className='p-4 font-mono text-sm'>user.created</td>
                <td className='p-4 text-slate-600 dark:text-slate-400'>New user registration</td>
                <td className='p-4 text-slate-600 dark:text-slate-400'>User, Account, Profile</td>
              </tr>
              <tr className='border-b border-slate-100 dark:border-slate-700'>
                <td className='p-4 font-mono text-sm'>user.signedIn</td>
                <td className='p-4 text-slate-600 dark:text-slate-400'>User signs in</td>
                <td className='p-4 text-slate-600 dark:text-slate-400'>User, Account, isNewUser</td>
              </tr>
              <tr className='border-b border-slate-100 dark:border-slate-700'>
                <td className='p-4 font-mono text-sm'>user.signedOut</td>
                <td className='p-4 text-slate-600 dark:text-slate-400'>User signs out</td>
                <td className='p-4 text-slate-600 dark:text-slate-400'>User, Session</td>
              </tr>
              <tr>
                <td className='p-4 font-mono text-sm'>session.created</td>
                <td className='p-4 text-slate-600 dark:text-slate-400'>New session created</td>
                <td className='p-4 text-slate-600 dark:text-slate-400'>User, Session details</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* Basic Setup */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Basic Webhook Handler
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Create an API route to receive and process webhook events:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.basicWebhook, 'basicWebhook')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'basicWebhook' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.basicWebhook}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Configuration */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          NextAuth Configuration
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Configure your NextAuth setup to trigger webhooks on authentication events:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.authConfig, 'authConfig')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'authConfig' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.authConfig}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Environment Variables */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Environment Variables
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Add these environment variables to your .env file:
        </p>
        <div className='relative'>
          <button
            onClick={() =>
              copyCode(
                `# Webhook Configuration
NEXTAUTH_WEBHOOK_URL=https://your-app.com/api/webhooks/auth
NEXTAUTH_WEBHOOK_SECRET=your-secure-webhook-secret-here

# Generate a secure secret with:
# openssl rand -base64 32`,
                'envVars'
              )
            }
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'envVars' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded-lg'>
            {`# Webhook Configuration
NEXTAUTH_WEBHOOK_URL=https://your-app.com/api/webhooks/auth
NEXTAUTH_WEBHOOK_SECRET=your-secure-webhook-secret-here

# Generate a secure secret with:
# openssl rand -base64 32`}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Advanced Handler */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Advanced Webhook Handler
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          A more robust webhook handler with error handling, logging, and retries:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.advancedWebhook, 'advancedWebhook')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'advancedWebhook' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.advancedWebhook}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Type Definitions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Type Definitions
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          TypeScript definitions for webhook events:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.eventTypes, 'eventTypes')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'eventTypes' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.eventTypes}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Security Best Practices */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Security Best Practices
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
            <h3 className='font-semibold text-red-900 dark:text-red-400 mb-3'>Critical Security</h3>
            <ul className='space-y-2 text-sm text-red-800 dark:text-red-300'>
              <li>• Always verify webhook signatures</li>
              <li>• Use HTTPS endpoints only</li>
              <li>• Generate strong webhook secrets</li>
              <li>• Implement rate limiting</li>
              <li>• Log all webhook events for auditing</li>
            </ul>
          </div>

          <div className='p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg'>
            <h3 className='font-semibold text-amber-900 dark:text-amber-400 mb-3'>Reliability</h3>
            <ul className='space-y-2 text-sm text-amber-800 dark:text-amber-300'>
              <li>• Implement retry mechanisms</li>
              <li>• Handle duplicate events gracefully</li>
              <li>• Use idempotent operations</li>
              <li>• Set appropriate timeouts</li>
              <li>• Monitor webhook failures</li>
            </ul>
          </div>
        </div>

        <div className='mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
          <div className='flex items-start gap-3'>
            <AlertTriangle className='w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5' />
            <div>
              <h4 className='font-medium text-blue-900 dark:text-blue-400 mb-1'>Important Note</h4>
              <p className='text-sm text-blue-800 dark:text-blue-300'>
                Always validate and sanitize webhook data before processing. Never trust incoming
                data without verification, and implement proper error handling to prevent your
                application from crashing.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Testing */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Testing Webhooks
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Example test cases for your webhook handlers:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.testingWebhooks, 'testingWebhooks')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'testingWebhooks' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.testingWebhooks}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Related Links */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Related Documentation
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <a
            href='/docs/api-routes'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>API Routes</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Building secure API endpoints
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/monitoring'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Monitoring</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Monitor authentication events
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
