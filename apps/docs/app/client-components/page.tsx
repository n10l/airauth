'use client';

import { motion } from 'framer-motion';
import { Monitor, Check, Copy, ArrowRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function ClientComponentsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
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

    useSession: `// components/UserProfile.tsx
"use client"

import { useSession, signIn, signOut } from "@airauth/next/react"
import { Button } from "@/components/ui/button"

export default function UserProfile() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div className="animate-pulse">Loading...</div>
  }

  if (!session) {
    return (
      <div className="text-center">
        <p className="mb-4">You are not signed in</p>
        <Button onClick={() => signIn()}>
          Sign in
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <img
        src={session.user.image || "/default-avatar.png"}
        alt={session.user.name || "User"}
        className="w-10 h-10 rounded-full"
      />
      <div>
        <p className="font-medium">{session.user.name}</p>
        <p className="text-sm text-gray-600">{session.user.email}</p>
      </div>
      <Button 
        variant="outline" 
        onClick={() => signOut()}
      >
        Sign out
      </Button>
    </div>
  )
}`,

    conditionalRendering: `// components/Dashboard.tsx
"use client"

import { useSession } from "@airauth/next/react"
import { redirect } from "next/navigation"

export default function Dashboard() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/auth/signin")
    },
  })

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        Welcome back, {session.user.name}!
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
          <p>Email: {session.user.email}</p>
          {session.user.role && (
            <p>Role: {session.user.role}</p>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Account Status</h2>
          <p className="text-green-600">✓ Verified</p>
        </div>
      </div>
    </div>
  )
}`,

    signInButton: `// components/SignInButton.tsx
"use client"

import { useState } from "react"
import { signIn, getProviders } from "@airauth/next/react"
import { Button } from "@/components/ui/button"

interface Provider {
  id: string
  name: string
  type: string
}

interface SignInButtonProps {
  providers?: Record<string, Provider>
}

export default function SignInButton({ providers }: SignInButtonProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleSignIn = async (providerId: string) => {
    setLoading(providerId)
    try {
      await signIn(providerId, { callbackUrl: "/dashboard" })
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setLoading(null)
    }
  }

  if (!providers) {
    return <div>Loading providers...</div>
  }

  return (
    <div className="space-y-3">
      {Object.values(providers).map((provider) => (
        <Button
          key={provider.id}
          onClick={() => handleSignIn(provider.id)}
          disabled={loading === provider.id}
          className="w-full"
          variant="outline"
        >
          {loading === provider.id ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
          ) : null}
          Sign in with {provider.name}
        </Button>
      ))}
    </div>
  )
}`,

    roleBasedAccess: `// components/AdminPanel.tsx
"use client"

import { useSession } from "@airauth/next/react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminPanel() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          You must be signed in to access this content.
        </AlertDescription>
      </Alert>
    )
  }

  if (session.user.role !== "admin") {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          You don't have permission to access this admin panel.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
      <p>Welcome to the admin panel, {session.user.name}!</p>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border p-4 rounded">
          <h3 className="font-semibold">User Management</h3>
          <p className="text-sm text-gray-600">Manage user accounts and permissions</p>
        </div>
        
        <div className="border p-4 rounded">
          <h3 className="font-semibold">System Settings</h3>
          <p className="text-sm text-gray-600">Configure system-wide settings</p>
        </div>
      </div>
    </div>
  )
}`,

    customSignIn: `// app/auth/signin/page.tsx
"use client"

import { useState, useEffect } from "react"
import { getProviders, signIn, getSession } from "@airauth/next/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Provider {
  id: string
  name: string
  type: string
}

export default function SignIn() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push("/dashboard")
      }
    }

    fetchProviders()
    checkSession()
  }, [router])

  const handleSignIn = async (providerId: string) => {
    setLoading(providerId)
    try {
      const result = await signIn(providerId, { 
        callbackUrl: "/dashboard",
        redirect: false 
      })
      
      if (result?.url) {
        router.push(result.url)
      }
    } catch (error) {
      console.error("Sign in failed:", error)
    } finally {
      setLoading(null)
    }
  }

  if (!providers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Sign in to your account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.values(providers).map((provider) => (
            <Button
              key={provider.id}
              onClick={() => handleSignIn(provider.id)}
              disabled={loading === provider.id}
              className="w-full"
              variant={provider.id === "google" ? "default" : "outline"}
            >
              {loading === provider.id && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              )}
              Continue with {provider.name}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}`,

    sessionUpdate: `// components/ProfileForm.tsx
"use client"

import { useState } from "react"
import { useSession } from "@airauth/next/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ProfileForm() {
  const { data: session, update } = useSession()
  const [name, setName] = useState(session?.user.name || "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Update user in database
      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      if (response.ok) {
        // Update the session
        await update({ name })
        alert("Profile updated successfully!")
      }
    } catch (error) {
      console.error("Update failed:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!session) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name
        </label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </div>
      
      <Button type="submit" disabled={loading}>
        {loading ? "Updating..." : "Update Profile"}
      </Button>
    </form>
  )
}`,
  };

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl'>
            <Monitor className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Client Components</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Implement authentication in client-side React components.
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
            Client components in Next.js App Router allow you to access authentication state and
            interact with the session on the client-side. This guide covers how to use the{' '}
            <code>useSession</code> hook, handle authentication states, and implement client-side
            authentication logic with @airauth/next.
          </p>
        </div>
      </motion.section>

      {/* Session Provider Setup */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Session Provider Setup
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          First, wrap your application with the{' '}
          <code className='px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-orange-600 dark:text-orange-400'>
            SessionProvider
          </code>{' '}
          to make session data available to all client components:
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

      {/* useSession Hook */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Using the useSession Hook
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          The{' '}
          <code className='px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-orange-600 dark:text-orange-400'>
            useSession
          </code>{' '}
          hook provides access to the user's session data and authentication status:
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
      </motion.section>

      {/* Conditional Rendering */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Conditional Rendering & Required Sessions
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Create components that require authentication and handle unauthenticated states:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.conditionalRendering, 'conditionalRendering')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'conditionalRendering' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.conditionalRendering}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Sign In Components */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Sign In Components
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Build reusable sign-in components with provider support and loading states:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.signInButton, 'signInButton')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'signInButton' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.signInButton}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Role-Based Access */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Role-Based Access Control
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Implement role-based access control in your client components:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.roleBasedAccess, 'roleBasedAccess')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'roleBasedAccess' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.roleBasedAccess}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Custom Sign-In Page */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Custom Sign-In Page
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Create a fully custom sign-in page with provider management and error handling:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.customSignIn, 'customSignIn')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'customSignIn' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.customSignIn}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Session Updates */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Updating Session Data
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Update session data on the client-side after making changes to user information:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.sessionUpdate, 'sessionUpdate')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'sessionUpdate' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.sessionUpdate}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Best Practices */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Best Practices
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-6'>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-3'>Performance</h3>
            <ul className='space-y-2 text-sm text-slate-600 dark:text-slate-400'>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Use <code>required: true</code> for protected components
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Handle loading states gracefully
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Minimize session data access in render cycles
              </li>
            </ul>
          </div>
          <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-6'>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-3'>UX Considerations</h3>
            <ul className='space-y-2 text-sm text-slate-600 dark:text-slate-400'>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Show appropriate loading states
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Handle authentication errors gracefully
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Provide clear feedback for user actions
              </li>
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
            href='/docs/server-components'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Server Components</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Authentication in server components
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
              <p className='text-sm text-slate-600 dark:text-slate-400'>Secure API endpoints</p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/custom-pages'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Custom Pages</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Build custom auth pages</p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/sessions'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Sessions</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Session management</p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
