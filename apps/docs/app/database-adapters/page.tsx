'use client';

import { motion } from 'framer-motion';
import { Database, Check, Copy, ArrowRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function DatabaseAdaptersPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    prisma: `// Using Prisma Adapter
import { PrismaAdapter } from "@airauth/next/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Your providers here
  ],
  session: {
    strategy: "database",
  },
}`,

    mongodb: `// Using MongoDB Adapter
import { MongoDBAdapter } from "@airauth/next/mongodb-adapter"
import { MongoClient } from "mongodb"

const client = new MongoClient(process.env.MONGODB_URI!)
const clientPromise = client.connect()

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    // Your providers here
  ],
  session: {
    strategy: "database",
  },
}`,

    custom: `// Creating a Custom Adapter
import type { Adapter, AdapterUser, AdapterAccount, AdapterSession } from "@airauth/next/adapters"

export function CustomAdapter(client: any): Adapter {
  return {
    async createUser(user) {
      // Create user in your database
      const newUser = await client.user.create({
        data: {
          email: user.email,
          name: user.name,
          image: user.image,
        },
      })
      return {
        id: newUser.id.toString(),
        email: newUser.email!,
        emailVerified: newUser.emailVerified,
        name: newUser.name,
        image: newUser.image,
      }
    },

    async getUser(id) {
      // Get user by ID
      const user = await client.user.findUnique({ where: { id } })
      if (!user) return null
      
      return {
        id: user.id.toString(),
        email: user.email!,
        emailVerified: user.emailVerified,
        name: user.name,
        image: user.image,
      }
    },

    async getUserByEmail(email) {
      // Get user by email
      const user = await client.user.findUnique({ where: { email } })
      if (!user) return null
      
      return {
        id: user.id.toString(),
        email: user.email!,
        emailVerified: user.emailVerified,
        name: user.name,
        image: user.image,
      }
    },

    async createSession(session) {
      // Create session
      const newSession = await client.session.create({
        data: {
          expires: session.expires,
          sessionToken: session.sessionToken,
          userId: session.userId,
        },
      })
      return {
        expires: newSession.expires,
        sessionToken: newSession.sessionToken,
        userId: newSession.userId,
      }
    },

    async getSessionAndUser(sessionToken) {
      // Get session and user
      const sessionAndUser = await client.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      })
      
      if (!sessionAndUser) return null
      
      return {
        session: {
          expires: sessionAndUser.expires,
          sessionToken: sessionAndUser.sessionToken,
          userId: sessionAndUser.userId,
        },
        user: {
          id: sessionAndUser.user.id.toString(),
          email: sessionAndUser.user.email!,
          emailVerified: sessionAndUser.user.emailVerified,
          name: sessionAndUser.user.name,
          image: sessionAndUser.user.image,
        },
      }
    },

    async updateUser(user) {
      // Update user
      const updatedUser = await client.user.update({
        where: { id: user.id },
        data: user,
      })
      
      return {
        id: updatedUser.id.toString(),
        email: updatedUser.email!,
        emailVerified: updatedUser.emailVerified,
        name: updatedUser.name,
        image: updatedUser.image,
      }
    },

    async deleteSession(sessionToken) {
      // Delete session
      await client.session.delete({ where: { sessionToken } })
    },

    async linkAccount(account) {
      // Link account
      await client.account.create({ data: account })
    },

    async unlinkAccount(partialAccount) {
      // Unlink account
      await client.account.delete({
        where: {
          provider_providerAccountId: {
            provider: partialAccount.provider,
            providerAccountId: partialAccount.providerAccountId,
          },
        },
      })
    },
  }
}`,
  };

  const supportedDatabases = [
    { name: 'PostgreSQL', adapter: 'Prisma, Custom', icon: '🐘' },
    { name: 'MySQL', adapter: 'Prisma, Custom', icon: '🐬' },
    { name: 'SQLite', adapter: 'Prisma, Custom', icon: '🪶' },
    { name: 'MongoDB', adapter: 'MongoDB Adapter', icon: '🍃' },
    { name: 'DynamoDB', adapter: 'DynamoDB Adapter', icon: '⚡' },
    { name: 'Firebase', adapter: 'Firebase Adapter', icon: '🔥' },
    { name: 'FaunaDB', adapter: 'FaunaDB Adapter', icon: '🦋' },
    { name: 'Supabase', adapter: 'Supabase Adapter', icon: '⚡' },
  ];

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl'>
            <Database className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Database Adapters</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Connect @airauth/next to your database of choice with built-in adapters or create custom
          ones.
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
            Database adapters allow @airauth/next to persist user accounts, sessions, and
            verification tokens in your database. This enables features like account linking,
            session management, and email verification.
          </p>
        </div>
      </motion.section>

      {/* Supported Databases */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-6'>
          Supported Databases
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {supportedDatabases.map((db, index) => (
            <motion.div
              key={db.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className='p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg'
            >
              <div className='text-2xl mb-2'>{db.icon}</div>
              <h3 className='font-medium text-slate-900 dark:text-white'>{db.name}</h3>
              <p className='text-xs text-slate-600 dark:text-slate-400'>{db.adapter}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Prisma Adapter */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Prisma Adapter
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          The most popular adapter for SQL databases (PostgreSQL, MySQL, SQLite):
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.prisma, 'prisma')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'prisma' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.prisma}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* MongoDB Adapter */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          MongoDB Adapter
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>For MongoDB databases:</p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.mongodb, 'mongodb')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'mongodb' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.mongodb}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Custom Adapter */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Custom Adapter
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Create a custom adapter for your specific database or requirements:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.custom, 'custom')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'custom' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.custom}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Benefits */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Benefits of Database Sessions
        </h2>
        <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-6'>
          <ul className='space-y-3'>
            <li className='flex items-center gap-3'>
              <div className='w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-green-600 dark:text-green-400' />
              </div>
              <span className='text-slate-700 dark:text-slate-300'>
                Persistent user data across sessions
              </span>
            </li>
            <li className='flex items-center gap-3'>
              <div className='w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-green-600 dark:text-green-400' />
              </div>
              <span className='text-slate-700 dark:text-slate-300'>
                Account linking and unlinking
              </span>
            </li>
            <li className='flex items-center gap-3'>
              <div className='w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-green-600 dark:text-green-400' />
              </div>
              <span className='text-slate-700 dark:text-slate-300'>Email verification support</span>
            </li>
            <li className='flex items-center gap-3'>
              <div className='w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-green-600 dark:text-green-400' />
              </div>
              <span className='text-slate-700 dark:text-slate-300'>
                Session invalidation capabilities
              </span>
            </li>
            <li className='flex items-center gap-3'>
              <div className='w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-green-600 dark:text-green-400' />
              </div>
              <span className='text-slate-700 dark:text-slate-300'>
                Better audit trail and analytics
              </span>
            </li>
          </ul>
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
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Sessions</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Session strategies and management
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
                Advanced configuration options
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
          <a
            href='/docs/best-practices'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Best Practices</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Database and security best practices
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
