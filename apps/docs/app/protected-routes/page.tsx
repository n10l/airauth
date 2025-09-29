'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Check, Copy, ArrowRight, AlertTriangle } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function ProtectedRoutesPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    middleware: `// middleware.ts - Protect routes with middleware
import { withAuth } from "@airauth/next/middleware"

export default withAuth(
  function middleware(req) {
    // Additional middleware logic here
    console.log("Authenticated user accessing:", req.nextUrl.pathname)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Return true if user is authorized
        const { pathname } = req.nextUrl
        
        // Admin routes require admin role
        if (pathname.startsWith("/admin")) {
          return token?.role === "admin"
        }
        
        // Other protected routes just need authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/profile/:path*"]
}`,

    serverComponent: `// Server Component Protection
import { getServerSession } from "@airauth/next"
import { authOptions } from "../api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/api/auth/signin")
  }

  // Check for specific permissions
  if (session.user.role !== "admin") {
    return <div>Access denied. Admin role required.</div>
  }

  return (
    <div>
      <h1>Protected Admin Dashboard</h1>
      <p>Welcome, {session.user.name}!</p>
    </div>
  )
}`,

    clientComponent: `// Client Component Protection
"use client"
import { useSession } from "@airauth/next/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ProtectedClientComponent() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push("/api/auth/signin")
      return
    }

    // Check for specific role
    if (session.user.role !== "premium") {
      router.push("/unauthorized")
      return
    }
  }, [session, status, router])

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session || session.user.role !== "premium") {
    return null // Or loading spinner
  }

  return (
    <div>
      <h1>Premium Content</h1>
      <p>This content is only for premium users!</p>
    </div>
  )
}`,

    apiRoute: `// API Route Protection
import { getServerSession } from "@airauth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json(
      { error: "You must be signed in to access this API" },
      { status: 401 }
    )
  }

  // Role-based access control
  if (session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    )
  }

  // Your protected API logic here
  return NextResponse.json({ 
    message: "This is protected data",
    user: session.user 
  })
}`,

    hoc: `// Higher-Order Component for Protection
"use client"
import { useSession } from "@airauth/next/react"
import { useRouter } from "next/navigation"
import { ComponentType, useEffect } from "react"

interface WithAuthOptions {
  requiredRole?: string
  redirectTo?: string
}

export function withAuth<P extends object>(
  Component: ComponentType<P>,
  options: WithAuthOptions = {}
) {
  return function AuthenticatedComponent(props: P) {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { requiredRole, redirectTo = "/api/auth/signin" } = options

    useEffect(() => {
      if (status === "loading") return

      if (!session) {
        router.push(redirectTo)
        return
      }

      if (requiredRole && session.user.role !== requiredRole) {
        router.push("/unauthorized")
        return
      }
    }, [session, status, router])

    if (status === "loading") {
      return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }

    if (!session || (requiredRole && session.user.role !== requiredRole)) {
      return null
    }

    return <Component {...props} />
  }
}

// Usage:
export default withAuth(DashboardComponent, { requiredRole: "admin" })`,

    routeGuard: `// Custom Route Guard Hook
"use client"
import { useSession } from "@airauth/next/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface UseRouteGuardOptions {
  requiredRole?: string
  redirectTo?: string
  allowedRoles?: string[]
}

export function useRouteGuard(options: UseRouteGuardOptions = {}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const { requiredRole, redirectTo = "/api/auth/signin", allowedRoles } = options

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push(redirectTo)
      return
    }

    // Check specific role
    if (requiredRole && session.user.role !== requiredRole) {
      router.push("/unauthorized")
      return
    }

    // Check against allowed roles list
    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
      router.push("/unauthorized")
      return
    }

    setIsAuthorized(true)
  }, [session, status, router, requiredRole, allowedRoles, redirectTo])

  return {
    session,
    status,
    isAuthorized,
    isLoading: status === "loading" || (session && !isAuthorized)
  }
}

// Usage in component:
export default function ProtectedPage() {
  const { isLoading, isAuthorized } = useRouteGuard({ 
    allowedRoles: ["admin", "moderator"] 
  })

  if (isLoading) return <div>Loading...</div>
  if (!isAuthorized) return null

  return <div>Protected content here</div>
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
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Protected Routes</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Secure your application routes and API endpoints with authentication and role-based access
          control.
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
            @airauth/next provides several methods to protect your routes and API endpoints. You can
            use middleware for server-side protection, session checking in components, or create
            custom protection patterns based on your application's needs.
          </p>
        </div>

        {/* Protection Methods */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-6'>
          <div className='p-4 bg-slate-100 dark:bg-slate-800 rounded-lg'>
            <Lock className='w-5 h-5 text-blue-600 mb-2' />
            <h3 className='font-semibold text-slate-900 dark:text-white mb-1'>Middleware</h3>
            <p className='text-sm text-slate-600 dark:text-slate-400'>
              Server-side route protection
            </p>
          </div>
          <div className='p-4 bg-slate-100 dark:bg-slate-800 rounded-lg'>
            <Eye className='w-5 h-5 text-green-600 mb-2' />
            <h3 className='font-semibold text-slate-900 dark:text-white mb-1'>Components</h3>
            <p className='text-sm text-slate-600 dark:text-slate-400'>
              Client and server component guards
            </p>
          </div>
          <div className='p-4 bg-slate-100 dark:bg-slate-800 rounded-lg'>
            <Shield className='w-5 h-5 text-purple-600 mb-2' />
            <h3 className='font-semibold text-slate-900 dark:text-white mb-1'>API Routes</h3>
            <p className='text-sm text-slate-600 dark:text-slate-400'>Secure API endpoint access</p>
          </div>
        </div>
      </motion.section>

      {/* Middleware Protection */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Middleware Protection
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Use middleware to protect entire route patterns at the edge:
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

      {/* Server Component Protection */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Server Component Protection
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Protect server components using{' '}
          <code className='px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-orange-600 dark:text-orange-400'>
            getServerSession
          </code>
          :
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.serverComponent, 'serverComponent')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'serverComponent' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.serverComponent}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Client Component Protection */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Client Component Protection
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Protect client components using the{' '}
          <code className='px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-orange-600 dark:text-orange-400'>
            useSession
          </code>{' '}
          hook:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.clientComponent, 'clientComponent')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'clientComponent' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.clientComponent}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* API Route Protection */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          API Route Protection
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Secure your API routes with session validation:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.apiRoute, 'apiRoute')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'apiRoute' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.apiRoute}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Advanced Patterns */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-6'>
          Advanced Protection Patterns
        </h2>

        <div className='space-y-8'>
          {/* Higher-Order Component */}
          <div>
            <h3 className='text-xl font-semibold text-slate-900 dark:text-white mb-4'>
              Higher-Order Component
            </h3>
            <p className='text-slate-600 dark:text-slate-400 mb-4'>
              Create reusable protection with HOCs:
            </p>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.hoc, 'hoc')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'hoc' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.hoc}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Custom Hook */}
          <div>
            <h3 className='text-xl font-semibold text-slate-900 dark:text-white mb-4'>
              Custom Route Guard Hook
            </h3>
            <p className='text-slate-600 dark:text-slate-400 mb-4'>
              Create a custom hook for flexible route protection:
            </p>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.routeGuard, 'routeGuard')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'routeGuard' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.routeGuard}
              </SyntaxHighlighter>
            </div>
          </div>
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
                Use middleware for route-level protection
              </span>
            </li>
            <li className='flex items-center gap-3'>
              <div className='w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-green-600 dark:text-green-400' />
              </div>
              <span className='text-slate-700 dark:text-slate-300'>
                Always validate sessions in API routes
              </span>
            </li>
            <li className='flex items-center gap-3'>
              <div className='w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-green-600 dark:text-green-400' />
              </div>
              <span className='text-slate-700 dark:text-slate-300'>
                Implement role-based access control (RBAC)
              </span>
            </li>
            <li className='flex items-center gap-3'>
              <div className='w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-green-600 dark:text-green-400' />
              </div>
              <span className='text-slate-700 dark:text-slate-300'>
                Show loading states during authentication checks
              </span>
            </li>
            <li className='flex items-center gap-3'>
              <div className='w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-green-600 dark:text-green-400' />
              </div>
              <span className='text-slate-700 dark:text-slate-300'>
                Handle unauthorized access gracefully
              </span>
            </li>
          </ul>
        </div>
      </motion.section>

      {/* Security Warning */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className='mb-12'
      >
        <div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <AlertTriangle className='w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5' />
            <div>
              <h3 className='font-semibold text-amber-900 dark:text-amber-400 mb-2'>
                Security Reminder
              </h3>
              <p className='text-sm text-amber-800 dark:text-amber-300'>
                Client-side protection can be bypassed by users with browser dev tools. Always
                implement server-side validation for sensitive data and operations. Use middleware
                and API route protection for security-critical features.
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
            href='/docs/middleware'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Middleware</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Advanced middleware configuration
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
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Session management and usage
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/api-routes'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>API Routes</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Securing API endpoints</p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/best-practices'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Best Practices</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Security recommendations</p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
