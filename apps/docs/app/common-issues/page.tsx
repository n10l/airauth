'use client';

import { motion } from 'framer-motion';
import { AlertCircle, Check, Copy, ArrowRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function CommonIssuesPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    secretError: `# .env.local
NEXTAUTH_SECRET=your-secret-key-here

# Generate a secure secret using:
openssl rand -base64 32`,

    urlError: `# .env.local
NEXTAUTH_URL=http://localhost:3000
# In production:
NEXTAUTH_URL=https://yourdomain.com`,

    sessionIssue: `// app/api/auth/[...nextauth]/route.ts
import NextAuth from "@airauth/next"

export const authOptions = {
  // ... your config
  session: {
    strategy: "jwt", // or "database"
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
}`,

    providerConfig: `// app/api/auth/[...nextauth]/route.ts
import GoogleProvider from "@airauth/next/providers/google"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
}`,

    callbackUrl: `// Fix redirect issues
import { signIn } from "@airauth/next/react"

// Specify callback URL explicitly
const handleSignIn = () => {
  signIn("google", { 
    callbackUrl: "/dashboard" // or window.location.origin + "/dashboard"
  })
}`,

    serverSession: `// app/dashboard/page.tsx
import { getServerSession } from "@airauth/next/next"
import { authOptions } from "../api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/auth/signin")
  }
  
  return <div>Welcome {session.user.name}</div>
}`,

    middlewareIssue: `// middleware.ts
import { withAuth } from "@airauth/next/middleware"

export default withAuth(
  function middleware(req) {
    // Your middleware logic
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    // Don't run middleware on these paths
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}`,

    databaseIssue: `// lib/prisma.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// app/api/auth/[...nextauth]/route.ts
import { PrismaAdapter } from "@airauth/next/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  // ... rest of config
}`,

    typeErrors: `// types/next-auth.d.ts
import NextAuth from "@airauth/next"

declare module "@airauth/next" {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }

  interface User {
    role: string
  }
}

declare module "@airauth/next/jwt" {
  interface JWT {
    role: string
  }
}`,

    hydrationError: `// components/AuthStatus.tsx
"use client"

import { useSession } from "@airauth/next/react"
import { useEffect, useState } from "react"

export default function AuthStatus() {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Loading...</div>
  }

  if (status === "loading") {
    return <div>Loading...</div>
  }

  return (
    <div>
      {session ? \`Welcome \${session.user.name}\` : "Not signed in"}
    </div>
  )
}`,
  };

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl'>
            <AlertCircle className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Common Issues</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Troubleshoot common problems and find solutions for @airauth/next.
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
          <p className='text-slate-600 dark:text-slate-400'>
            This comprehensive troubleshooting guide covers the most common issues developers
            encounter when implementing @airauth/next, along with step-by-step solutions and
            prevention strategies. Find quick fixes for setup problems, configuration errors, and
            runtime issues.
          </p>
        </div>
      </motion.section>

      {/* Environment Variable Issues */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Environment Variable Issues
        </h2>

        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            ❌ "No secret provided" Error
          </h3>
          <p className='text-slate-600 dark:text-slate-400 mb-4'>
            This error occurs when{' '}
            <code className='px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-orange-600 dark:text-orange-400'>
              NEXTAUTH_SECRET
            </code>{' '}
            is missing or invalid.
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.secretError, 'secretError')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'secretError' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.secretError}
            </SyntaxHighlighter>
          </div>
        </div>

        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            ❌ "Invalid URL" or Redirect Issues
          </h3>
          <p className='text-slate-600 dark:text-slate-400 mb-4'>
            Fix URL configuration issues that cause redirect problems:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.urlError, 'urlError')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'urlError' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.urlError}
            </SyntaxHighlighter>
          </div>
        </div>
      </motion.section>

      {/* Session Problems */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Session & JWT Problems
        </h2>

        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            ❌ Session Not Persisting or JWT Errors
          </h3>
          <p className='text-slate-600 dark:text-slate-400 mb-4'>
            Fix session configuration issues:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.sessionIssue, 'sessionIssue')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'sessionIssue' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.sessionIssue}
            </SyntaxHighlighter>
          </div>
        </div>
      </motion.section>

      {/* Provider Issues */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          OAuth Provider Issues
        </h2>

        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            ❌ "OAuth Error" or "Invalid Client"
          </h3>
          <p className='text-slate-600 dark:text-slate-400 mb-4'>
            Common fixes for OAuth provider configuration:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.providerConfig, 'providerConfig')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'providerConfig' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.providerConfig}
            </SyntaxHighlighter>
          </div>
          <div className='mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg'>
            <h4 className='font-semibold text-amber-900 dark:text-amber-400 mb-2'>
              Common Provider Issues:
            </h4>
            <ul className='text-sm text-amber-800 dark:text-amber-300 space-y-1'>
              <li>• Verify client ID and secret are correct</li>
              <li>• Check redirect URIs in provider console</li>
              <li>
                • Ensure callback URL matches: <code>/api/auth/callback/[provider]</code>
              </li>
              <li>• Verify domain is approved in provider settings</li>
            </ul>
          </div>
        </div>
      </motion.section>

      {/* Callback URL Issues */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Callback & Redirect Issues
        </h2>

        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            ❌ Not Redirecting After Sign In
          </h3>
          <p className='text-slate-600 dark:text-slate-400 mb-4'>
            Fix redirect issues by specifying callback URLs explicitly:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.callbackUrl, 'callbackUrl')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'callbackUrl' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.callbackUrl}
            </SyntaxHighlighter>
          </div>
        </div>
      </motion.section>

      {/* Server Component Issues */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Server Component Issues
        </h2>

        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            ❌ "getServerSession" Returns Null
          </h3>
          <p className='text-slate-600 dark:text-slate-400 mb-4'>
            Ensure proper server session configuration:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.serverSession, 'serverSession')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'serverSession' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.serverSession}
            </SyntaxHighlighter>
          </div>
        </div>
      </motion.section>

      {/* Middleware Issues */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Middleware Issues
        </h2>

        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            ❌ Middleware Not Working or Infinite Redirects
          </h3>
          <p className='text-slate-600 dark:text-slate-400 mb-4'>
            Fix middleware configuration issues:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.middlewareIssue, 'middlewareIssue')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'middlewareIssue' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.middlewareIssue}
            </SyntaxHighlighter>
          </div>
        </div>
      </motion.section>

      {/* Database Issues */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Database Connection Issues
        </h2>

        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            ❌ Database Connection Errors with Prisma
          </h3>
          <p className='text-slate-600 dark:text-slate-400 mb-4'>
            Fix Prisma connection issues in serverless environments:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.databaseIssue, 'databaseIssue')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'databaseIssue' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.databaseIssue}
            </SyntaxHighlighter>
          </div>
        </div>
      </motion.section>

      {/* TypeScript Issues */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          TypeScript Issues
        </h2>

        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            ❌ TypeScript Errors with Session Types
          </h3>
          <p className='text-slate-600 dark:text-slate-400 mb-4'>
            Extend NextAuth types for custom user properties:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.typeErrors, 'typeErrors')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'typeErrors' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.typeErrors}
            </SyntaxHighlighter>
          </div>
        </div>
      </motion.section>

      {/* Hydration Issues */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Hydration Issues
        </h2>

        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            ❌ Hydration Mismatch with useSession
          </h3>
          <p className='text-slate-600 dark:text-slate-400 mb-4'>
            Prevent hydration errors when using session data:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.hydrationError, 'hydrationError')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'hydrationError' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.hydrationError}
            </SyntaxHighlighter>
          </div>
        </div>
      </motion.section>

      {/* Quick Troubleshooting */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Quick Troubleshooting Checklist
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6'>
            <h3 className='font-semibold text-green-900 dark:text-green-400 mb-3'>
              ✅ Environment Setup
            </h3>
            <ul className='space-y-2 text-sm text-green-800 dark:text-green-300'>
              <li>• NEXTAUTH_SECRET is set and secure</li>
              <li>• NEXTAUTH_URL matches your domain</li>
              <li>• Provider credentials are correct</li>
              <li>• Environment variables are loaded</li>
            </ul>
          </div>
          <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6'>
            <h3 className='font-semibold text-blue-900 dark:text-blue-400 mb-3'>
              🔧 Configuration
            </h3>
            <ul className='space-y-2 text-sm text-blue-800 dark:text-blue-300'>
              <li>• API route is at /api/auth/[...nextauth]</li>
              <li>• SessionProvider wraps your app</li>
              <li>• Callback URLs are configured</li>
              <li>• Database schemas are up to date</li>
            </ul>
          </div>
        </div>
      </motion.section>

      {/* Related Links */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Related Documentation
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <a
            href='/docs/installation'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Installation</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Setup and installation guide
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/configuration'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Configuration</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Configuration best practices
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/providers'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Providers</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>OAuth provider setup</p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/database-adapters'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Database Adapters</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Database integration help
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
