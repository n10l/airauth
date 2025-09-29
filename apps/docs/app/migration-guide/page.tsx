'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Copy, Check, ArrowRight, FileText, Zap, Shield } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function MigrationGuidePage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    // Old v2 configuration
    v2AuthConfig: `// pages/api/auth/[...nextauth].js (v2)
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      session.user.role = token.role
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
})`,

    // New v3 configuration
    v3AuthConfig: `// app/api/auth/[...nextauth]/route.ts (v3)
import NextAuth from "@airauth/next"
import GoogleProvider from "@airauth/next/providers/google"
import GitHubProvider from "@airauth/next/providers/github"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token.role) {
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
})

export { handler as GET, handler as POST }`,

    // Session provider migration
    v2SessionProvider: `// _app.js (v2)
import { SessionProvider } from "next-auth/react"

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  )
}`,

    v3SessionProvider: `// app/layout.tsx (v3)
import { SessionProvider } from "@airauth/next/react"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}`,

    // Hook usage migration
    v2Hooks: `// Component in pages directory (v2)
import { useSession, signIn, signOut } from "next-auth/react"

function ProfilePage() {
  const { data: session, status } = useSession()
  
  if (status === "loading") return <p>Loading...</p>
  
  if (status === "unauthenticated") {
    return <button onClick={() => signIn()}>Sign in</button>
  }

  return (
    <div>
      <p>Signed in as {session.user.email}</p>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  )
}`,

    v3Hooks: `// Component in app directory (v3)
"use client"
import { useSession, signIn, signOut } from "@airauth/next/react"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  
  if (status === "loading") return <p>Loading...</p>
  
  if (status === "unauthenticated") {
    return <button onClick={() => signIn()}>Sign in</button>
  }

  return (
    <div>
      <p>Signed in as {session?.user?.email}</p>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  )
}`,

    // Middleware migration
    v2Middleware: `// middleware.js (v2)
import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Additional middleware logic
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ["/dashboard/:path*"]
}`,

    v3Middleware: `// middleware.ts (v3)
export { default } from "@airauth/next/middleware"

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/profile/:path*"
  ]
}

// For custom middleware logic:
import { withAuth } from "@airauth/next/middleware"

export default withAuth(
  function middleware(req) {
    // Your custom middleware logic here
    console.log("User token:", req.nextauth.token)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Custom authorization logic
        return !!token
      },
    },
  }
)`,

    // Package json update
    packageJsonV2: `{
  "dependencies": {
    "next": "12.3.0",
    "next-auth": "4.21.1",
    "react": "18.2.0"
  }
}`,

    packageJsonV3: `{
  "dependencies": {
    "next": "14.0.0",
    "@airauth/next": "^1.0.0",
    "react": "18.2.0"
  }
}`,

    // Environment variables
    envV2: `# .env.local (v2)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret`,

    envV3: `# .env.local (v3)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# OAuth Providers (same as v2)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret

# Optional: Database (if using database sessions)
DATABASE_URL=postgresql://user:password@localhost:5432/mydb`,

    // Server-side migration
    v2ServerSide: `// pages/dashboard.js (v2)
import { getSession } from "next-auth/react"
import { GetServerSideProps } from "next"

export default function Dashboard({ session }) {
  return <div>Welcome {session.user.name}</div>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }
  }

  return {
    props: { session },
  }
}`,

    v3ServerSide: `// app/dashboard/page.tsx (v3)
import { getServerSession } from "@airauth/next/next"
import { redirect } from "next/navigation"

export default async function Dashboard() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/signin')
  }

  return <div>Welcome {session.user?.name}</div>
}

// Or with custom auth options:
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  return <div>Welcome {session.user?.name}</div>
}`,

    // Database migration
    databaseMigration: `-- Migration SQL for session table updates
-- (Only needed if using database sessions)

-- Update session table for v3 compatibility
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS session_token VARCHAR(255);

-- Update existing sessionToken values
UPDATE sessions 
SET session_token = sessionToken 
WHERE session_token IS NULL AND sessionToken IS NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS sessions_session_token_idx 
ON sessions(session_token);

-- Optional: Remove old column after verification
-- ALTER TABLE sessions DROP COLUMN sessionToken;`,

    // TypeScript types
    typesV2: `// types/next-auth.d.ts (v2)
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: string
    }
  }
}`,

    typesV3: `// types/next-auth.d.ts (v3)
import NextAuth from "@airauth/next"

declare module "@airauth/next" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: string
    }
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
  };

  const migrationSteps = [
    { title: 'Update Dependencies', description: 'Upgrade packages and Next.js' },
    { title: 'Move API Routes', description: 'Migrate from pages to app directory' },
    { title: 'Update Imports', description: 'Change import statements' },
    { title: 'Update Session Provider', description: 'Move to app layout' },
    { title: 'Update Components', description: 'Add client directive where needed' },
    { title: 'Update Server-side Code', description: 'Migrate getServerSideProps logic' },
    { title: 'Test & Deploy', description: 'Verify functionality' },
  ];

  const breakingChanges = [
    {
      title: 'API Route Location',
      description: 'API routes moved from pages/api to app/api with route handlers',
      impact: 'High',
    },
    {
      title: 'Import Paths',
      description: "All imports changed from 'next-auth' to '@airauth/next'",
      impact: 'High',
    },
    {
      title: 'Session Provider Location',
      description: 'Provider moved from _app.js to app/layout.tsx',
      impact: 'Medium',
    },
    {
      title: 'Client Components',
      description: "Hooks require 'use client' directive in app directory",
      impact: 'Medium',
    },
    {
      title: 'Server-side Sessions',
      description: 'getSession replaced with getServerSession',
      impact: 'Medium',
    },
    {
      title: 'TypeScript Types',
      description: 'Type declarations need module name updates',
      impact: 'Low',
    },
  ];

  const troubleshooting = [
    {
      issue: "Module not found: Can't resolve 'next-auth'",
      solution: "Update all import statements to use '@airauth/next' instead of 'next-auth'",
      code: `// Change this:
import { useSession } from "next-auth/react"

// To this:
import { useSession } from "@airauth/next/react"`,
    },
    {
      issue: 'Session provider not working in app directory',
      solution: 'Make sure SessionProvider is in app/layout.tsx and wraps children',
      code: `// app/layout.tsx
import { SessionProvider } from "@airauth/next/react"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}`,
    },
    {
      issue: 'Hooks not working in components',
      solution: "Add 'use client' directive to components using NextAuth hooks",
      code: `// Add this at the top of components using hooks:
"use client"

import { useSession } from "@airauth/next/react"`,
    },
    {
      issue: 'Server-side sessions not working',
      solution: 'Use getServerSession instead of getSession',
      code: `// Change this:
import { getSession } from "next-auth/react"
const session = await getSession(context)

// To this:
import { getServerSession } from "@airauth/next/next"
const session = await getServerSession()`,
    },
  ];

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl'>
            <ArrowUpRight className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>
            Migration Guide: v2 → v3
          </h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Complete guide to migrate from NextAuth.js v2 to @airauth/next v3 with Next.js App Router.
        </p>
      </motion.div>

      {/* Overview */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          What's New in v3
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <div className='p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
            <Zap className='w-8 h-8 text-blue-600 dark:text-blue-400 mb-2' />
            <h3 className='font-semibold text-blue-900 dark:text-blue-400 mb-1'>
              App Router Support
            </h3>
            <p className='text-sm text-blue-800 dark:text-blue-300'>
              Full compatibility with Next.js 13+ App Router
            </p>
          </div>
          <div className='p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg'>
            <Shield className='w-8 h-8 text-green-600 dark:text-green-400 mb-2' />
            <h3 className='font-semibold text-green-900 dark:text-green-400 mb-1'>
              Enhanced Security
            </h3>
            <p className='text-sm text-green-800 dark:text-green-300'>
              Improved security features and CSRF protection
            </p>
          </div>
          <div className='p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-lg'>
            <FileText className='w-8 h-8 text-orange-600 dark:text-orange-400 mb-2' />
            <h3 className='font-semibold text-orange-900 dark:text-orange-400 mb-1'>
              TypeScript First
            </h3>
            <p className='text-sm text-orange-800 dark:text-orange-300'>
              Better TypeScript support and type safety
            </p>
          </div>
        </div>
      </motion.section>

      {/* Breaking Changes */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Breaking Changes
        </h2>
        <div className='space-y-4'>
          {breakingChanges.map((change, index) => (
            <div
              key={index}
              className='border border-slate-200 dark:border-slate-700 rounded-lg p-4'
            >
              <div className='flex items-start justify-between mb-2'>
                <h3 className='font-semibold text-slate-900 dark:text-white'>{change.title}</h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    change.impact === 'High'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      : change.impact === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}
                >
                  {change.impact} Impact
                </span>
              </div>
              <p className='text-slate-600 dark:text-slate-400'>{change.description}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Migration Steps */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-6'>
          Step-by-Step Migration
        </h2>

        {/* Progress Steps */}
        <div className='flex items-center justify-between mb-20 relative overflow-hidden'>
          <div className='absolute left-0 right-0 top-5 h-0.5 bg-slate-200 dark:bg-slate-700' />
          {migrationSteps.map((step, index) => (
            <div key={index} className='relative flex flex-col items-center'>
              <div className='w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold z-10'>
                {index + 1}
              </div>
              <span className='hidden sm:block absolute top-12 text-xs text-slate-600 dark:text-slate-400 text-center w-20'>
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Dependencies */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 1: Update Dependencies
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            First, uninstall next-auth and install @airauth/next along with updating Next.js:
          </p>
          <div className='relative mb-4'>
            <button
              onClick={() =>
                copyCode(
                  'npm uninstall next-auth && npm install @airauth/next@latest next@latest',
                  'uninstall'
                )
              }
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'uninstall' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded-lg'>
              npm uninstall next-auth && npm install @airauth/next@latest next@latest
            </SyntaxHighlighter>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <h4 className='font-medium text-slate-900 dark:text-white mb-2'>Before (v2)</h4>
              <div className='relative'>
                <button
                  onClick={() => copyCode(codeExamples.packageJsonV2, 'pkg-v2')}
                  className='absolute right-2 top-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors z-10'
                >
                  {copiedCode === 'pkg-v2' ? (
                    <Check className='w-3.5 h-3.5 text-green-400' />
                  ) : (
                    <Copy className='w-3.5 h-3.5 text-slate-400' />
                  )}
                </button>
                <SyntaxHighlighter
                  language='json'
                  style={vscDarkPlus}
                  className='rounded-lg text-sm'
                >
                  {codeExamples.packageJsonV2}
                </SyntaxHighlighter>
              </div>
            </div>
            <div>
              <h4 className='font-medium text-slate-900 dark:text-white mb-2'>After (v3)</h4>
              <div className='relative'>
                <button
                  onClick={() => copyCode(codeExamples.packageJsonV3, 'pkg-v3')}
                  className='absolute right-2 top-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors z-10'
                >
                  {copiedCode === 'pkg-v3' ? (
                    <Check className='w-3.5 h-3.5 text-green-400' />
                  ) : (
                    <Copy className='w-3.5 h-3.5 text-slate-400' />
                  )}
                </button>
                <SyntaxHighlighter
                  language='json'
                  style={vscDarkPlus}
                  className='rounded-lg text-sm'
                >
                  {codeExamples.packageJsonV3}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: API Routes */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 2: Move API Routes to App Directory
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Move your authentication API route from{' '}
            <code className='px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-orange-600'>
              pages/api/auth/[...nextauth].js
            </code>{' '}
            to{' '}
            <code className='px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-orange-600'>
              app/api/auth/[...nextauth]/route.ts
            </code>
            :
          </p>
          <div className='grid grid-cols-1 gap-4'>
            <div>
              <h4 className='font-medium text-slate-900 dark:text-white mb-2'>
                Before: pages/api/auth/[...nextauth].js
              </h4>
              <div className='relative'>
                <button
                  onClick={() => copyCode(codeExamples.v2AuthConfig, 'auth-v2')}
                  className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
                >
                  {copiedCode === 'auth-v2' ? (
                    <Check className='w-4 h-4 text-green-400' />
                  ) : (
                    <Copy className='w-4 h-4 text-slate-400' />
                  )}
                </button>
                <SyntaxHighlighter language='javascript' style={vscDarkPlus} className='rounded-lg'>
                  {codeExamples.v2AuthConfig}
                </SyntaxHighlighter>
              </div>
            </div>
            <div>
              <h4 className='font-medium text-slate-900 dark:text-white mb-2'>
                After: app/api/auth/[...nextauth]/route.ts
              </h4>
              <div className='relative'>
                <button
                  onClick={() => copyCode(codeExamples.v3AuthConfig, 'auth-v3')}
                  className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
                >
                  {copiedCode === 'auth-v3' ? (
                    <Check className='w-4 h-4 text-green-400' />
                  ) : (
                    <Copy className='w-4 h-4 text-slate-400' />
                  )}
                </button>
                <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                  {codeExamples.v3AuthConfig}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Session Provider */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 3: Update Session Provider
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Move the SessionProvider from{' '}
            <code className='px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-orange-600'>
              _app.js
            </code>{' '}
            to{' '}
            <code className='px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-orange-600'>
              app/layout.tsx
            </code>
            :
          </p>
          <div className='grid grid-cols-1 gap-4'>
            <div>
              <h4 className='font-medium text-slate-900 dark:text-white mb-2'>Before: _app.js</h4>
              <div className='relative'>
                <button
                  onClick={() => copyCode(codeExamples.v2SessionProvider, 'session-v2')}
                  className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
                >
                  {copiedCode === 'session-v2' ? (
                    <Check className='w-4 h-4 text-green-400' />
                  ) : (
                    <Copy className='w-4 h-4 text-slate-400' />
                  )}
                </button>
                <SyntaxHighlighter language='javascript' style={vscDarkPlus} className='rounded-lg'>
                  {codeExamples.v2SessionProvider}
                </SyntaxHighlighter>
              </div>
            </div>
            <div>
              <h4 className='font-medium text-slate-900 dark:text-white mb-2'>
                After: app/layout.tsx
              </h4>
              <div className='relative'>
                <button
                  onClick={() => copyCode(codeExamples.v3SessionProvider, 'session-v3')}
                  className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
                >
                  {copiedCode === 'session-v3' ? (
                    <Check className='w-4 h-4 text-green-400' />
                  ) : (
                    <Copy className='w-4 h-4 text-slate-400' />
                  )}
                </button>
                <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                  {codeExamples.v3SessionProvider}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Component Updates */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 4: Update Components
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Add the{' '}
            <code className='px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-orange-600'>
              "use client"
            </code>{' '}
            directive to components using NextAuth hooks:
          </p>
          <div className='grid grid-cols-1 gap-4'>
            <div>
              <h4 className='font-medium text-slate-900 dark:text-white mb-2'>
                Before: pages/profile.js
              </h4>
              <div className='relative'>
                <button
                  onClick={() => copyCode(codeExamples.v2Hooks, 'hooks-v2')}
                  className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
                >
                  {copiedCode === 'hooks-v2' ? (
                    <Check className='w-4 h-4 text-green-400' />
                  ) : (
                    <Copy className='w-4 h-4 text-slate-400' />
                  )}
                </button>
                <SyntaxHighlighter language='javascript' style={vscDarkPlus} className='rounded-lg'>
                  {codeExamples.v2Hooks}
                </SyntaxHighlighter>
              </div>
            </div>
            <div>
              <h4 className='font-medium text-slate-900 dark:text-white mb-2'>
                After: app/profile/page.tsx
              </h4>
              <div className='relative'>
                <button
                  onClick={() => copyCode(codeExamples.v3Hooks, 'hooks-v3')}
                  className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
                >
                  {copiedCode === 'hooks-v3' ? (
                    <Check className='w-4 h-4 text-green-400' />
                  ) : (
                    <Copy className='w-4 h-4 text-slate-400' />
                  )}
                </button>
                <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                  {codeExamples.v3Hooks}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Server-side Code */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 5: Update Server-side Code
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Replace{' '}
            <code className='px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-orange-600'>
              getServerSideProps
            </code>{' '}
            with server components and{' '}
            <code className='px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-orange-600'>
              getServerSession
            </code>
            :
          </p>
          <div className='grid grid-cols-1 gap-4'>
            <div>
              <h4 className='font-medium text-slate-900 dark:text-white mb-2'>
                Before: pages/dashboard.js
              </h4>
              <div className='relative'>
                <button
                  onClick={() => copyCode(codeExamples.v2ServerSide, 'server-v2')}
                  className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
                >
                  {copiedCode === 'server-v2' ? (
                    <Check className='w-4 h-4 text-green-400' />
                  ) : (
                    <Copy className='w-4 h-4 text-slate-400' />
                  )}
                </button>
                <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                  {codeExamples.v2ServerSide}
                </SyntaxHighlighter>
              </div>
            </div>
            <div>
              <h4 className='font-medium text-slate-900 dark:text-white mb-2'>
                After: app/dashboard/page.tsx
              </h4>
              <div className='relative'>
                <button
                  onClick={() => copyCode(codeExamples.v3ServerSide, 'server-v3')}
                  className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
                >
                  {copiedCode === 'server-v3' ? (
                    <Check className='w-4 h-4 text-green-400' />
                  ) : (
                    <Copy className='w-4 h-4 text-slate-400' />
                  )}
                </button>
                <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                  {codeExamples.v3ServerSide}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        </div>

        {/* Step 6: Middleware */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 6: Update Middleware (Optional)
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Update your middleware imports and configuration:
          </p>
          <div className='grid grid-cols-1 gap-4'>
            <div>
              <h4 className='font-medium text-slate-900 dark:text-white mb-2'>
                Before: middleware.js
              </h4>
              <div className='relative'>
                <button
                  onClick={() => copyCode(codeExamples.v2Middleware, 'middleware-v2')}
                  className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
                >
                  {copiedCode === 'middleware-v2' ? (
                    <Check className='w-4 h-4 text-green-400' />
                  ) : (
                    <Copy className='w-4 h-4 text-slate-400' />
                  )}
                </button>
                <SyntaxHighlighter language='javascript' style={vscDarkPlus} className='rounded-lg'>
                  {codeExamples.v2Middleware}
                </SyntaxHighlighter>
              </div>
            </div>
            <div>
              <h4 className='font-medium text-slate-900 dark:text-white mb-2'>
                After: middleware.ts
              </h4>
              <div className='relative'>
                <button
                  onClick={() => copyCode(codeExamples.v3Middleware, 'middleware-v3')}
                  className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
                >
                  {copiedCode === 'middleware-v3' ? (
                    <Check className='w-4 h-4 text-green-400' />
                  ) : (
                    <Copy className='w-4 h-4 text-slate-400' />
                  )}
                </button>
                <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                  {codeExamples.v3Middleware}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        </div>

        {/* Step 7: TypeScript Types */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 7: Update TypeScript Types
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Update your type declarations to use the new module names:
          </p>
          <div className='grid grid-cols-1 gap-4'>
            <div>
              <h4 className='font-medium text-slate-900 dark:text-white mb-2'>
                Before: types/next-auth.d.ts
              </h4>
              <div className='relative'>
                <button
                  onClick={() => copyCode(codeExamples.typesV2, 'types-v2')}
                  className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
                >
                  {copiedCode === 'types-v2' ? (
                    <Check className='w-4 h-4 text-green-400' />
                  ) : (
                    <Copy className='w-4 h-4 text-slate-400' />
                  )}
                </button>
                <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                  {codeExamples.typesV2}
                </SyntaxHighlighter>
              </div>
            </div>
            <div>
              <h4 className='font-medium text-slate-900 dark:text-white mb-2'>
                After: types/next-auth.d.ts
              </h4>
              <div className='relative'>
                <button
                  onClick={() => copyCode(codeExamples.typesV3, 'types-v3')}
                  className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
                >
                  {copiedCode === 'types-v3' ? (
                    <Check className='w-4 h-4 text-green-400' />
                  ) : (
                    <Copy className='w-4 h-4 text-slate-400' />
                  )}
                </button>
                <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                  {codeExamples.typesV3}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Database Migration */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Database Migration
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          If you're using database sessions, you may need to update your database schema:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.databaseMigration, 'db-migration')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'db-migration' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='sql' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.databaseMigration}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Troubleshooting */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Common Issues & Troubleshooting
        </h2>
        <div className='space-y-6'>
          {troubleshooting.map((item, index) => (
            <div
              key={index}
              className='border border-slate-200 dark:border-slate-700 rounded-lg p-6'
            >
              <h3 className='font-semibold text-slate-900 dark:text-white mb-2'>{item.issue}</h3>
              <p className='text-slate-600 dark:text-slate-400 mb-3'>{item.solution}</p>
              <div className='relative'>
                <button
                  onClick={() => copyCode(item.code, `troubleshoot-${index}`)}
                  className='absolute right-2 top-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors z-10'
                >
                  {copiedCode === `troubleshoot-${index}` ? (
                    <Check className='w-3.5 h-3.5 text-green-400' />
                  ) : (
                    <Copy className='w-3.5 h-3.5 text-slate-400' />
                  )}
                </button>
                <SyntaxHighlighter
                  language='typescript'
                  style={vscDarkPlus}
                  className='rounded-lg text-sm'
                >
                  {item.code}
                </SyntaxHighlighter>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Verification Checklist */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Migration Checklist
        </h2>
        <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-6'>
          <div className='space-y-3'>
            {[
              'Uninstalled next-auth and installed @airauth/next',
              'Updated Next.js to version 13.4+',
              'Moved API routes from pages to app directory',
              'Updated all import statements to use @airauth/next',
              "Added 'use client' directive to components using hooks",
              'Moved SessionProvider to app/layout.tsx',
              'Updated server-side code to use getServerSession',
              'Updated middleware imports and configuration',
              'Updated TypeScript type declarations',
              'Tested sign-in and sign-out functionality',
              'Verified protected routes work correctly',
              'Tested session persistence across page reloads',
            ].map((item, index) => (
              <label key={index} className='flex items-center gap-3 cursor-pointer'>
                <input
                  type='checkbox'
                  className='w-4 h-4 text-purple-600 rounded focus:ring-purple-500'
                />
                <span className='text-slate-700 dark:text-slate-300'>{item}</span>
              </label>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Next Steps */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>Next Steps</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <a
            href='/docs/configuration'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Configuration</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Explore advanced configuration options
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
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Set up additional authentication providers
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/nextjs-config'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Next.js Configuration</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Optimize your Next.js setup
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/deployment'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Deployment</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Deploy your updated application
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
