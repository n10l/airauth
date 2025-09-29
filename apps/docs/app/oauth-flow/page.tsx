'use client';

import { motion } from 'framer-motion';
import { Zap, Check, Copy, ArrowRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function OauthFlowPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    basicOAuth: `// app/api/auth/[...nextauth]/route.ts
import NextAuth from "@airauth/next"
import GoogleProvider from "@airauth/next/providers/google"
import GitHubProvider from "@airauth/next/providers/github"

export const authOptions = {
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
    async signIn({ user, account, profile }) {
      return true // Allow sign in
    },
    async redirect({ url, baseUrl }) {
      return baseUrl
    },
    async session({ session, token }) {
      return session
    },
    async jwt({ token, user }) {
      return token
    }
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }`,

    flowDiagram: `/**
 * OAuth 2.0 Authorization Code Flow:
 * 
 * 1. User clicks "Sign in with Provider"
 * 2. App redirects to provider's authorization server
 * 3. User authenticates with provider
 * 4. Provider redirects back with authorization code
 * 5. App exchanges code for access token
 * 6. App uses access token to fetch user profile
 * 7. Session is created and user is signed in
 */`,

    customProvider: `// Custom OAuth provider configuration
import { OAuthConfig } from "@airauth/next/providers"

export default function CustomProvider(options: any): OAuthConfig<any> {
  return {
    id: "custom",
    name: "Custom Provider",
    type: "oauth",
    authorization: {
      url: "https://provider.com/oauth/authorize",
      params: {
        scope: "read:user user:email",
        response_type: "code",
      },
    },
    token: "https://provider.com/oauth/token",
    userinfo: "https://provider.com/user",
    profile(profile) {
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        image: profile.avatar_url,
      }
    },
    options,
  }
}`,
  };

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl'>
            <Zap className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>OAuth Flow</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Understanding OAuth 2.0 authentication flow and implementation with @airauth/next.
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
            OAuth 2.0 provides secure authentication through third-party providers like Google,
            GitHub, and others. This guide explains how OAuth flows work with @airauth/next,
            including the authorization code flow, security considerations, and custom provider
            implementation.
          </p>
        </div>
      </motion.section>

      {/* OAuth Flow Overview */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          OAuth 2.0 Flow Overview
        </h2>
        <div className='bg-slate-50 dark:bg-slate-800 rounded-lg p-6 mb-6'>
          <h3 className='font-semibold text-slate-900 dark:text-white mb-4'>
            Authorization Code Flow Steps:
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold'>
                  1
                </div>
                <span className='text-sm'>User initiates sign-in</span>
              </div>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold'>
                  2
                </div>
                <span className='text-sm'>Redirect to provider</span>
              </div>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold'>
                  3
                </div>
                <span className='text-sm'>User authenticates</span>
              </div>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold'>
                  4
                </div>
                <span className='text-sm'>Authorization code returned</span>
              </div>
            </div>
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold'>
                  5
                </div>
                <span className='text-sm'>Exchange code for token</span>
              </div>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold'>
                  6
                </div>
                <span className='text-sm'>Fetch user profile</span>
              </div>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold'>
                  7
                </div>
                <span className='text-sm'>Create session</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Basic OAuth Setup */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          OAuth Provider Setup
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Configure OAuth providers with proper callbacks and security settings:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.basicOAuth, 'basicOAuth')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'basicOAuth' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.basicOAuth}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Custom Provider */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Custom OAuth Provider
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Create custom OAuth providers for services not included by default:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.customProvider, 'customProvider')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'customProvider' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.customProvider}
          </SyntaxHighlighter>
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
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6'>
            <h3 className='font-semibold text-red-900 dark:text-red-400 mb-3'>⚠️ Security Risks</h3>
            <ul className='space-y-2 text-sm text-red-800 dark:text-red-300'>
              <li>• Always validate redirect URIs</li>
              <li>• Use PKCE for public clients</li>
              <li>• Implement state parameter validation</li>
              <li>• Secure client credentials</li>
            </ul>
          </div>
          <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6'>
            <h3 className='font-semibold text-green-900 dark:text-green-400 mb-3'>
              ✅ Best Practices
            </h3>
            <ul className='space-y-2 text-sm text-green-800 dark:text-green-300'>
              <li>• Use HTTPS in production</li>
              <li>• Implement proper scope requests</li>
              <li>• Handle errors gracefully</li>
              <li>• Monitor OAuth usage</li>
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
                Get started with @airauth/next
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
                Configure your authentication
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
