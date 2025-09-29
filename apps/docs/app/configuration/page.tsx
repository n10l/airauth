'use client';

import { motion } from 'framer-motion';
import { Settings, AlertTriangle, Check, Copy, ArrowRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function ConfigurationPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    basic: `// app/api/auth/[...nextauth]/route.ts
import NextAuth from "@airauth/next"
import GoogleProvider from "@airauth/next/providers/google"
import { PrismaAdapter } from "@airauth/next/prisma-adapter"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }`,

    callbacks: `// Advanced callback configuration
callbacks: {
  async signIn({ user, account, profile, email, credentials }) {
    // Control whether the user is allowed to sign in
    if (account.provider === "google") {
      return true
    }
    return false
  },
  
  async redirect({ url, baseUrl }) {
    // Control where to redirect after sign in
    if (url.startsWith("/")) return \`\${baseUrl}\${url}\`
    else if (new URL(url).origin === baseUrl) return url
    return baseUrl
  },
  
  async session({ session, user, token }) {
    // Send properties to the client
    session.user.id = token.sub
    session.user.role = token.role
    return session
  },
  
  async jwt({ token, user, account, profile, isNewUser }) {
    // Persist additional data to the token
    if (user) {
      token.role = user.role
    }
    return token
  }
}`,

    events: `// Event handlers
events: {
  async signIn(message) {
    console.log("User signed in:", message.user.email)
  },
  
  async signOut(message) {
    console.log("User signed out:", message.token.email)
  },
  
  async createUser(message) {
    console.log("New user created:", message.user.email)
  },
  
  async updateUser(message) {
    console.log("User updated:", message.user.email)
  },
  
  async session(message) {
    console.log("Session accessed:", message.session.user.email)
  },
}`,

    theme: `// Custom theme configuration
theme: {
  colorScheme: "dark", // "light" | "dark" | "auto"
  brandColor: "#ff6b35", // Hex color
  logo: "/logo.png", // Absolute URL to image
  buttonText: "#ffffff"
}`,

    debug: `// Debug configuration
debug: process.env.NODE_ENV === "development",
logger: {
  error(code, metadata) {
    console.error("[AUTH_ERROR]", code, metadata)
  },
  warn(code) {
    console.warn("[AUTH_WARN]", code)
  },
  debug(code, metadata) {
    console.log("[AUTH_DEBUG]", code, metadata)
  }
}`,
  };

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl'>
            <Settings className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Configuration</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Comprehensive guide to configuring @airauth/next for your application's specific needs.
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
            @airauth/next provides a flexible configuration system that allows you to customize
            authentication behavior, session handling, callbacks, and more. All configuration is
            done through the NextAuth options object.
          </p>
        </div>
      </motion.section>

      {/* Basic Configuration */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Basic Configuration
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Here's a comprehensive example of basic @airauth/next configuration:
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

      {/* Configuration Options */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-6'>
          Configuration Options
        </h2>

        <div className='space-y-8'>
          {/* Callbacks */}
          <div>
            <h3 className='text-xl font-semibold text-slate-900 dark:text-white mb-4'>Callbacks</h3>
            <p className='text-slate-600 dark:text-slate-400 mb-4'>
              Callbacks allow you to control what happens when actions are performed:
            </p>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.callbacks, 'callbacks')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'callbacks' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.callbacks}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Events */}
          <div>
            <h3 className='text-xl font-semibold text-slate-900 dark:text-white mb-4'>Events</h3>
            <p className='text-slate-600 dark:text-slate-400 mb-4'>
              Events are asynchronous functions that trigger when certain actions happen:
            </p>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.events, 'events')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'events' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.events}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Theme */}
          <div>
            <h3 className='text-xl font-semibold text-slate-900 dark:text-white mb-4'>
              Theme Customization
            </h3>
            <p className='text-slate-600 dark:text-slate-400 mb-4'>
              Customize the built-in sign-in pages:
            </p>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.theme, 'theme')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'theme' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.theme}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Debug */}
          <div>
            <h3 className='text-xl font-semibold text-slate-900 dark:text-white mb-4'>
              Debug & Logging
            </h3>
            <p className='text-slate-600 dark:text-slate-400 mb-4'>
              Enable debugging and custom logging:
            </p>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.debug, 'debug')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'debug' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.debug}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Environment Variables */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Environment Variables
        </h2>
        <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-6'>
          <div className='space-y-4'>
            <div>
              <code className='text-orange-600 dark:text-orange-400 font-mono text-sm'>
                NEXTAUTH_URL
              </code>
              <p className='text-sm text-slate-600 dark:text-slate-400 mt-1'>
                The URL of your application (required in production)
              </p>
            </div>
            <div>
              <code className='text-orange-600 dark:text-orange-400 font-mono text-sm'>
                NEXTAUTH_SECRET
              </code>
              <p className='text-sm text-slate-600 dark:text-slate-400 mt-1'>
                Secret key for encrypting JWT tokens and sessions
              </p>
            </div>
            <div>
              <code className='text-orange-600 dark:text-orange-400 font-mono text-sm'>
                NEXTAUTH_URL_INTERNAL
              </code>
              <p className='text-sm text-slate-600 dark:text-slate-400 mt-1'>
                Internal URL for server-side requests (optional)
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Security Considerations */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
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
                Security Recommendations
              </h3>
              <ul className='space-y-2 text-sm text-amber-800 dark:text-amber-300'>
                <li className='flex items-start gap-2'>
                  <Check className='w-4 h-4 mt-0.5' />
                  <span>Always use HTTPS in production</span>
                </li>
                <li className='flex items-start gap-2'>
                  <Check className='w-4 h-4 mt-0.5' />
                  <span>Keep your NEXTAUTH_SECRET secure and rotate it periodically</span>
                </li>
                <li className='flex items-start gap-2'>
                  <Check className='w-4 h-4 mt-0.5' />
                  <span>Configure appropriate session and JWT expiration times</span>
                </li>
                <li className='flex items-start gap-2'>
                  <Check className='w-4 h-4 mt-0.5' />
                  <span>Validate user permissions in your callbacks</span>
                </li>
                <li className='flex items-start gap-2'>
                  <Check className='w-4 h-4 mt-0.5' />
                  <span>Use database sessions for sensitive applications</span>
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
        transition={{ delay: 0.6 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Related Documentation
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <a
            href='/docs/providers'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Providers</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Configure authentication providers
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
                Session management and strategies
              </p>
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
            href='/docs/best-practices'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Best Practices</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Security and performance tips
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
