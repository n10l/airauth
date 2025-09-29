'use client';

import { motion } from 'framer-motion';
import { Layers, Route, Shield, Zap, Check, Copy, ArrowRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function MiddlewarePage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    basic: `// middleware.ts - Basic middleware setup
import { withAuth } from "@airauth/next/middleware"

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
})

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"]
}`,

    advanced: `// middleware.ts - Advanced middleware with role checking
import { withAuth } from "@airauth/next/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Log access attempts
    console.log(\`User \${token?.email} accessing \${pathname}\`)

    // Admin routes protection
    if (pathname.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.rewrite(new URL("/unauthorized", req.url))
    }

    // Premium content protection
    if (pathname.startsWith("/premium") && token?.plan !== "premium") {
      return NextResponse.redirect(new URL("/upgrade", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow public pages
        if (pathname.startsWith("/public")) return true
        
        // Require authentication for protected routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/premium/:path*",
    "/api/protected/:path*"
  ]
}`,

    conditional: `// middleware.ts - Conditional middleware execution
import { withAuth } from "@airauth/next/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Rate limiting for API routes
    if (pathname.startsWith("/api/")) {
      // Add rate limiting headers
      const response = NextResponse.next()
      response.headers.set("X-RateLimit-Limit", "100")
      response.headers.set("X-User-ID", token?.sub || "anonymous")
      return response
    }

    // Maintenance mode
    if (process.env.MAINTENANCE_MODE === "true" && token?.role !== "admin") {
      return NextResponse.rewrite(new URL("/maintenance", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Always allow maintenance page
        if (pathname === "/maintenance") return true
        
        // During maintenance, only allow admins
        if (process.env.MAINTENANCE_MODE === "true") {
          return token?.role === "admin"
        }
        
        return !!token
      },
    },
  }
)`,

    redirect: `// middleware.ts - Custom redirects based on user state
import { withAuth } from "@airauth/next/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Redirect incomplete profiles
    if (token && !token.profileComplete && !pathname.startsWith("/complete-profile")) {
      return NextResponse.redirect(new URL("/complete-profile", req.url))
    }

    // Redirect banned users
    if (token?.banned) {
      return NextResponse.redirect(new URL("/account-suspended", req.url))
    }

    // Redirect to appropriate dashboard based on role
    if (pathname === "/dashboard") {
      if (token?.role === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url))
      } else if (token?.role === "user") {
        return NextResponse.redirect(new URL("/user/dashboard", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow account-related pages for banned users
        if (pathname.startsWith("/account-")) return true
        
        // Block banned users from other pages
        if (token?.banned) return false
        
        return !!token
      },
    },
  }
)`,

    apiProtection: `// middleware.ts - API route protection with different strategies
import { withAuth } from "@airauth/next/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // API key validation for public APIs
    if (pathname.startsWith("/api/public/")) {
      const apiKey = req.headers.get("x-api-key")
      if (!apiKey || !isValidApiKey(apiKey)) {
        return NextResponse.json(
          { error: "Invalid API key" },
          { status: 401 }
        )
      }
    }

    // Webhook validation
    if (pathname.startsWith("/api/webhooks/")) {
      const signature = req.headers.get("x-webhook-signature")
      if (!signature || !validateWebhookSignature(req, signature)) {
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 401 }
        )
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Public APIs don't need user auth
        if (pathname.startsWith("/api/public/")) return true
        if (pathname.startsWith("/api/webhooks/")) return true
        
        // Protected APIs need authentication
        return !!token
      },
    },
  }
)

function isValidApiKey(apiKey: string): boolean {
  // Implement your API key validation logic
  return apiKey === process.env.API_KEY
}

function validateWebhookSignature(req: any, signature: string): boolean {
  // Implement webhook signature validation
  return true
}`,
  };

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl'>
            <Layers className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Middleware</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Implement powerful route protection and request handling with @airauth/next middleware.
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
            @airauth/next middleware runs at the edge before pages are rendered, providing efficient
            authentication checks and request handling. It's perfect for protecting routes,
            redirecting users, and adding custom logic based on authentication state.
          </p>
        </div>

        {/* Key Features */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-6'>
          <div className='p-4 bg-slate-100 dark:bg-slate-800 rounded-lg'>
            <Zap className='w-5 h-5 text-orange-600 mb-2' />
            <h3 className='font-semibold text-slate-900 dark:text-white mb-1'>Edge Performance</h3>
            <p className='text-sm text-slate-600 dark:text-slate-400'>
              Runs at the edge for fast response times
            </p>
          </div>
          <div className='p-4 bg-slate-100 dark:bg-slate-800 rounded-lg'>
            <Shield className='w-5 h-5 text-green-600 mb-2' />
            <h3 className='font-semibold text-slate-900 dark:text-white mb-1'>Route Protection</h3>
            <p className='text-sm text-slate-600 dark:text-slate-400'>
              Protect multiple routes with pattern matching
            </p>
          </div>
          <div className='p-4 bg-slate-100 dark:bg-slate-800 rounded-lg'>
            <Route className='w-5 h-5 text-blue-600 mb-2' />
            <h3 className='font-semibold text-slate-900 dark:text-white mb-1'>Custom Logic</h3>
            <p className='text-sm text-slate-600 dark:text-slate-400'>
              Add redirects, headers, and custom handling
            </p>
          </div>
        </div>
      </motion.section>

      {/* Basic Usage */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>Basic Usage</h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Create a simple middleware to protect your routes:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.basic, 'basic')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'basic' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.basic}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Advanced Configuration */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Advanced Configuration
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Implement role-based access control and custom logic:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.advanced, 'advanced')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'advanced' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.advanced}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Conditional Middleware */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Conditional Middleware
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Execute different logic based on request conditions:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.conditional, 'conditional')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'conditional' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.conditional}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Custom Redirects */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Custom Redirects
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Implement smart redirects based on user state:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.redirect, 'redirect')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'redirect' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.redirect}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* API Protection */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          API Route Protection
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Protect API routes with different authentication strategies:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.apiProtection, 'apiProtection')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'apiProtection' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.apiProtection}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Best Practices */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Best Practices
        </h2>
        <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-6'>
          <ul className='space-y-3'>
            <li className='flex items-center gap-3'>
              <div className='w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-green-600 dark:text-green-400' />
              </div>
              <span className='text-slate-700 dark:text-slate-300'>
                Use specific matchers to minimize middleware overhead
              </span>
            </li>
            <li className='flex items-center gap-3'>
              <div className='w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-green-600 dark:text-green-400' />
              </div>
              <span className='text-slate-700 dark:text-slate-300'>
                Keep middleware logic lightweight for better performance
              </span>
            </li>
            <li className='flex items-center gap-3'>
              <div className='w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-green-600 dark:text-green-400' />
              </div>
              <span className='text-slate-700 dark:text-slate-300'>
                Always return NextResponse for proper handling
              </span>
            </li>
            <li className='flex items-center gap-3'>
              <div className='w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-green-600 dark:text-green-400' />
              </div>
              <span className='text-slate-700 dark:text-slate-300'>
                Test middleware thoroughly in different scenarios
              </span>
            </li>
            <li className='flex items-center gap-3'>
              <div className='w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-green-600 dark:text-green-400' />
              </div>
              <span className='text-slate-700 dark:text-slate-300'>
                Use environment variables for feature flags
              </span>
            </li>
          </ul>
        </div>
      </motion.section>

      {/* Performance Note */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className='mb-12'
      >
        <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <Zap className='w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5' />
            <div>
              <h3 className='font-semibold text-blue-900 dark:text-blue-400 mb-2'>
                Performance Tip
              </h3>
              <p className='text-sm text-blue-800 dark:text-blue-300'>
                Middleware runs on every matched request. Keep logic minimal and use caching
                strategies where possible. Consider using database sessions for complex user data
                that changes frequently.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Related Links */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Related Documentation
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <a
            href='/docs/protected-routes'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Protected Routes</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Route protection strategies
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/sessions'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Sessions</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Session management</p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/api-routes'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>API Routes</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>API endpoint protection</p>
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
                Advanced configuration options
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
