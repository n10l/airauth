'use client';

import { motion } from 'framer-motion';
import { Palette, Check, Copy, ArrowRight, Eye, Code, Layout } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function CustomPagesPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    config: `// app/api/auth/[...nextauth]/route.ts
import NextAuth from "@airauth/next"
import GoogleProvider from "@airauth/next/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout', 
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/welcome'
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return \`\${baseUrl}\${url}\`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
})

export { handlers as GET, handlers as POST }`,

    signInPage: `// app/auth/signin/page.tsx
"use client"

import { signIn, getProviders } from "@airauth/next/react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, Github } from "lucide-react"

export default function SignIn() {
  const [providers, setProviders] = useState(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const error = searchParams?.get("error")

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    fetchProviders()
  }, [])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/dashboard"
      })
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setLoading(false)
    }
  }

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "CredentialsSignin":
        return "Invalid email or password. Please try again."
      case "EmailNotVerified":
        return "Please verify your email address before signing in."
      case "AccountNotLinked":
        return "This email is associated with a different sign-in method."
      default:
        return "An error occurred during sign in. Please try again."
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Welcome back! Please enter your details.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {getErrorMessage(error)}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-xl">
          {/* OAuth Providers */}
          <div className="space-y-3">
            {providers && Object.values(providers).map((provider: any) => {
              if (provider.id === "credentials") return null
              
              return (
                <button
                  key={provider.name}
                  onClick={() => signIn(provider.id, { callbackUrl: "/dashboard" })}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  {provider.id === "google" && <Mail className="w-5 h-5" />}
                  {provider.id === "github" && <Github className="w-5 h-5" />}
                  Continue with {provider.name}
                </button>
              )
            })}
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Email/Password Form */}
          <form className="mt-6 space-y-4" onSubmit={handleEmailSignIn}>
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <a href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}`,

    errorPage: `// app/auth/error/page.tsx
"use client"

import { useSearchParams } from "next/navigation"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams?.get("error")

  const getErrorDetails = (error: string) => {
    switch (error) {
      case "Configuration":
        return {
          title: "Server Configuration Error",
          description: "There is a problem with the server configuration. Please contact support.",
          suggestion: "Contact your administrator"
        }
      case "AccessDenied":
        return {
          title: "Access Denied",
          description: "You do not have permission to sign in with this account.",
          suggestion: "Contact your administrator for access"
        }
      case "Verification":
        return {
          title: "Verification Error", 
          description: "The verification token has expired or is invalid.",
          suggestion: "Request a new verification email"
        }
      case "OAuthAccountNotLinked":
        return {
          title: "Account Not Linked",
          description: "This email is already associated with another account using a different sign-in method.",
          suggestion: "Sign in with your original method"
        }
      case "OAuthCallback":
        return {
          title: "OAuth Callback Error",
          description: "An error occurred during the OAuth callback process.",
          suggestion: "Please try signing in again"
        }
      case "OAuthCreate":
        return {
          title: "OAuth Account Creation Error", 
          description: "Could not create an account with the OAuth provider.",
          suggestion: "Please try again or use a different sign-in method"
        }
      case "EmailCreateAccount":
        return {
          title: "Email Account Creation Error",
          description: "Could not create an account with this email address.",
          suggestion: "Please use a different email or sign-in method"
        }
      case "Callback":
        return {
          title: "Callback Error",
          description: "An error occurred during the authentication callback.",
          suggestion: "Please try signing in again"
        }
      case "OAuthSignin":
        return {
          title: "OAuth Sign-in Error",
          description: "An error occurred while signing in with the OAuth provider.",
          suggestion: "Please try again or use a different method"
        }
      case "EmailSignin":
        return {
          title: "Email Sign-in Error", 
          description: "Could not send sign-in email.",
          suggestion: "Please check your email address and try again"
        }
      case "CredentialsSignin":
        return {
          title: "Invalid Credentials",
          description: "The email or password you entered is incorrect.",
          suggestion: "Please check your credentials and try again"
        }
      case "SessionRequired":
        return {
          title: "Session Required",
          description: "You must be signed in to view this page.",
          suggestion: "Please sign in to continue"
        }
      default:
        return {
          title: "Authentication Error",
          description: "An unexpected error occurred during authentication.",
          suggestion: "Please try again"
        }
    }
  }

  const errorDetails = getErrorDetails(error || "default")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {errorDetails.title}
          </h1>
          
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {errorDetails.description}
          </p>
          
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
            {errorDetails.suggestion}
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Link
            href="/auth/signin"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Link>
          
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Debug Info:</h3>
            <p className="text-xs font-mono text-gray-600 dark:text-gray-400">Error: {error}</p>
          </div>
        )}
      </div>
    </div>
  )
}`,

    customSignOut: `// app/auth/signout/page.tsx
"use client"

import { signOut, useSession } from "@airauth/next/react"
import { useState } from "react"
import { LogOut, User } from "lucide-react"

export default function SignOut() {
  const { data: session } = useSession()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut({ callbackUrl: "/" })
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            You are not signed in
          </h1>
          <a href="/auth/signin" className="text-blue-600 hover:text-blue-500 mt-2 inline-block">
            Sign in
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
            <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Sign out
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            You are currently signed in as:
          </p>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-6">
            <p className="font-medium text-gray-900 dark:text-white">
              {session.user?.name || session.user?.email}
            </p>
            {session.user?.email && session.user?.name && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {session.user.email}
              </p>
            )}
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Are you sure you want to sign out?
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {isSigningOut ? "Signing out..." : "Yes, sign out"}
            </button>
            
            <a
              href="/dashboard"
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}`,

    verifyRequest: `// app/auth/verify-request/page.tsx
"use client"

import { useSearchParams } from "next/navigation"
import { Mail, ArrowLeft, RefreshCw } from "lucide-react"
import { useState } from "react"

export default function VerifyRequest() {
  const searchParams = useSearchParams()
  const email = searchParams?.get("email")
  const [emailSent, setEmailSent] = useState(false)

  const resendEmail = async () => {
    if (!email) return
    
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      
      if (response.ok) {
        setEmailSent(true)
        setTimeout(() => setEmailSent(false), 3000)
      }
    } catch (error) {
      console.error("Failed to resend email:", error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20">
            <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            Check your email
          </h1>
          
          <div className="mt-4 space-y-2">
            <p className="text-gray-600 dark:text-gray-400">
              A sign in link has been sent to:
            </p>
            {email && (
              <p className="font-medium text-gray-900 dark:text-white">
                {email}
              </p>
            )}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Click the link in the email to sign in. The link will expire in 24 hours.
            </p>
          </div>
          
          <div className="mt-8 space-y-4">
            {email && (
              <button
                onClick={resendEmail}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                {emailSent ? "Email sent!" : "Resend email"}
              </button>
            )}
            
            <a
              href="/auth/signin"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}`,
  };

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl'>
            <Palette className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Custom Pages</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Create beautiful, branded authentication pages that match your application's design.
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
          <p className='text-slate-600 dark:text-slate-400 mb-4'>
            @airauth/next allows you to completely customize your authentication pages. Instead of
            using the default pages, you can create your own sign-in, sign-out, error, and
            verification pages that perfectly match your brand and user experience.
          </p>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <div className='p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center'>
              <Eye className='w-8 h-8 text-blue-600 mx-auto mb-2' />
              <h3 className='font-medium text-slate-900 dark:text-white'>Full Control</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Complete control over UI/UX
              </p>
            </div>
            <div className='p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center'>
              <Layout className='w-8 h-8 text-green-600 mx-auto mb-2' />
              <h3 className='font-medium text-slate-900 dark:text-white'>Brand Consistency</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Match your app's design</p>
            </div>
            <div className='p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center'>
              <Code className='w-8 h-8 text-purple-600 mx-auto mb-2' />
              <h3 className='font-medium text-slate-900 dark:text-white'>Custom Logic</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Add custom functionality</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Configuration */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Configuration
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Configure custom page routes in your NextAuth configuration:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.config, 'config')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'config' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.config}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Custom Sign-In Page */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Custom Sign-In Page
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Create a beautiful sign-in page with OAuth providers and credential support:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.signInPage, 'signInPage')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'signInPage' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.signInPage}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Error Page */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibent text-slate-900 dark:text-white mb-4'>
          Custom Error Page
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Handle authentication errors gracefully with detailed error messages:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.errorPage, 'errorPage')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'errorPage' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.errorPage}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Sign-Out Page */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Custom Sign-Out Page
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Create a confirmation page for users to sign out:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.customSignOut, 'customSignOut')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'customSignOut' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.customSignOut}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Verify Request Page */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Email Verification Page
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Show users when an email verification link has been sent:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.verifyRequest, 'verifyRequest')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'verifyRequest' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.verifyRequest}
          </SyntaxHighlighter>
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
          Design Best Practices
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg'>
            <h3 className='font-semibold text-green-900 dark:text-green-400 mb-3'>
              User Experience
            </h3>
            <ul className='space-y-2 text-sm text-green-800 dark:text-green-300'>
              <li>• Clear error messages and instructions</li>
              <li>• Responsive design for mobile users</li>
              <li>• Loading states and feedback</li>
              <li>• Accessible form elements</li>
            </ul>
          </div>

          <div className='p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
            <h3 className='font-semibold text-blue-900 dark:text-blue-400 mb-3'>Security</h3>
            <ul className='space-y-2 text-sm text-blue-800 dark:text-blue-300'>
              <li>• Input validation and sanitization</li>
              <li>• CSRF protection on forms</li>
              <li>• Rate limiting for sign-in attempts</li>
              <li>• Secure redirect handling</li>
            </ul>
          </div>
        </div>
      </motion.section>

      {/* Page Options */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Available Page Options
        </h2>
        <div className='overflow-x-auto'>
          <table className='w-full border-collapse bg-white dark:bg-slate-800 rounded-lg shadow-sm'>
            <thead>
              <tr className='border-b border-slate-200 dark:border-slate-600'>
                <th className='text-left p-4 font-semibold text-slate-900 dark:text-white'>Page</th>
                <th className='text-left p-4 font-semibold text-slate-900 dark:text-white'>
                  Purpose
                </th>
                <th className='text-left p-4 font-semibold text-slate-900 dark:text-white'>
                  URL Parameters
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className='border-b border-slate-100 dark:border-slate-700'>
                <td className='p-4 font-mono text-sm'>signIn</td>
                <td className='p-4 text-slate-600 dark:text-slate-400'>User authentication page</td>
                <td className='p-4 text-slate-600 dark:text-slate-400'>error, callbackUrl</td>
              </tr>
              <tr className='border-b border-slate-100 dark:border-slate-700'>
                <td className='p-4 font-mono text-sm'>signOut</td>
                <td className='p-4 text-slate-600 dark:text-slate-400'>Sign out confirmation</td>
                <td className='p-4 text-slate-600 dark:text-slate-400'>callbackUrl</td>
              </tr>
              <tr className='border-b border-slate-100 dark:border-slate-700'>
                <td className='p-4 font-mono text-sm'>error</td>
                <td className='p-4 text-slate-600 dark:text-slate-400'>
                  Authentication error display
                </td>
                <td className='p-4 text-slate-600 dark:text-slate-400'>error</td>
              </tr>
              <tr className='border-b border-slate-100 dark:border-slate-700'>
                <td className='p-4 font-mono text-sm'>verifyRequest</td>
                <td className='p-4 text-slate-600 dark:text-slate-400'>Email verification sent</td>
                <td className='p-4 text-slate-600 dark:text-slate-400'>url, email</td>
              </tr>
              <tr>
                <td className='p-4 font-mono text-sm'>newUser</td>
                <td className='p-4 text-slate-600 dark:text-slate-400'>Welcome new users</td>
                <td className='p-4 text-slate-600 dark:text-slate-400'>None</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* Related Links */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Related Documentation
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <a
            href='/docs/configuration'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Configuration</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                NextAuth configuration options
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
                Authentication providers setup
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
