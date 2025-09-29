'use client';

import { motion } from 'framer-motion';
import { Key, Clock, Shield, AlertTriangle, Check, Copy, ExternalLink } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function JWTTokensPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    basic: `import { getToken } from "@airauth/next/jwt"

export default async function handler(req, res) {
  const token = await getToken({ req })
  
  if (token) {
    // Signed in
    console.log("JSON Web Token", token)
  } else {
    // Not signed in
    res.status(401)
  }
  
  res.end()
}`,
    decode: `import jwt from "@airauth/next/jwt"

const token = await jwt.decode({
  token: rawToken,
  secret: process.env.JWT_SECRET
})

console.log("Decoded JWT:", token)`,
    customClaims: `// In [...nextauth].js
export default NextAuth({
  jwt: {
    secret: process.env.JWT_SECRET,
    encode: async ({ secret, token, maxAge }) => {
      const encodedToken = jwt.sign(
        {
          ...token,
          customClaim: "customValue",
          iat: Date.now() / 1000,
          exp: Math.floor(Date.now() / 1000) + maxAge,
        },
        secret
      )
      return encodedToken
    },
  },
})`,
    refresh: `// Refresh token rotation
callbacks: {
  async jwt({ token, user, account }) {
    // Initial sign in
    if (account && user) {
      return {
        accessToken: account.access_token,
        accessTokenExpires: Date.now() + account.expires_in * 1000,
        refreshToken: account.refresh_token,
        user,
      }
    }

    // Return previous token if not expired
    if (Date.now() < token.accessTokenExpires) {
      return token
    }

    // Access token has expired, refresh it
    return refreshAccessToken(token)
  }
}`,
  };

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl'>
            <Key className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>JWT Tokens</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Learn how to work with JSON Web Tokens in @airauth/next for secure, stateless
          authentication.
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
            JSON Web Tokens (JWT) are an industry standard for securely transmitting information
            between parties as a JSON object. @airauth/next uses JWTs to maintain session state
            without requiring server-side storage.
          </p>
        </div>

        {/* Key Features */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-6'>
          <div className='p-4 bg-slate-100 dark:bg-slate-800 rounded-lg'>
            <Clock className='w-5 h-5 text-orange-600 mb-2' />
            <h3 className='font-semibold text-slate-900 dark:text-white mb-1'>Stateless</h3>
            <p className='text-sm text-slate-600 dark:text-slate-400'>
              No server-side session storage required
            </p>
          </div>
          <div className='p-4 bg-slate-100 dark:bg-slate-800 rounded-lg'>
            <Shield className='w-5 h-5 text-orange-600 mb-2' />
            <h3 className='font-semibold text-slate-900 dark:text-white mb-1'>Secure</h3>
            <p className='text-sm text-slate-600 dark:text-slate-400'>
              Signed and optionally encrypted tokens
            </p>
          </div>
          <div className='p-4 bg-slate-100 dark:bg-slate-800 rounded-lg'>
            <Key className='w-5 h-5 text-orange-600 mb-2' />
            <h3 className='font-semibold text-slate-900 dark:text-white mb-1'>Customizable</h3>
            <p className='text-sm text-slate-600 dark:text-slate-400'>
              Add custom claims and control encoding
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
          <SyntaxHighlighter language='javascript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.basic}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Decoding Tokens */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Decoding Tokens
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          You can decode and verify JWT tokens using the built-in utilities:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.decode, 'decode')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'decode' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='javascript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.decode}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Custom Claims */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Custom Claims
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Add custom claims to your JWT tokens for additional user information:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.customClaims, 'customClaims')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'customClaims' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='javascript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.customClaims}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Token Refresh */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Token Refresh
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Implement token refresh to maintain sessions without requiring re-authentication:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.refresh, 'refresh')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'refresh' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='javascript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.refresh}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Security Considerations */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Security Considerations
        </h2>
        <div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <AlertTriangle className='w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5' />
            <div>
              <h3 className='font-semibold text-amber-900 dark:text-amber-400 mb-2'>
                Important Security Notes
              </h3>
              <ul className='space-y-2 text-sm text-amber-800 dark:text-amber-300'>
                <li className='flex items-start gap-2'>
                  <Check className='w-4 h-4 mt-0.5' />
                  <span>Always use HTTPS in production to prevent token interception</span>
                </li>
                <li className='flex items-start gap-2'>
                  <Check className='w-4 h-4 mt-0.5' />
                  <span>Store JWT secret securely and rotate it periodically</span>
                </li>
                <li className='flex items-start gap-2'>
                  <Check className='w-4 h-4 mt-0.5' />
                  <span>Set appropriate token expiration times</span>
                </li>
                <li className='flex items-start gap-2'>
                  <Check className='w-4 h-4 mt-0.5' />
                  <span>
                    Never store sensitive data in JWT payload (it's base64 encoded, not encrypted)
                  </span>
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
        transition={{ delay: 0.7 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Related Documentation
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <a
            href='/docs/sessions'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <span className='font-medium text-slate-900 dark:text-white'>Sessions</span>
            <ExternalLink className='w-4 h-4 text-slate-400' />
          </a>
          <a
            href='/docs/middleware'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <span className='font-medium text-slate-900 dark:text-white'>Middleware</span>
            <ExternalLink className='w-4 h-4 text-slate-400' />
          </a>
          <a
            href='/docs/api-routes'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <span className='font-medium text-slate-900 dark:text-white'>API Routes</span>
            <ExternalLink className='w-4 h-4 text-slate-400' />
          </a>
          <a
            href='/docs/best-practices'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <span className='font-medium text-slate-900 dark:text-white'>Best Practices</span>
            <ExternalLink className='w-4 h-4 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
