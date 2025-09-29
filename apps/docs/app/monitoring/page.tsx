'use client';

import { motion } from 'framer-motion';
import { Activity, Check, Copy, ArrowRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function MonitoringPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    logging: `// lib/logger.ts
import { NextAuthOptions } from "@airauth/next"

export const authOptions: NextAuthOptions = {
  // ... other config
  events: {
    async signIn(message) {
      console.log("User signed in:", {
        userId: message.user.id,
        email: message.user.email,
        provider: message.account.provider,
        timestamp: new Date().toISOString()
      })
    },
    async signOut(message) {
      console.log("User signed out:", {
        userId: message.token.sub,
        timestamp: new Date().toISOString()
      })
    },
    async createUser(message) {
      console.log("New user created:", {
        userId: message.user.id,
        email: message.user.email,
        timestamp: new Date().toISOString()
      })
    }
  },
  logger: {
    error(code, metadata) {
      console.error("AUTH_ERROR:", code, metadata)
    },
    warn(code) {
      console.warn("AUTH_WARNING:", code)
    },
    debug(code, metadata) {
      console.log("AUTH_DEBUG:", code, metadata)
    }
  }
}`,

    analytics: `// lib/analytics.ts
import { NextAuthOptions } from "@airauth/next"

export const authOptions: NextAuthOptions = {
  // ... other config
  events: {
    async signIn(message) {
      // Track sign in events
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'user_sign_in',
          userId: message.user.id,
          provider: message.account.provider,
          timestamp: new Date().toISOString()
        })
      })
    },
    async session(message) {
      // Track active sessions
      await fetch('/api/analytics/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'session_accessed',
          userId: message.session.user.id,
          timestamp: new Date().toISOString()
        })
      })
    }
  }
}`,

    metrics: `// app/api/metrics/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "@airauth/next/next"
import { authOptions } from "../auth/[...nextauth]/route"

// Simple in-memory metrics (use Redis in production)
const metrics = {
  totalSessions: 0,
  activeSessions: new Set(),
  signInAttempts: 0,
  errors: 0
}

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({
    totalSessions: metrics.totalSessions,
    activeSessions: metrics.activeSessions.size,
    signInAttempts: metrics.signInAttempts,
    errors: metrics.errors,
    uptime: process.uptime()
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { event, userId } = body

  switch (event) {
    case 'session_created':
      metrics.totalSessions++
      metrics.activeSessions.add(userId)
      break
    case 'session_ended':
      metrics.activeSessions.delete(userId)
      break
    case 'sign_in_attempt':
      metrics.signInAttempts++
      break
    case 'error':
      metrics.errors++
      break
  }

  return NextResponse.json({ success: true })
}`,
  };

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl'>
            <Activity className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Monitoring</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Monitor authentication events, track user behavior, and ensure system health.
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
            Effective monitoring of your authentication system helps identify issues early,
            understand user behavior, and maintain security. @airauth/next provides built-in logging
            capabilities and event hooks for comprehensive monitoring.
          </p>
        </div>
      </motion.section>

      {/* Event Logging */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Event Logging
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Configure comprehensive logging for authentication events:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.logging, 'logging')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'logging' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.logging}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Analytics Integration */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Analytics Integration
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Track authentication events for analytics and user behavior analysis:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.analytics, 'analytics')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'analytics' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.analytics}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Metrics API */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>Metrics API</h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Create an API endpoint to expose authentication metrics:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.metrics, 'metrics')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'metrics' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.metrics}
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
          Monitoring Best Practices
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-6'>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-3'>Key Metrics</h3>
            <ul className='space-y-2 text-sm text-slate-600 dark:text-slate-400'>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Authentication success/failure rates
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Active session count
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Provider performance metrics
              </li>
            </ul>
          </div>
          <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-6'>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-3'>Alerting</h3>
            <ul className='space-y-2 text-sm text-slate-600 dark:text-slate-400'>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                High error rates
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Suspicious login patterns
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                System availability issues
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
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Related Documentation
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <a
            href='/docs/rate-limiting'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Rate Limiting</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                API protection strategies
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/common-issues'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Common Issues</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Troubleshooting guide</p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
