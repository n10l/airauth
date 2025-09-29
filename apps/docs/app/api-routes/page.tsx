'use client';

import { motion } from 'framer-motion';
import { Code2, Check, Copy, ArrowRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function ApiRoutesPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    basicAuth: `// app/api/auth/[...nextauth]/route.ts
import NextAuth from "@airauth/next"
import GoogleProvider from "@airauth/next/providers/google"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }`,

    protectedApi: `// app/api/protected/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@airauth/next/next"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  return NextResponse.json({
    message: "This is a protected API route",
    user: session.user,
  })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const body = await request.json()
  
  // Process the request with authenticated user
  return NextResponse.json({
    message: "Data processed successfully",
    userId: session.user.id,
    data: body,
  })
}`,

    roleBasedApi: `// app/api/admin/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@airauth/next/next"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Check user role (assumes role is stored in JWT token)
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  
  return NextResponse.json({
    message: "Admin access granted",
    adminData: "Sensitive admin information",
  })
}`,

    customCallback: `// app/api/auth/[...nextauth]/route.ts
import NextAuth from "@airauth/next"
import GoogleProvider from "@airauth/next/providers/google"
import { PrismaAdapter } from "@airauth/next/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      return session
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      console.log(\`User \${user.email} signed in via \${account.provider}\`)
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }`,

    errorHandling: `// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@airauth/next/next"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" }, 
        { status: 401 }
      )
    }
    
    // Your API logic here
    const users = await getUsersFromDatabase()
    
    return NextResponse.json({ users })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}

async function getUsersFromDatabase() {
  // Database query logic
  return []
}`,

    middleware: `// middleware.ts
import { withAuth } from "@airauth/next/middleware"

export default withAuth(
  function middleware(req) {
    // Additional middleware logic
    console.log("Authenticated request to:", req.nextUrl.pathname)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Custom authorization logic
        if (req.nextUrl.pathname.startsWith("/api/admin")) {
          return token?.role === "admin"
        }
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ["/api/protected/:path*", "/api/admin/:path*"]
}`,

    rateLimit: `// app/api/limited/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@airauth/next/next"
import { authOptions } from "../auth/[...nextauth]/route"

// Simple in-memory rate limiting (use Redis in production)
const requests = new Map()

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const userId = session.user.id
  const now = Date.now()
  const windowStart = now - 60000 // 1 minute window
  
  // Clean old requests
  const userRequests = requests.get(userId) || []
  const recentRequests = userRequests.filter(time => time > windowStart)
  
  if (recentRequests.length >= 10) { // Max 10 requests per minute
    return NextResponse.json(
      { error: "Rate limit exceeded" }, 
      { status: 429 }
    )
  }
  
  // Add current request
  recentRequests.push(now)
  requests.set(userId, recentRequests)
  
  return NextResponse.json({ message: "Request successful" })
}`,
  };

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl'>
            <Code2 className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>API Routes</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Secure your API endpoints with authentication and authorization.
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
            API routes in Next.js App Router with @airauth/next allow you to create secure
            server-side endpoints that can authenticate users, authorize access, and handle
            protected operations. This guide covers everything from basic setup to advanced patterns
            like role-based access control and rate limiting.
          </p>
        </div>
      </motion.section>

      {/* Basic Setup */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>Basic Setup</h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          First, set up the basic NextAuth.js API route handler:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.basicAuth, 'basicAuth')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'basicAuth' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.basicAuth}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Protected API Routes */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Protected API Routes
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Create API routes that require authentication using{' '}
          <code className='px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-orange-600 dark:text-orange-400'>
            getServerSession
          </code>
          :
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.protectedApi, 'protectedApi')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'protectedApi' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.protectedApi}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Role-Based Access Control */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Role-Based Access Control
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Implement role-based authorization in your API routes:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.roleBasedApi, 'roleBasedApi')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'roleBasedApi' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.roleBasedApi}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Custom Callbacks */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Custom Callbacks & Events
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Enhance your auth configuration with custom callbacks and event handlers:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.customCallback, 'customCallback')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'customCallback' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.customCallback}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Error Handling */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Error Handling
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Implement proper error handling in your protected API routes:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.errorHandling, 'errorHandling')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'errorHandling' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.errorHandling}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Middleware Protection */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Middleware Protection
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Use Next.js middleware to protect entire API route segments:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.middleware, 'middleware')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'middleware' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.middleware}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Advanced: Rate Limiting */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Rate Limiting
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Implement rate limiting for your authenticated API routes:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.rateLimit, 'rateLimit')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'rateLimit' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.rateLimit}
          </SyntaxHighlighter>
        </div>
        <div className='mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
          <p className='text-sm text-blue-800 dark:text-blue-300'>
            <strong>Note:</strong> For production applications, use a distributed cache like Redis
            for rate limiting instead of in-memory storage.
          </p>
        </div>
      </motion.section>

      {/* Best Practices */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Best Practices
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-6'>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-3'>Security</h3>
            <ul className='space-y-2 text-sm text-slate-600 dark:text-slate-400'>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Always validate session before processing requests
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Use HTTPS in production environments
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Implement proper error handling
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Validate and sanitize input data
              </li>
            </ul>
          </div>
          <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-6'>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-3'>Performance</h3>
            <ul className='space-y-2 text-sm text-slate-600 dark:text-slate-400'>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Cache session data when possible
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Implement rate limiting for public APIs
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Use middleware for route-level protection
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Minimize database queries in API routes
              </li>
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
            href='/docs/server-components'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Server Components</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Use auth in server components
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/client-components'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Client Components</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Implement client-side auth
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/middleware'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Middleware</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Route protection with middleware
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/rate-limiting'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Rate Limiting</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Implement API rate limiting
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
