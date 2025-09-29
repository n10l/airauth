'use client';

import { motion } from 'framer-motion';
import {
  Globe,
  Zap,
  Shield,
  Copy,
  Check,
  ArrowRight,
  CheckCircle,
  Settings,
  Cloud,
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function NetlifyPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    netlifyToml: `# netlify.toml
[build]
  publish = ".next"
  command = "npm run build"

[build.environment]
  NEXT_TELEMETRY_DISABLED = "1"
  NODE_VERSION = "18"

# Redirect all server-side requests to Netlify Functions
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

# Handle Next.js routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Strict-Transport-Security = "max-age=63072000; includeSubDomains; preload"

# Cache static assets
[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Environment-specific settings
[context.production.environment]
  NODE_ENV = "production"
  NEXTAUTH_URL = "https://your-site.netlify.app"

[context.deploy-preview.environment]
  NODE_ENV = "development"
  NEXTAUTH_URL = "https://deploy-preview-$REVIEW_ID--your-site.netlify.app"

[context.branch-deploy.environment]
  NODE_ENV = "development"
  NEXTAUTH_URL = "https://$BRANCH--your-site.netlify.app"`,

    nextConfig: `// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports for Netlify
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  
  // Disable server-side features for static export
  experimental: {
    // Enable App Router
    appDir: true,
  },
  
  // Environment variables
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },

  // Netlify-specific optimizations
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },

  // Handle dynamic routes for static export
  async generateStaticParams() {
    return []
  },
}

module.exports = nextConfig`,

    authApiRoute: `// netlify/functions/auth.js
const { NextAuth } = require("@airauth/next")
const GoogleProvider = require("@airauth/next/providers/google").default
const GitHubProvider = require("@airauth/next/providers/github").default

const authHandler = NextAuth({
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
      if (token.role) {
        session.user.role = token.role
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Handles redirects on sign in/sign out
      if (url.startsWith("/")) return \`\${baseUrl}\${url}\`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
})

exports.handler = async (event, context) => {
  // Handle OPTIONS requests for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: '',
    }
  }

  // Create a mock request/response for NextAuth
  const req = {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body,
    url: event.rawUrl || \`https://\${event.headers.host}\${event.path}\`,
    query: event.queryStringParameters || {},
  }

  const res = {
    status: (code) => ({ json: (data) => ({ statusCode: code, body: JSON.stringify(data) }) }),
    json: (data) => ({ statusCode: 200, body: JSON.stringify(data) }),
    redirect: (url) => ({ statusCode: 302, headers: { Location: url } }),
  }

  try {
    const result = await authHandler(req, res)
    return result
  } catch (error) {
    console.error('Auth error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}`,

    packageJson: `{
  "name": "nextauth-netlify-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "postbuild": "mkdir -p .netlify/functions && cp netlify/functions/* .netlify/functions/"
  },
  "dependencies": {
    "next": "^14.0.0",
    "@airauth/next": "^1.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "typescript": "^5.0.0"
  }
}`,

    envExample: `# .env.local (for local development)
# .env (for production - set in Netlify dashboard)

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-jwt-secret-key-here

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret

DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Optional: Database (for storing user data)
DATABASE_URL=your-database-connection-string

# Optional: Email Provider
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com`,

    deployScript: `#!/bin/bash
# deploy.sh - Deploy to Netlify using CLI

set -e

echo "🚀 Deploying to Netlify..."

# Install Netlify CLI if not present
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Build the project
echo "🏗️  Building project..."
npm run build

# Deploy to Netlify
if [ "$1" == "production" ]; then
    echo "📤 Deploying to production..."
    netlify deploy --prod
else
    echo "📤 Deploying preview..."
    netlify deploy
fi

echo "✅ Deployment completed!"`,

    middleware: `// middleware.ts
import { withAuth } from "@airauth/next/middleware"

export default withAuth(
  function middleware(req) {
    console.log("Middleware executed for:", req.nextUrl.pathname)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect specific routes
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return !!token
        }
        
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return token?.role === 'admin'
        }
        
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/api/protected/:path*'
  ]
}`,

    edgeFunction: `// netlify/edge-functions/auth-middleware.ts
import type { Context } from "https://edge.netlify.com"

export default async (request: Request, context: Context) => {
  const url = new URL(request.url)
  
  // Check if the request is for protected routes
  const protectedRoutes = ['/dashboard', '/admin', '/profile']
  const isProtectedRoute = protectedRoutes.some(route => 
    url.pathname.startsWith(route)
  )
  
  if (isProtectedRoute) {
    // Check for authentication token
    const token = request.headers.get('authorization') || 
                  request.headers.get('cookie')?.match(/next-auth.session-token=([^;]+)/)?.[1]
    
    if (!token) {
      // Redirect to sign-in page
      return Response.redirect(new URL('/auth/signin', url.origin), 302)
    }
    
    // Verify token (simplified - in production, verify JWT properly)
    try {
      // Add your token verification logic here
      console.log('Token verified for protected route')
    } catch (error) {
      return Response.redirect(new URL('/auth/signin', url.origin), 302)
    }
  }
  
  // Continue to the page
  return context.next()
}

export const config = {
  path: ["/dashboard/*", "/admin/*", "/profile/*"]
}`,

    formsHandling: `// netlify/functions/contact.js
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const data = JSON.parse(event.body)
    
    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      }
    }

    // Process form submission (e.g., send email, save to database)
    console.log('Form submission:', data)
    
    // Example: Send email using a service like SendGrid, Mailgun, etc.
    // await sendEmail(data)
    
    // Example: Save to database
    // await saveToDatabase(data)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ 
        message: 'Form submitted successfully',
        id: Date.now().toString()
      }),
    }
  } catch (error) {
    console.error('Form submission error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}`,

    apiExample: `// netlify/functions/user-profile.js
const jwt = require('jsonwebtoken')

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    // Extract token from Authorization header
    const authHeader = event.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      }
    }

    const token = authHeader.slice(7)
    
    // Verify JWT token (simplified - use proper verification in production)
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET)
    
    if (event.httpMethod === 'GET') {
      // Fetch user profile
      const userProfile = {
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role || 'user',
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(userProfile),
      }
    }
    
    if (event.httpMethod === 'PUT') {
      // Update user profile
      const updates = JSON.parse(event.body)
      
      // Validate and sanitize updates
      const allowedFields = ['name', 'bio', 'location']
      const sanitizedUpdates = {}
      
      for (const field of allowedFields) {
        if (updates[field]) {
          sanitizedUpdates[field] = updates[field]
        }
      }
      
      // Update in database (mock)
      console.log('Updating user profile:', sanitizedUpdates)
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'Profile updated successfully',
          updates: sanitizedUpdates
        }),
      }
    }
    
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  } catch (error) {
    console.error('API error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}`,

    buildHook: `// netlify/functions/build-hook.js
const crypto = require('crypto')

exports.handler = async (event, context) => {
  // Verify webhook signature for security
  const signature = event.headers['x-hub-signature-256']
  const body = event.body
  
  if (signature) {
    const hash = crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET)
      .update(body)
      .digest('hex')
    
    const expectedSignature = \`sha256=\${hash}\`
    
    if (signature !== expectedSignature) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' }),
      }
    }
  }

  try {
    const payload = JSON.parse(body)
    
    // Handle different webhook events
    if (payload.action === 'published' || payload.ref === 'refs/heads/main') {
      // Trigger Netlify build
      console.log('Triggering build for deployment')
      
      // You can add custom logic here:
      // - Clear cache
      // - Send notifications
      // - Update database
      // - Generate sitemap
      
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Build triggered successfully' }),
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Webhook received' }),
    }
  } catch (error) {
    console.error('Webhook error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}`,

    splitTesting: `// netlify/functions/split-test.js
exports.handler = async (event, context) => {
  const { identity, user } = context.clientContext || {}
  
  // Get user identifier (use actual user ID if authenticated, fallback to IP)
  const userId = user?.sub || event.headers['x-forwarded-for'] || 'anonymous'
  
  // Simple hash-based split testing
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  const variant = Math.abs(hash) % 100 < 50 ? 'A' : 'B'
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      variant,
      userId: userId.slice(0, 8) + '...', // Anonymized
      timestamp: new Date().toISOString(),
    }),
  }
}`,
  };

  const netlifyFeatures = [
    {
      title: 'Continuous Deployment',
      description: 'Automatic deployments from Git repositories with preview builds',
      benefits: ['Zero-config deployments', 'Preview deployments', 'Rollback capabilities'],
    },
    {
      title: 'Serverless Functions',
      description: 'Built-in serverless functions for API endpoints and dynamic functionality',
      benefits: ['No server management', 'Auto-scaling', 'Pay-per-execution'],
    },
    {
      title: 'Edge Functions',
      description: 'Global edge computing for fast, personalized experiences',
      benefits: ['Sub-50ms latency', 'A/B testing', 'Personalization'],
    },
    {
      title: 'Forms Handling',
      description: 'Built-in form processing without server-side code',
      benefits: ['Spam protection', 'File uploads', 'Webhooks integration'],
    },
    {
      title: 'Identity & Authentication',
      description: 'User management and authentication service',
      benefits: ['OAuth providers', 'User management', 'Role-based access'],
    },
    {
      title: 'Analytics & Monitoring',
      description: 'Built-in analytics and real-time monitoring',
      benefits: ['Performance metrics', 'Error tracking', 'Custom events'],
    },
  ];

  const deploymentSteps = [
    { title: 'Repository', description: 'Connect Git repository' },
    { title: 'Configuration', description: 'Set build settings and environment variables' },
    { title: 'Functions', description: 'Configure serverless functions' },
    { title: 'Authentication', description: 'Set up NextAuth API routes' },
    { title: 'Deploy', description: 'Build and deploy to Netlify' },
    { title: 'Domain', description: 'Configure custom domain' },
    { title: 'Optimize', description: 'Configure caching and performance' },
  ];

  const bestPractices = [
    {
      title: 'Environment Variables',
      description: "Use Netlify's environment variables for sensitive data",
      implementation: 'Set via Netlify UI or CLI, prefix with NEXT_PUBLIC_ for client-side access',
    },
    {
      title: 'Build Optimization',
      description: 'Optimize build times and bundle sizes',
      implementation:
        'Use Next.js optimization features, enable build plugins, implement proper caching',
    },
    {
      title: 'Function Cold Starts',
      description: 'Minimize serverless function cold start times',
      implementation: 'Keep functions small, use connection pooling, implement warming strategies',
    },
    {
      title: 'Security Headers',
      description: 'Implement proper security headers',
      implementation: 'Configure headers in netlify.toml, use Content Security Policy, enable HSTS',
    },
    {
      title: 'Performance Monitoring',
      description: 'Monitor and optimize application performance',
      implementation: 'Use Netlify Analytics, implement error tracking, monitor Core Web Vitals',
    },
    {
      title: 'CDN Optimization',
      description: "Leverage Netlify's global CDN effectively",
      implementation: 'Optimize static assets, use proper cache headers, enable Brotli compression',
    },
  ];

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-xl'>
            <Globe className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Netlify Deployment</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Deploy @airauth/next to Netlify with serverless functions, edge computing, and global CDN.
        </p>
      </motion.div>

      {/* Features Overview */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Netlify Features for Next.js
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {netlifyFeatures.map((feature, index) => (
            <div
              key={index}
              className='p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg'
            >
              <h3 className='font-semibold text-slate-900 dark:text-white mb-2'>{feature.title}</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
                {feature.description}
              </p>
              <ul className='text-xs text-slate-500 dark:text-slate-400 space-y-1'>
                {feature.benefits.map((benefit, benefitIndex) => (
                  <li key={benefitIndex} className='flex items-center gap-1'>
                    <CheckCircle className='w-3 h-3 text-green-600' />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Deployment Steps */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-6'>
          Deployment Guide
        </h2>

        {/* Progress Steps */}
        <div className='flex items-center justify-between mb-20 relative overflow-hidden'>
          <div className='absolute left-0 right-0 top-5 h-0.5 bg-slate-200 dark:bg-slate-700' />
          {deploymentSteps.map((step, index) => (
            <div key={index} className='relative flex flex-col items-center'>
              <div className='w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-semibold z-10'>
                {index + 1}
              </div>
              <span className='hidden sm:block absolute top-12 text-xs text-slate-600 dark:text-slate-400 text-center w-20'>
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Netlify Configuration */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 1: Create netlify.toml Configuration
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Configure your Netlify deployment settings, redirects, and environment variables:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.netlifyToml, 'netlify-toml')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'netlify-toml' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='toml' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.netlifyToml}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Step 2: Next.js Configuration */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 2: Configure Next.js for Netlify
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Update your Next.js configuration for optimal Netlify deployment:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.nextConfig, 'next-config')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'next-config' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='javascript' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.nextConfig}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Step 3: Authentication Function */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 3: Create Authentication Serverless Function
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Create a Netlify function to handle NextAuth.js authentication:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.authApiRoute, 'auth-function')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'auth-function' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='javascript' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.authApiRoute}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Step 4: Environment Variables */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 4: Configure Environment Variables
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Set up your environment variables in the Netlify dashboard:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.envExample, 'env-vars')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'env-vars' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.envExample}
            </SyntaxHighlighter>
          </div>
          <div className='mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
            <div className='flex items-start gap-2'>
              <Settings className='w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5' />
              <div className='text-sm'>
                <p className='font-semibold text-blue-900 dark:text-blue-400 mb-1'>
                  Netlify Dashboard Setup
                </p>
                <p className='text-blue-800 dark:text-blue-300'>
                  Set these variables in: Site Settings → Environment Variables → Add variable
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Package.json */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 5: Update Package Configuration
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Configure your package.json for Netlify builds:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.packageJson, 'package-json')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'package-json' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='json' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.packageJson}
            </SyntaxHighlighter>
          </div>
        </div>
      </motion.section>

      {/* Advanced Features */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Advanced Features
        </h2>

        <div className='space-y-6'>
          {/* Edge Functions */}
          <div>
            <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
              Edge Functions for Authentication Middleware
            </h3>
            <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
              Use Netlify Edge Functions for authentication middleware at the edge:
            </p>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.edgeFunction, 'edge-function')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'edge-function' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.edgeFunction}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Forms Handling */}
          <div>
            <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
              Serverless Forms Handling
            </h3>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.formsHandling, 'forms')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'forms' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='javascript' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.formsHandling}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* API Functions */}
          <div>
            <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
              Protected API Endpoints
            </h3>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.apiExample, 'api-function')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'api-function' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='javascript' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.apiExample}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Deployment Commands */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Deployment Options
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg'>
            <h3 className='font-semibold text-green-900 dark:text-green-400 mb-3 flex items-center gap-2'>
              <Cloud className='w-5 h-5' />
              Git-based Deployment (Recommended)
            </h3>
            <ol className='text-sm text-green-800 dark:text-green-300 space-y-2'>
              <li>1. Push your code to GitHub/GitLab/Bitbucket</li>
              <li>2. Connect repository in Netlify dashboard</li>
              <li>3. Configure build settings</li>
              <li>4. Deploy automatically on every push</li>
            </ol>
          </div>

          <div className='p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg'>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2'>
              <Zap className='w-5 h-5' />
              Manual Deployment
            </h3>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.deployScript, 'deploy-script')}
                className='absolute right-2 top-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors z-10'
              >
                {copiedCode === 'deploy-script' ? (
                  <Check className='w-3.5 h-3.5 text-green-400' />
                ) : (
                  <Copy className='w-3.5 h-3.5 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded text-sm'>
                {codeExamples.deployScript}
              </SyntaxHighlighter>
            </div>
          </div>
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
          Best Practices
        </h2>
        <div className='space-y-4'>
          {bestPractices.map((practice, index) => (
            <div
              key={index}
              className='border border-slate-200 dark:border-slate-700 rounded-lg p-4'
            >
              <h3 className='font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2'>
                <Shield className='w-4 h-4 text-teal-600' />
                {practice.title}
              </h3>
              <p className='text-slate-600 dark:text-slate-400 mb-2'>{practice.description}</p>
              <p className='text-sm text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 p-2 rounded'>
                <strong>Implementation:</strong> {practice.implementation}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Performance Optimization */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Performance Optimization
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <h3 className='font-semibold text-slate-900 dark:text-white'>Build Optimization</h3>
            <div className='bg-slate-50 dark:bg-slate-800 rounded-lg p-4'>
              <ul className='text-sm text-slate-600 dark:text-slate-400 space-y-2'>
                <li>• Enable Next.js bundle analyzer for size optimization</li>
                <li>• Use dynamic imports for code splitting</li>
                <li>• Optimize images with next/image component</li>
                <li>• Enable Brotli compression in netlify.toml</li>
                <li>• Set up proper cache headers for static assets</li>
              </ul>
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='font-semibold text-slate-900 dark:text-white'>Runtime Optimization</h3>
            <div className='bg-slate-50 dark:bg-slate-800 rounded-lg p-4'>
              <ul className='text-sm text-slate-600 dark:text-slate-400 space-y-2'>
                <li>• Use Edge Functions for geographically distributed logic</li>
                <li>• Implement function warming for reduced cold starts</li>
                <li>• Use Netlify's built-in image transformation</li>
                <li>• Enable incremental static regeneration when possible</li>
                <li>• Monitor Core Web Vitals with Netlify Analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Monitoring and Analytics */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Monitoring & Analytics
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
            <h3 className='font-semibold text-blue-900 dark:text-blue-400 mb-2'>
              Built-in Analytics
            </h3>
            <ul className='text-sm text-blue-800 dark:text-blue-300 space-y-1'>
              <li>• Real-time visitor tracking</li>
              <li>• Page performance metrics</li>
              <li>• Bandwidth usage monitoring</li>
              <li>• Core Web Vitals tracking</li>
            </ul>
          </div>

          <div className='p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg'>
            <h3 className='font-semibold text-purple-900 dark:text-purple-400 mb-2'>
              Function Monitoring
            </h3>
            <ul className='text-sm text-purple-800 dark:text-purple-300 space-y-1'>
              <li>• Function execution logs</li>
              <li>• Performance metrics</li>
              <li>• Error tracking and alerts</li>
              <li>• Usage and billing insights</li>
            </ul>
          </div>
        </div>
      </motion.section>

      {/* Troubleshooting */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Common Issues & Solutions
        </h2>
        <div className='space-y-4'>
          <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4'>
            <h3 className='font-semibold text-yellow-900 dark:text-yellow-400 mb-2'>
              Build Failures
            </h3>
            <ul className='text-sm text-yellow-800 dark:text-yellow-300 space-y-1'>
              <li>• Check build logs in Netlify dashboard</li>
              <li>• Verify Node.js version compatibility</li>
              <li>• Ensure all environment variables are set</li>
              <li>• Check for missing dependencies in package.json</li>
            </ul>
          </div>

          <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
            <h3 className='font-semibold text-red-900 dark:text-red-400 mb-2'>Function Errors</h3>
            <ul className='text-sm text-red-800 dark:text-red-300 space-y-1'>
              <li>• Check function logs in Netlify dashboard</li>
              <li>• Verify function syntax and exports</li>
              <li>• Test functions locally with Netlify CLI</li>
              <li>• Check CORS headers for client-side requests</li>
            </ul>
          </div>

          <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
            <h3 className='font-semibold text-blue-900 dark:text-blue-400 mb-2'>
              Authentication Issues
            </h3>
            <ul className='text-sm text-blue-800 dark:text-blue-300 space-y-1'>
              <li>• Verify NEXTAUTH_URL matches deployed URL</li>
              <li>• Check OAuth provider callback URLs</li>
              <li>• Ensure NEXTAUTH_SECRET is properly set</li>
              <li>• Test authentication flow in incognito mode</li>
            </ul>
          </div>
        </div>
      </motion.section>

      {/* Next Steps */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>Next Steps</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <a
            href='/docs/configuration'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Advanced Configuration</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Configure providers and callbacks
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/providers'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>OAuth Providers</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Set up authentication providers
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/edge-functions'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Edge Functions Guide</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Advanced edge computing patterns
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/performance'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>
                Performance Optimization
              </h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Optimize for speed and efficiency
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
