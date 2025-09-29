'use client';

import { motion } from 'framer-motion';
import { Shield, Check, Copy, ArrowRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function RateLimitingPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    middleware: `// middleware.ts - Rate limiting with NextAuth
import { withAuth } from "@airauth/next/middleware"
import { NextResponse } from "next/server"

const requests = new Map()

export default withAuth(
  function middleware(req) {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    const windowMs = 15 * 60 * 1000 // 15 minutes
    const maxRequests = 100

    // Clean old entries
    const windowStart = now - windowMs
    const userRequests = requests.get(ip) || []
    const recentRequests = userRequests.filter(time => time > windowStart)

    if (recentRequests.length >= maxRequests) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      )
    }

    // Add current request
    recentRequests.push(now)
    requests.set(ip, recentRequests)

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)`,

    apiRateLimit: `// app/api/protected/route.ts - API route rate limiting
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@airauth/next/next"
import { authOptions } from "../auth/[...nextauth]/route"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const key = \`rate_limit:\${userId}\`
  const limit = 10 // requests per window
  const window = 60 // seconds

  // Get current count
  const current = await redis.incr(key)
  
  if (current === 1) {
    // First request, set expiry
    await redis.expire(key, window)
  }

  if (current > limit) {
    const ttl = await redis.ttl(key)
    return NextResponse.json(
      { 
        error: "Rate limit exceeded", 
        resetIn: ttl 
      },
      { status: 429 }
    )
  }

  // Process the request
  return NextResponse.json({ 
    message: "Request processed",
    remaining: Math.max(0, limit - current)
  })
}`,

    customHook: `// hooks/useRateLimit.ts
import { useState, useEffect } from "react"
import { useSession } from "@airauth/next/react"

interface RateLimitStatus {
  remaining: number
  resetIn: number
  isLimited: boolean
}

export function useRateLimit(endpoint: string) {
  const { data: session } = useSession()
  const [status, setStatus] = useState<RateLimitStatus>({
    remaining: 0,
    resetIn: 0,
    isLimited: false
  })

  const makeRequest = async (data?: any) => {
    if (!session) {
      throw new Error("Not authenticated")
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.status === 429) {
        const errorData = await response.json()
        setStatus({
          remaining: 0,
          resetIn: errorData.resetIn,
          isLimited: true
        })
        throw new Error("Rate limit exceeded")
      }

      const responseData = await response.json()
      setStatus({
        remaining: responseData.remaining || 0,
        resetIn: 0,
        isLimited: false
      })

      return responseData
    } catch (error) {
      throw error
    }
  }

  return { status, makeRequest }
}`,
  };

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-red-600 to-pink-600 rounded-xl'>
            <Shield className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Rate Limiting</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Implement rate limiting to protect your authenticated APIs from abuse and ensure fair
          usage.
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
            Rate limiting prevents abuse of your API by limiting the number of requests a user can
            make within a specific time window. With @airauth/next, you can implement user-based
            rate limiting that works seamlessly with your authentication system.
          </p>
        </div>
      </motion.section>

      {/* Middleware Rate Limiting */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Middleware-Based Rate Limiting
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Implement rate limiting at the middleware level for broad protection:
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

      {/* API Route Rate Limiting */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          API Route Rate Limiting
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Implement granular rate limiting using Redis for production applications:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.apiRateLimit, 'apiRateLimit')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'apiRateLimit' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.apiRateLimit}
          </SyntaxHighlighter>
        </div>
        <div className='mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
          <p className='text-sm text-blue-800 dark:text-blue-300'>
            <strong>Note:</strong> Install dependencies: <code>npm install @upstash/redis</code>
          </p>
        </div>
      </motion.section>

      {/* Client-Side Hook */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Client-Side Rate Limit Hook
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Create a custom hook to handle rate limiting on the client side:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.customHook, 'customHook')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'customHook' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.customHook}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Best Practices */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Rate Limiting Best Practices
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-6'>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-3'>Implementation</h3>
            <ul className='space-y-2 text-sm text-slate-600 dark:text-slate-400'>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Use Redis for distributed rate limiting
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Implement sliding window algorithms
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Return clear error messages with retry timing
              </li>
            </ul>
          </div>
          <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-6'>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-3'>Monitoring</h3>
            <ul className='space-y-2 text-sm text-slate-600 dark:text-slate-400'>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Log rate limit violations
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Monitor API usage patterns
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Set up alerts for abuse detection
              </li>
            </ul>
          </div>
        </div>
      </motion.section>

      {/* Related Links */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
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
              <p className='text-sm text-slate-600 dark:text-slate-400'>Secure API endpoints</p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/monitoring'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Monitoring</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Monitor your auth system</p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
