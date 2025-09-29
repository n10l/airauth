'use client';

import { motion } from 'framer-motion';
import {
  Settings,
  Zap,
  Shield,
  Copy,
  Check,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Code,
  Cpu,
  Database,
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function NextjsConfigPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    basicConfig: `// next.config.js - Basic NextAuth configuration
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  
  // Environment variables for client-side access
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  },
  
  // Image optimization
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google avatars
      'avatars.githubusercontent.com', // GitHub avatars
      'cdn.discordapp.com', // Discord avatars
      'platform-lookaside.fbsbx.com', // Facebook avatars
    ],
    formats: ['image/webp', 'image/avif'],
  },
}

module.exports = nextConfig`,

    productionConfig: `// next.config.js - Production optimized configuration
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker/serverless
  output: 'standalone',
  
  // Enable compression
  compress: true,
  
  // Use SWC minifier for better performance
  swcMinify: true,
  
  // Experimental features
  experimental: {
    appDir: true,
    optimizeCss: true,
    scrollRestoration: true,
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // Environment variables
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Image optimization
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
      'cdn.discordapp.com',
      'platform-lookaside.fbsbx.com',
      'your-cdn-domain.com',
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
          }
        ]
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          }
        ]
      }
    ]
  },
  
  // Redirects for SEO and user experience
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/signin',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/auth/signin',
        permanent: true,
      },
    ]
  },
  
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add custom webpack config here
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    return config
  },
  
  // Bundle analyzer (enable in development)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: './bundle-analyzer.html'
          })
        )
      }
      return config
    }
  }),
}

module.exports = nextConfig`,

    middlewareBasic: `// middleware.ts - Basic authentication middleware
import { withAuth } from "@airauth/next/middleware"

export default withAuth(
  function middleware(req) {
    // Custom middleware logic here
    console.log("Middleware executed for:", req.nextUrl.pathname)
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/profile/:path*'
  ]
}`,

    middlewareAdvanced: `// middleware.ts - Advanced authentication middleware
import { withAuth } from "@airauth/next/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const { token } = req.nextauth
    
    // Admin-only routes
    if (pathname.startsWith('/admin')) {
      if (!token?.role?.includes('admin')) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }
    
    // Premium user routes
    if (pathname.startsWith('/premium')) {
      if (!token?.subscription?.includes('premium')) {
        return NextResponse.redirect(new URL('/upgrade', req.url))
      }
    }
    
    // User-specific routes
    if (pathname.startsWith('/user/[id]')) {
      const userId = pathname.split('/')[2]
      if (token?.sub !== userId && !token?.role?.includes('admin')) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }
    
    // Add security headers
    const response = NextResponse.next()
    response.headers.set('X-User-ID', token?.sub || 'anonymous')
    response.headers.set('X-User-Role', token?.role || 'user')
    
    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Public routes
        if (pathname.startsWith('/public') || 
            pathname.startsWith('/api/public') ||
            pathname === '/') {
          return true
        }
        
        // API routes protection
        if (pathname.startsWith('/api/protected')) {
          return !!token
        }
        
        // Protected pages
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ]
}`,

    authApiRoute: `// app/api/auth/[...nextauth]/route.ts - Complete API route configuration
import NextAuth, { AuthOptions } from "@airauth/next"
import GoogleProvider from "@airauth/next/providers/google"
import GitHubProvider from "@airauth/next/providers/github"
import DiscordProvider from "@airauth/next/providers/discord"
import EmailProvider from "@airauth/next/providers/email"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Persist user data to token
      if (user) {
        token.role = user.role
        token.subscription = user.subscription
        token.permissions = user.permissions
      }
      
      // Handle OAuth account linking
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.provider = account.provider
      }
      
      return token
    },
    
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.subscription = token.subscription as string
        session.user.permissions = token.permissions as string[]
        session.accessToken = token.accessToken as string
      }
      
      return session
    },
    
    async signIn({ user, account, profile, email, credentials }) {
      // Custom sign-in logic
      if (account?.provider === "google" || account?.provider === "github") {
        // Auto-approve OAuth sign-ins
        return true
      }
      
      if (account?.provider === "email") {
        // Custom email verification logic
        return true
      }
      
      return true
    },
    
    async redirect({ url, baseUrl }) {
      // Custom redirect logic after sign-in
      if (url.startsWith("/")) return \`\${baseUrl}\${url}\`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(\`User \${user.email} signed in with \${account?.provider}\`)
      
      // Track sign-in events
      if (isNewUser) {
        // Send welcome email, create default preferences, etc.
        console.log('New user created:', user.email)
      }
    },
    
    async signOut({ session, token }) {
      console.log(\`User signed out: \${session?.user?.email}\`)
    },
    
    async createUser({ user }) {
      console.log('New user created in database:', user.email)
      
      // Set default role and permissions
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'user',
          permissions: ['read'],
          subscription: 'free'
        }
      })
    },
  },
  
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
    newUser: '/auth/welcome'
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }`,

    envConfiguration: `# .env.local - Complete environment variable configuration

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-jwt-secret-key-here

# Database (choose one)
# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
# MySQL
# DATABASE_URL=mysql://user:password@localhost:3306/mydb
# SQLite (for development)
# DATABASE_URL=file:./dev.db

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret

DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret

# Email Provider (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Optional: Redis for session storage
REDIS_URL=redis://localhost:6379

# Optional: Custom domain for cookies
NEXTAUTH_COOKIE_DOMAIN=.yourdomain.com

# Optional: External services
SENTRY_DSN=your-sentry-dsn
ANALYTICS_ID=your-analytics-id

# Feature flags
FEATURE_ADMIN_PANEL=true
FEATURE_PREMIUM_CONTENT=true
FEATURE_EMAIL_VERIFICATION=true`,

    layoutProvider: `// app/layout.tsx - Session provider setup
import { SessionProvider } from "@airauth/next/react"
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'My App with NextAuth',
  description: 'Secure authentication with NextAuth.js',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
              {/* Your navigation component */}
            </header>
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
            <footer className="bg-gray-800 text-white py-8">
              {/* Your footer component */}
            </footer>
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}`,

    clientComponent: `// components/UserProfile.tsx - Client component with hooks
"use client"

import { useSession, signIn, signOut } from "@airauth/next/react"
import { useState, useEffect } from "react"
import Image from "next/image"

export default function UserProfile() {
  const { data: session, status, update } = useSession()
  const [loading, setLoading] = useState(false)

  // Handle session updates
  const handleUpdateProfile = async (newData: any) => {
    setLoading(true)
    try {
      // Update user profile via API
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      })
      
      if (response.ok) {
        // Update session with new data
        await update({
          ...session,
          user: { ...session?.user, ...newData }
        })
      }
    } catch (error) {
      console.error('Profile update failed:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
        <p className="text-gray-600 mb-6">Please sign in to view your profile.</p>
        <button
          onClick={() => signIn()}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center">
        {session?.user?.image && (
          <Image
            src={session.user.image}
            alt="Profile"
            width={80}
            height={80}
            className="rounded-full mx-auto mb-4"
          />
        )}
        <h2 className="text-xl font-semibold">{session?.user?.name}</h2>
        <p className="text-gray-600">{session?.user?.email}</p>
        
        {session?.user?.role && (
          <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {session.user.role}
          </span>
        )}
      </div>
      
      <div className="mt-6 space-y-4">
        <button
          onClick={() => handleUpdateProfile({ name: 'New Name' })}
          disabled={loading}
          className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
        
        <button
          onClick={() => signOut()}
          className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}`,

    serverComponent: `// app/dashboard/page.tsx - Server component with session
import { getServerSession } from "@airauth/next/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  // Fetch user-specific data
  const userData = await prisma.user.findUnique({
    where: { email: session.user?.email! },
    include: {
      posts: true,
      profile: true,
    },
  })

  // Role-based access control
  if (session.user?.role !== 'admin' && session.user?.role !== 'user') {
    redirect('/unauthorized')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">
          Welcome, {session.user?.name}!
        </h1>
        <p className="text-gray-600">
          You have {userData?.posts.length || 0} posts
        </p>
      </div>
      
      {session.user?.role === 'admin' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800">
            Admin Panel
          </h2>
          <p className="text-yellow-700">
            You have administrative privileges.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userData?.posts.map((post) => (
          <div key={post.id} className="bg-white shadow rounded-lg p-4">
            <h3 className="font-semibold">{post.title}</h3>
            <p className="text-gray-600 text-sm mt-2">{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}`,

    apiRoute: `// app/api/user/profile/route.ts - Protected API route
import { getServerSession } from "@airauth/next/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"

const prisma = new PrismaClient()

// Validation schema
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user?.email! },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        profile: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { email: session.user?.email! },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}`,

    customSignIn: `// app/auth/signin/page.tsx - Custom sign-in page
"use client"

import { getProviders, signIn, getSession } from "@airauth/next/react"
import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"

export default function SignIn() {
  const [providers, setProviders] = useState(null)
  const [loading, setLoading] = useState('')
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const error = searchParams.get('error')

  useEffect(() => {
    getProviders().then(setProviders)
  }, [])

  const handleSignIn = async (providerId: string) => {
    setLoading(providerId)
    try {
      await signIn(providerId, { callbackUrl })
    } catch (error) {
      console.error('Sign-in error:', error)
    } finally {
      setLoading('')
    }
  }

  if (!providers) {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose your preferred sign-in method
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Sign-in error: {error}
          </div>
        )}
        
        <div className="space-y-4">
          {Object.values(providers).map((provider: any) => (
            <button
              key={provider.name}
              onClick={() => handleSignIn(provider.id)}
              disabled={loading === provider.id}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading === provider.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  {provider.id === 'google' && (
                    <Image src="/google-icon.svg" alt="Google" width={20} height={20} className="mr-2" />
                  )}
                  {provider.id === 'github' && (
                    <Image src="/github-icon.svg" alt="GitHub" width={20} height={20} className="mr-2" />
                  )}
                  Sign in with {provider.name}
                </>
              )}
            </button>
          ))}
        </div>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                Secure authentication powered by NextAuth.js
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}`,

    performanceOptimization: `// next.config.js - Performance optimization configuration
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
    
    // React strict mode
    reactStrictMode: true,
    
    // Styled components SSR
    styledComponents: true,
  },
  
  // Experimental optimizations
  experimental: {
    // App directory
    appDir: true,
    
    // Turbo mode
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    
    // Server components external packages
    serverComponentsExternalPackages: [
      '@prisma/client',
      'bcryptjs',
      'jsonwebtoken'
    ],
    
    // Optimize CSS
    optimizeCss: true,
    
    // Font optimization
    fontLoaders: [
      { loader: '@next/font/google', options: { subsets: ['latin'] } },
    ],
  },
  
  // Image optimization
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
      'cdn.discordapp.com',
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 3600, // 1 hour
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Bundle analysis
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Tree shake unused lodash functions
        lodash: 'lodash-es',
      }
    }
    
    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      )
    }
    
    return config
  },
  
  // Cache optimization
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
}`,
  };

  const configurationAreas = [
    {
      title: 'Environment Variables',
      description: 'Secure configuration management for authentication secrets and API keys',
      icon: Shield,
      color: 'text-green-600',
    },
    {
      title: 'Middleware Configuration',
      description: 'Route protection and authentication middleware setup',
      icon: Code,
      color: 'text-blue-600',
    },
    {
      title: 'API Routes',
      description: 'NextAuth API route configuration with providers and callbacks',
      icon: Database,
      color: 'text-purple-600',
    },
    {
      title: 'Session Management',
      description: 'Client and server-side session handling and state management',
      icon: Cpu,
      color: 'text-orange-600',
    },
    {
      title: 'Performance Optimization',
      description: 'Bundle optimization, image handling, and caching strategies',
      icon: Zap,
      color: 'text-yellow-600',
    },
    {
      title: 'Security Headers',
      description: 'CSRF protection, XSS prevention, and secure cookie configuration',
      icon: Shield,
      color: 'text-red-600',
    },
  ];

  const bestPractices = [
    {
      title: 'Secure Environment Variables',
      description: 'Never expose sensitive keys to the client-side',
      implementation:
        'Use NEXTAUTH_SECRET, keep OAuth secrets server-side only, prefix client variables with NEXT_PUBLIC_',
    },
    {
      title: 'JWT vs Database Sessions',
      description: 'Choose the right session strategy for your use case',
      implementation:
        'Use JWT for stateless apps, database sessions for complex user management, consider hybrid approaches',
    },
    {
      title: 'Role-Based Access Control',
      description: 'Implement proper authorization checks',
      implementation:
        'Check roles in middleware, API routes, and server components. Use TypeScript for type safety',
    },
    {
      title: 'Error Handling',
      description: 'Gracefully handle authentication errors',
      implementation: 'Custom error pages, proper error logging, user-friendly error messages',
    },
    {
      title: 'Performance Monitoring',
      description: 'Monitor authentication flow performance',
      implementation:
        'Track sign-in success rates, monitor API response times, use analytics for user behavior',
    },
    {
      title: 'Testing Strategy',
      description: 'Comprehensive testing of authentication flows',
      implementation:
        'Unit tests for utilities, integration tests for API routes, E2E tests for user flows',
    },
  ];

  const configurationSteps = [
    { title: 'Next.js Config', description: 'Basic configuration setup' },
    { title: 'Environment', description: 'Secure environment variables' },
    { title: 'API Routes', description: 'Authentication handlers' },
    { title: 'Middleware', description: 'Route protection' },
    { title: 'Components', description: 'Client and server integration' },
    { title: 'Optimization', description: 'Performance and security' },
  ];

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl'>
            <Settings className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>
            Next.js Configuration
          </h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Complete guide to configure Next.js optimally with @airauth/next for authentication,
          performance, and security.
        </p>
      </motion.div>

      {/* Configuration Areas */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Configuration Areas
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {configurationAreas.map((area, index) => {
            const Icon = area.icon;
            return (
              <div
                key={index}
                className='p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg'
              >
                <Icon className={`w-8 h-8 ${area.color} mb-3`} />
                <h3 className='font-semibold text-slate-900 dark:text-white mb-2'>{area.title}</h3>
                <p className='text-sm text-slate-600 dark:text-slate-400'>{area.description}</p>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Configuration Steps */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-6'>
          Configuration Guide
        </h2>

        {/* Progress Steps */}
        <div className='flex items-center justify-between mb-20 relative overflow-hidden'>
          <div className='absolute left-0 right-0 top-5 h-0.5 bg-slate-200 dark:bg-slate-700' />
          {configurationSteps.map((step, index) => (
            <div key={index} className='relative flex flex-col items-center'>
              <div className='w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-white font-semibold z-10'>
                {index + 1}
              </div>
              <span className='hidden sm:block absolute top-12 text-xs text-slate-600 dark:text-slate-400 text-center w-20'>
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Basic Configuration */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 1: Basic Next.js Configuration
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Start with a basic Next.js configuration for NextAuth integration:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.basicConfig, 'basic-config')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'basic-config' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='javascript' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.basicConfig}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Step 2: Environment Variables */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 2: Environment Variables Configuration
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Set up comprehensive environment variables for all authentication providers:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.envConfiguration, 'env-config')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'env-config' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.envConfiguration}
            </SyntaxHighlighter>
          </div>
          <div className='mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg'>
            <div className='flex items-start gap-2'>
              <AlertTriangle className='w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5' />
              <div className='text-sm'>
                <p className='font-semibold text-amber-900 dark:text-amber-400 mb-1'>
                  Security Note
                </p>
                <p className='text-amber-800 dark:text-amber-300'>
                  Never commit .env files to version control. Use .env.example for team reference
                  and secure secret management in production.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: API Route Configuration */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 3: Complete API Route Configuration
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Create a comprehensive NextAuth API route with multiple providers, callbacks, and
            events:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.authApiRoute, 'api-route')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'api-route' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.authApiRoute}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Step 4: Middleware Configuration */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 4: Advanced Middleware Configuration
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Implement sophisticated route protection with role-based access control:
          </p>
          <div className='space-y-4'>
            <div>
              <h4 className='font-medium text-slate-900 dark:text-white mb-2'>Basic Middleware</h4>
              <div className='relative'>
                <button
                  onClick={() => copyCode(codeExamples.middlewareBasic, 'middleware-basic')}
                  className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
                >
                  {copiedCode === 'middleware-basic' ? (
                    <Check className='w-4 h-4 text-green-400' />
                  ) : (
                    <Copy className='w-4 h-4 text-slate-400' />
                  )}
                </button>
                <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                  {codeExamples.middlewareBasic}
                </SyntaxHighlighter>
              </div>
            </div>

            <div>
              <h4 className='font-medium text-slate-900 dark:text-white mb-2'>
                Advanced Middleware
              </h4>
              <div className='relative'>
                <button
                  onClick={() => copyCode(codeExamples.middlewareAdvanced, 'middleware-advanced')}
                  className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
                >
                  {copiedCode === 'middleware-advanced' ? (
                    <Check className='w-4 h-4 text-green-400' />
                  ) : (
                    <Copy className='w-4 h-4 text-slate-400' />
                  )}
                </button>
                <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                  {codeExamples.middlewareAdvanced}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Session Provider Setup */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 5: Session Provider and Layout
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Configure the session provider in your app layout:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.layoutProvider, 'layout')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'layout' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.layoutProvider}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Step 6: Production Optimization */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 6: Production-Ready Configuration
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Optimize your Next.js configuration for production deployment:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.productionConfig, 'production-config')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'production-config' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='javascript' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.productionConfig}
            </SyntaxHighlighter>
          </div>
        </div>
      </motion.section>

      {/* Component Examples */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Component Integration Examples
        </h2>

        <div className='space-y-6'>
          {/* Client Component */}
          <div>
            <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
              Client Component with Hooks
            </h3>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.clientComponent, 'client-component')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'client-component' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.clientComponent}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Server Component */}
          <div>
            <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
              Server Component with Session
            </h3>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.serverComponent, 'server-component')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'server-component' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.serverComponent}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Protected API Route */}
          <div>
            <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
              Protected API Route
            </h3>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.apiRoute, 'api-route-example')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'api-route-example' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.apiRoute}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Custom Sign-in Page */}
          <div>
            <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
              Custom Sign-in Page
            </h3>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.customSignIn, 'custom-signin')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'custom-signin' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.customSignIn}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Best Practices */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
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
                <CheckCircle className='w-4 h-4 text-green-600' />
                {practice.title}
              </h3>
              <p className='text-slate-600 dark:text-slate-400 mb-2'>{practice.description}</p>
              <p className='text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded'>
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
        transition={{ delay: 0.5 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Performance Optimization
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <h3 className='font-semibold text-slate-900 dark:text-white'>
              Build-time Optimizations
            </h3>
            <div className='bg-slate-50 dark:bg-slate-800 rounded-lg p-4'>
              <ul className='text-sm text-slate-600 dark:text-slate-400 space-y-2'>
                <li>• Enable SWC minification for faster builds</li>
                <li>• Use standalone output for Docker/serverless</li>
                <li>• Optimize bundle size with webpack analysis</li>
                <li>• Tree shake unused dependencies</li>
                <li>• Configure proper image optimization domains</li>
              </ul>
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='font-semibold text-slate-900 dark:text-white'>Runtime Optimizations</h3>
            <div className='bg-slate-50 dark:bg-slate-800 rounded-lg p-4'>
              <ul className='text-sm text-slate-600 dark:text-slate-400 space-y-2'>
                <li>• Implement proper caching strategies</li>
                <li>• Use JWT for stateless authentication</li>
                <li>• Optimize database queries with proper indexing</li>
                <li>• Implement session update strategies</li>
                <li>• Monitor performance with Web Vitals</li>
              </ul>
            </div>
          </div>
        </div>

        <div className='mt-6'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Advanced Performance Configuration
          </h3>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.performanceOptimization, 'performance-config')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'performance-config' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='javascript' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.performanceOptimization}
            </SyntaxHighlighter>
          </div>
        </div>
      </motion.section>

      {/* Common Issues */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Common Configuration Issues
        </h2>
        <div className='space-y-4'>
          <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4'>
            <h3 className='font-semibold text-yellow-900 dark:text-yellow-400 mb-2'>
              Environment Variable Issues
            </h3>
            <ul className='text-sm text-yellow-800 dark:text-yellow-300 space-y-1'>
              <li>• Verify NEXTAUTH_SECRET is set and secure (32+ characters)</li>
              <li>• Ensure NEXTAUTH_URL matches your deployment URL</li>
              <li>• Check OAuth provider client IDs and secrets are correct</li>
              <li>• Don't expose server-side secrets to client (no NEXT_PUBLIC_ prefix)</li>
            </ul>
          </div>

          <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
            <h3 className='font-semibold text-red-900 dark:text-red-400 mb-2'>
              Middleware Configuration Errors
            </h3>
            <ul className='text-sm text-red-800 dark:text-red-300 space-y-1'>
              <li>• Incorrect matcher patterns causing infinite redirects</li>
              <li>• Missing authorized callback causing all requests to fail</li>
              <li>• Middleware running on API routes unintentionally</li>
              <li>• Token not available in middleware due to incorrect configuration</li>
            </ul>
          </div>

          <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
            <h3 className='font-semibold text-blue-900 dark:text-blue-400 mb-2'>
              Session Provider Issues
            </h3>
            <ul className='text-sm text-blue-800 dark:text-blue-300 space-y-1'>
              <li>• SessionProvider not wrapping the app correctly</li>
              <li>• Using hooks in server components (add "use client")</li>
              <li>• Session not updating after profile changes</li>
              <li>• CSRF token mismatches in form submissions</li>
            </ul>
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
            href='/docs/providers'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>OAuth Providers</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Configure additional authentication providers
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/deployment'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Deployment Guide</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Deploy your configured application
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/testing'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Testing Guide</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Test your authentication flows
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/troubleshooting'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Troubleshooting</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Solve common configuration issues
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
