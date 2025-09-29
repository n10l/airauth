'use client';

import { motion } from 'framer-motion';
import { Clock, Database, Zap, Check, Copy, ArrowRight, AlertTriangle } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function SessionsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    jwt: `// JWT Session Configuration
export const authOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
}`,

    database: `// Database Session Configuration
import { PrismaAdapter } from "@airauth/next/prisma-adapter"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
}`,

    useSession: `// Using sessions in client components
"use client"
import { useSession, signIn, signOut } from "@airauth/next/react"

export default function Component() {
  const { data: session, status } = useSession()

  if (status === "loading") return <p>Loading...</p>

  if (session) {
    return (
      <>
        <p>Signed in as {session.user.email}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </>
    )
  }

  return (
    <>
      <p>Not signed in</p>
      <button onClick={() => signIn()}>Sign in</button>
    </>
  )
}`,

    getServerSession: `// Using sessions in server components
import { getServerSession } from "@airauth/next"
import { authOptions } from "./api/auth/[...nextauth]/route"

export default async function ServerComponent() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return <p>You are not signed in</p>
  }

  return (
    <div>
      <p>Welcome, {session.user.name}!</p>
      <p>Email: {session.user.email}</p>
    </div>
  )
}`,

    middleware: `// Protecting pages with middleware
import { withAuth } from "@airauth/next/middleware"

export default withAuth(
  function middleware(req) {
    // Additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"]
}`,

    sessionCallback: `// Customizing session data
callbacks: {
  async session({ session, token, user }) {
    // Send properties to the client
    session.user.id = token.sub
    session.user.role = user.role
    session.accessToken = token.accessToken
    
    return session
  },
  async jwt({ token, user, account, profile }) {
    // Persist additional data to the token
    if (user) {
      token.role = user.role
    }
    if (account) {
      token.accessToken = account.access_token
    }
    return token
  }
}`,

    sessionProvider: `// Session Provider setup
"use client"
import { SessionProvider } from "@airauth/next/react"

export default function RootLayout({
  children,
  session,
}: {
  children: React.ReactNode
  session: any
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}`,
  };

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl'>
            <Clock className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Sessions</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Manage user sessions with JWT or database storage strategies using @airauth/next.
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
            @airauth/next supports two session strategies: JWT-based sessions stored in HTTP-only
            cookies, and database sessions stored in your database. Each approach has its own
            benefits and use cases.
          </p>
        </div>

        {/* Strategy Comparison */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'>
          <div className='p-4 bg-slate-100 dark:bg-slate-800 rounded-lg'>
            <div className='flex items-center gap-2 mb-3'>
              <Zap className='w-5 h-5 text-orange-600' />
              <h3 className='font-semibold text-slate-900 dark:text-white'>JWT Sessions</h3>
            </div>
            <ul className='text-sm text-slate-600 dark:text-slate-400 space-y-1'>
              <li>• Stateless (no database required)</li>
              <li>• Fast and scalable</li>
              <li>• Self-contained tokens</li>
              <li>• Limited size (4KB cookie limit)</li>
            </ul>
          </div>
          <div className='p-4 bg-slate-100 dark:bg-slate-800 rounded-lg'>
            <div className='flex items-center gap-2 mb-3'>
              <Database className='w-5 h-5 text-blue-600' />
              <h3 className='font-semibold text-slate-900 dark:text-white'>Database Sessions</h3>
            </div>
            <ul className='text-sm text-slate-600 dark:text-slate-400 space-y-1'>
              <li>• Stateful (requires database)</li>
              <li>• Can store large amounts of data</li>
              <li>• Easy to invalidate sessions</li>
              <li>• Better for sensitive data</li>
            </ul>
          </div>
        </div>
      </motion.section>

      {/* JWT Sessions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>JWT Sessions</h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          JWT sessions are stored in HTTP-only cookies and contain all session data. This is the
          default strategy:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.jwt, 'jwt')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'jwt' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.jwt}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Database Sessions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Database Sessions
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Database sessions require a database adapter and store session data in the database:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.database, 'database')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'database' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.database}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Using Sessions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-6'>
          Using Sessions
        </h2>

        <div className='space-y-8'>
          {/* Client Components */}
          <div>
            <h3 className='text-xl font-semibold text-slate-900 dark:text-white mb-4'>
              Client Components
            </h3>
            <p className='text-slate-600 dark:text-slate-400 mb-4'>
              Use the{' '}
              <code className='px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-orange-600 dark:text-orange-400'>
                useSession
              </code>{' '}
              hook in client components:
            </p>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.useSession, 'useSession')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'useSession' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.useSession}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Server Components */}
          <div>
            <h3 className='text-xl font-semibold text-slate-900 dark:text-white mb-4'>
              Server Components
            </h3>
            <p className='text-slate-600 dark:text-slate-400 mb-4'>
              Use{' '}
              <code className='px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-orange-600 dark:text-orange-400'>
                getServerSession
              </code>{' '}
              in server components:
            </p>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.getServerSession, 'getServerSession')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'getServerSession' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.getServerSession}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Session Provider */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Session Provider
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Wrap your application with the SessionProvider to enable session context:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.sessionProvider, 'sessionProvider')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'sessionProvider' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.sessionProvider}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Customizing Sessions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Customizing Session Data
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Use callbacks to add custom properties to your sessions:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.sessionCallback, 'sessionCallback')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'sessionCallback' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.sessionCallback}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Security Best Practices */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Security Best Practices
        </h2>
        <div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <AlertTriangle className='w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5' />
            <div>
              <h3 className='font-semibold text-amber-900 dark:text-amber-400 mb-2'>
                Session Security Tips
              </h3>
              <ul className='space-y-2 text-sm text-amber-800 dark:text-amber-300'>
                <li className='flex items-start gap-2'>
                  <Check className='w-4 h-4 mt-0.5' />
                  <span>Set appropriate session expiration times</span>
                </li>
                <li className='flex items-start gap-2'>
                  <Check className='w-4 h-4 mt-0.5' />
                  <span>Use HTTPS to protect session cookies</span>
                </li>
                <li className='flex items-start gap-2'>
                  <Check className='w-4 h-4 mt-0.5' />
                  <span>Rotate session tokens on privilege escalation</span>
                </li>
                <li className='flex items-start gap-2'>
                  <Check className='w-4 h-4 mt-0.5' />
                  <span>Never store sensitive data in JWT tokens</span>
                </li>
                <li className='flex items-start gap-2'>
                  <Check className='w-4 h-4 mt-0.5' />
                  <span>Implement proper session cleanup</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Related Links */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Related Documentation
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <a
            href='/docs/jwt-tokens'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>JWT Tokens</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Working with JWT tokens</p>
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
                Database integration options
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/protected-routes'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Protected Routes</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Securing your application routes
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
              <p className='text-sm text-slate-600 dark:text-slate-400'>Session-based middleware</p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
