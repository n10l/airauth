'use client';

import { motion } from 'framer-motion';
import { Key, Check, Copy, ArrowRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function CredentialsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    basicCredentials: `// app/api/auth/[...nextauth]/route.ts
import NextAuth from "@airauth/next"
import CredentialsProvider from "@airauth/next/providers/credentials"
import bcrypt from "bcryptjs"
import { getUserByEmail } from "@/lib/auth"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await getUserByEmail(credentials.email)
        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }`,

    signInForm: `// components/SignInForm.tsx
"use client"

import { useState } from "react"
import { signIn } from "@airauth/next/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid credentials")
      } else {
        window.location.href = "/dashboard"
      }
    } catch (error) {
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  )
}`,

    passwordHashing: `// lib/auth.ts
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
    },
  })
}

export async function createUser({
  email,
  password,
  name,
}: {
  email: string
  password: string
  name: string
}) {
  const hashedPassword = await hashPassword(password)
  
  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  })
}`,
  };

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl'>
            <Key className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Credentials</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Implement username/password authentication with custom credential providers.
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
            The Credentials provider allows you to handle username/password authentication directly
            in your application. This guide covers secure implementation patterns, password hashing,
            and integration with databases for custom authentication flows.
          </p>
        </div>
      </motion.section>

      {/* Basic Credentials Setup */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Basic Credentials Setup
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Configure the Credentials provider with secure password validation:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.basicCredentials, 'basicCredentials')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'basicCredentials' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.basicCredentials}
          </SyntaxHighlighter>
        </div>
        <div className='mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg'>
          <h4 className='font-semibold text-amber-900 dark:text-amber-400 mb-2'>Security Note</h4>
          <p className='text-sm text-amber-800 dark:text-amber-300'>
            Always hash passwords before storing them and use secure comparison methods to prevent
            timing attacks.
          </p>
        </div>
      </motion.section>

      {/* Sign In Form */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Custom Sign-In Form
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Create a custom sign-in form component that works with the Credentials provider:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.signInForm, 'signInForm')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'signInForm' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.signInForm}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Password Hashing */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Password Hashing & Database Integration
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Implement secure password handling with proper hashing and database queries:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.passwordHashing, 'passwordHashing')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'passwordHashing' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.passwordHashing}
          </SyntaxHighlighter>
        </div>
        <div className='mt-4 space-y-2'>
          <div className='p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded'>
            <p className='text-sm text-green-800 dark:text-green-300'>
              <strong>Install required dependencies:</strong>{' '}
              <code>npm install bcryptjs @types/bcryptjs</code>
            </p>
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
          Security Best Practices
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-6'>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-3'>Password Security</h3>
            <ul className='space-y-2 text-sm text-slate-600 dark:text-slate-400'>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Use bcrypt with salt rounds ≥ 12
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Implement password strength requirements
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Use timing-safe comparison methods
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Never store plain text passwords
              </li>
            </ul>
          </div>
          <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-6'>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-3'>
              Authentication Security
            </h3>
            <ul className='space-y-2 text-sm text-slate-600 dark:text-slate-400'>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Implement rate limiting for login attempts
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Add account lockout mechanisms
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Validate input data thoroughly
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Use HTTPS in production
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
            href='/docs/providers'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Other Providers</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                OAuth and social providers
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
              <p className='text-sm text-slate-600 dark:text-slate-400'>Database integration</p>
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
