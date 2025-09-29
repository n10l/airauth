'use client';

import { motion } from 'framer-motion';
import { Server, Check, Copy, ArrowRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function ServerComponentsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    basicServerComponent: `// app/dashboard/page.tsx
import { getServerSession } from "@airauth/next/next"
import { authOptions } from "../api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        Welcome back, {session.user.name}!
      </h1>
      <p>Email: {session.user.email}</p>
    </div>
  )
}`,

    protectedLayout: `// app/dashboard/layout.tsx
import { getServerSession } from "@airauth/next/next"
import { authOptions } from "../api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/Sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="flex h-screen">
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}`,

    roleBasedComponent: `// app/admin/page.tsx
import { getServerSession } from "@airauth/next/next"
import { authOptions } from "../api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/auth/signin")
  }
  
  if (session.user.role !== "admin") {
    redirect("/unauthorized")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <p>Welcome, {session.user.name}! You have admin privileges.</p>
    </div>
  )
}`,
  };

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl'>
            <Server className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Server Components</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Use authentication in Next.js 13+ server components.
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
            Server components in Next.js 13+ allow you to access authentication state directly on
            the server, providing better performance and SEO. This guide covers how to use
            getServerSession, implement protected routes, and handle authentication at the server
            level.
          </p>
        </div>
      </motion.section>

      {/* Basic Server Component */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Basic Protected Server Component
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Create a server component that requires authentication using{' '}
          <code className='px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-orange-600 dark:text-orange-400'>
            getServerSession
          </code>
          :
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.basicServerComponent, 'basicServerComponent')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'basicServerComponent' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.basicServerComponent}
          </SyntaxHighlighter>
        </div>
        <div className='mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg'>
          <h4 className='font-semibold text-green-900 dark:text-green-400 mb-2'>
            Server Component Benefits
          </h4>
          <ul className='text-sm text-green-800 dark:text-green-300 space-y-1'>
            <li>• No client-side JavaScript needed for authentication</li>
            <li>• Better SEO and initial page load performance</li>
            <li>• Secure server-side session validation</li>
            <li>• Direct database access without API calls</li>
          </ul>
        </div>
      </motion.section>

      {/* Protected Layout */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Protected Layout Component
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Implement authentication at the layout level to protect entire route segments:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.protectedLayout, 'protectedLayout')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'protectedLayout' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.protectedLayout}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Role-Based Access */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Role-Based Server Components
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Implement role-based access control in server components:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.roleBasedComponent, 'roleBasedComponent')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'roleBasedComponent' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.roleBasedComponent}
          </SyntaxHighlighter>
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
          Server Component Best Practices
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-6'>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-3'>Performance</h3>
            <ul className='space-y-2 text-sm text-slate-600 dark:text-slate-400'>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Use server components for initial auth checks
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Implement auth at layout level when possible
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Cache session data appropriately
              </li>
            </ul>
          </div>
          <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-6'>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-3'>Security</h3>
            <ul className='space-y-2 text-sm text-slate-600 dark:text-slate-400'>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Always validate sessions on the server
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Use redirect() for unauthorized access
              </li>
              <li className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-green-600 mt-0.5' />
                Implement proper error boundaries
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
