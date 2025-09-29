'use client';

import { motion } from 'framer-motion';
import { Download, CheckCircle, Copy, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function InstallationPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    npm: `npm install @airauth/next`,
    yarn: `yarn add @airauth/next`,
    pnpm: `pnpm add @airauth/next`,
    envLocal: `NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret`,
    authConfig: `// app/api/auth/[...nextauth]/route.ts
import NextAuth from "@airauth/next"
import GoogleProvider from "@airauth/next/providers/google"
import GithubProvider from "@airauth/next/providers/github"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
})

export { handler as GET, handler as POST }`,
    sessionProvider: `// app/layout.tsx
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
    middleware: `// middleware.ts
export { default } from "@airauth/next/middleware"

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"]
}`,
  };

  const steps = [
    {
      title: 'Install the package',
      description: 'Choose your preferred package manager',
    },
    {
      title: 'Set up environment variables',
      description: 'Configure your authentication secrets',
    },
    {
      title: 'Create API route',
      description: 'Set up the authentication handler',
    },
    {
      title: 'Add SessionProvider',
      description: 'Wrap your app with the session provider',
    },
    {
      title: 'Configure middleware',
      description: 'Protect your routes (optional)',
    },
  ];

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl'>
            <Download className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Installation</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Get @airauth/next up and running in your Next.js application in just a few minutes.
        </p>
      </motion.div>

      {/* Prerequisites */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Prerequisites
        </h2>
        <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-4'>
          <ul className='space-y-2'>
            <li className='flex items-center gap-2'>
              <CheckCircle className='w-5 h-5 text-green-600' />
              <span className='text-slate-700 dark:text-slate-300'>
                Next.js 13.4 or later (with App Router)
              </span>
            </li>
            <li className='flex items-center gap-2'>
              <CheckCircle className='w-5 h-5 text-green-600' />
              <span className='text-slate-700 dark:text-slate-300'>React 18 or later</span>
            </li>
            <li className='flex items-center gap-2'>
              <CheckCircle className='w-5 h-5 text-green-600' />
              <span className='text-slate-700 dark:text-slate-300'>Node.js 18.17 or later</span>
            </li>
          </ul>
        </div>
      </motion.section>

      {/* Installation Steps */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-6'>
          Installation Steps
        </h2>

        {/* Progress Steps */}
        <div className='flex items-center justify-between mb-20 relative'>
          <div className='absolute left-0 right-0 top-5 h-0.5 bg-slate-200 dark:bg-slate-700' />
          {steps.map((step, index) => (
            <div key={index} className='relative flex flex-col items-center'>
              <div className='w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-semibold z-10'>
                {index + 1}
              </div>
              <span className='hidden sm:block absolute top-12 text-xs text-slate-600 dark:text-slate-400 text-center w-24'>
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Install */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 1: Install the package
          </h3>
          <div className='space-y-3'>
            <div className='relative'>
              <div className='absolute top-2 right-2 flex gap-2'>
                <span className='text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded'>npm</span>
                <button
                  onClick={() => copyCode(codeExamples.npm, 'npm')}
                  className='p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors'
                >
                  {copiedCode === 'npm' ? (
                    <Check className='w-3.5 h-3.5 text-green-400' />
                  ) : (
                    <Copy className='w-3.5 h-3.5 text-slate-400' />
                  )}
                </button>
              </div>
              <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.npm}
              </SyntaxHighlighter>
            </div>
            <div className='relative'>
              <div className='absolute top-2 right-2 flex gap-2'>
                <span className='text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded'>yarn</span>
                <button
                  onClick={() => copyCode(codeExamples.yarn, 'yarn')}
                  className='p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors'
                >
                  {copiedCode === 'yarn' ? (
                    <Check className='w-3.5 h-3.5 text-green-400' />
                  ) : (
                    <Copy className='w-3.5 h-3.5 text-slate-400' />
                  )}
                </button>
              </div>
              <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.yarn}
              </SyntaxHighlighter>
            </div>
            <div className='relative'>
              <div className='absolute top-2 right-2 flex gap-2'>
                <span className='text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded'>pnpm</span>
                <button
                  onClick={() => copyCode(codeExamples.pnpm, 'pnpm')}
                  className='p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors'
                >
                  {copiedCode === 'pnpm' ? (
                    <Check className='w-3.5 h-3.5 text-green-400' />
                  ) : (
                    <Copy className='w-3.5 h-3.5 text-slate-400' />
                  )}
                </button>
              </div>
              <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.pnpm}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>

        {/* Step 2: Environment Variables */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 2: Set up environment variables
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Create a{' '}
            <code className='px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-orange-600 dark:text-orange-400'>
              .env.local
            </code>{' '}
            file in your project root:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.envLocal, 'env')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'env' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.envLocal}
            </SyntaxHighlighter>
          </div>
          <div className='mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg'>
            <div className='flex items-start gap-2'>
              <AlertTriangle className='w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5' />
              <div className='text-sm'>
                <p className='font-semibold text-amber-900 dark:text-amber-400 mb-1'>Important</p>
                <p className='text-amber-800 dark:text-amber-300'>
                  Generate a secure secret using:{' '}
                  <code className='px-1 py-0.5 bg-amber-100 dark:bg-amber-900 rounded'>
                    openssl rand -base64 32
                  </code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: API Route */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 3: Create API route
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Create the authentication handler in your app directory:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.authConfig, 'auth')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'auth' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.authConfig}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Step 4: SessionProvider */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 4: Add SessionProvider
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Wrap your application with the SessionProvider:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.sessionProvider, 'session')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'session' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.sessionProvider}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Step 5: Middleware (Optional) */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 5: Configure middleware (Optional)
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Protect specific routes with middleware:
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
        </div>
      </motion.section>

      {/* Next Steps */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
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
                Learn about configuration options
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
                Set up authentication providers
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
              <p className='text-sm text-slate-600 dark:text-slate-400'>Manage user sessions</p>
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
                Secure your application routes
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
