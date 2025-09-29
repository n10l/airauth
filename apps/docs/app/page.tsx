'use client';

import { motion } from 'framer-motion';
import {
  BookOpen,
  Rocket,
  Shield,
  Code2,
  Cloud,
  Settings,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

const sections = [
  {
    title: 'Getting Started',
    description: 'Quick setup and configuration guides',
    icon: Rocket,
    color: 'from-blue-600 to-cyan-600',
    links: [
      { label: 'Installation', href: '/installation' },
      { label: 'Configuration', href: '/configuration' },
      { label: 'Providers', href: '/providers' },
    ],
  },
  {
    title: 'Core Concepts',
    description: 'Understand the fundamentals',
    icon: BookOpen,
    color: 'from-purple-600 to-pink-600',
    links: [
      { label: 'JWT Tokens', href: '/jwt-tokens' },
      { label: 'Sessions', href: '/sessions' },
      { label: 'Protected Routes', href: '/protected-routes' },
      { label: 'Middleware', href: '/middleware' },
    ],
  },
  {
    title: 'Authentication',
    description: 'Secure authentication methods',
    icon: Shield,
    color: 'from-green-600 to-emerald-600',
    links: [
      { label: 'Database Adapters', href: '/database-adapters' },
      { label: 'OAuth Flow', href: '/oauth-flow' },
      { label: 'Credentials', href: '/credentials' },
      { label: 'Multi-Factor Auth', href: '/multi-factor' },
    ],
  },
  {
    title: 'API Reference',
    description: 'Complete API documentation',
    icon: Code2,
    color: 'from-orange-600 to-red-600',
    links: [
      { label: 'API Routes', href: '/api-routes' },
      { label: 'Server Components', href: '/server-components' },
      { label: 'Client Components', href: '/client-components' },
      { label: 'Next.js Config', href: '/nextjs-config' },
    ],
  },
  {
    title: 'Deployment',
    description: 'Deploy to production',
    icon: Cloud,
    color: 'from-indigo-600 to-blue-600',
    links: [
      { label: 'Vercel', href: '/vercel' },
      { label: 'Netlify', href: '/netlify' },
      { label: 'Self-Hosted', href: '/self-hosted' },
    ],
  },
  {
    title: 'Advanced',
    description: 'Advanced features and customization',
    icon: Settings,
    color: 'from-slate-600 to-slate-800',
    links: [
      { label: 'Custom Pages', href: '/custom-pages' },
      { label: 'Rate Limiting', href: '/rate-limiting' },
      { label: 'Webhooks', href: '/webhooks' },
      { label: 'Monitoring', href: '/monitoring' },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto'>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center mb-12'
      >
        <h1 className='text-4xl font-bold text-slate-900 dark:text-white mb-4'>Documentation</h1>
        <p className='text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto'>
          Everything you need to integrate @airauth/next into your Next.js application. From quick
          starts to advanced configurations.
        </p>
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-12'
      >
        <Link
          href='/installation'
          className='group p-6 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl hover:scale-105 transition-transform'
        >
          <Rocket className='w-8 h-8 text-orange-600 mb-3' />
          <h3 className='font-semibold text-slate-900 dark:text-white mb-1'>Quick Start</h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-2'>
            Get up and running in 5 minutes
          </p>
          <span className='text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1'>
            Start now <ArrowRight className='w-3 h-3' />
          </span>
        </Link>

        <Link
          href='/providers'
          className='group p-6 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl hover:scale-105 transition-transform'
        >
          <Shield className='w-8 h-8 text-blue-600 mb-3' />
          <h3 className='font-semibold text-slate-900 dark:text-white mb-1'>Providers</h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-2'>
            20+ authentication providers
          </p>
          <span className='text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1'>
            View all <ArrowRight className='w-3 h-3' />
          </span>
        </Link>

        <Link
          href='/jwt-tokens'
          className='group p-6 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl hover:scale-105 transition-transform'
        >
          <Code2 className='w-8 h-8 text-purple-600 mb-3' />
          <h3 className='font-semibold text-slate-900 dark:text-white mb-1'>Examples</h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-2'>
            Ready-to-use code examples
          </p>
          <span className='text-sm text-purple-600 dark:text-purple-400 flex items-center gap-1'>
            Browse <ArrowRight className='w-3 h-3' />
          </span>
        </Link>
      </motion.div>

      {/* Main Sections */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className='bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6'
          >
            <div className='flex items-start gap-4 mb-4'>
              <div className={`p-3 bg-gradient-to-br ${section.color} rounded-xl`}>
                <section.icon className='w-6 h-6 text-white' />
              </div>
              <div>
                <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>
                  {section.title}
                </h2>
                <p className='text-sm text-slate-600 dark:text-slate-400'>{section.description}</p>
              </div>
            </div>
            <ul className='space-y-2'>
              {section.links.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className='flex items-center justify-between px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors'
                  >
                    <span>{link.label}</span>
                    <ArrowRight className='w-3 h-3' />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className='mt-12 p-6 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl'
      >
        <div className='flex items-start gap-4'>
          <AlertCircle className='w-6 h-6 text-slate-600 dark:text-slate-400 mt-1' />
          <div>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-2'>Need Help?</h3>
            <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
              Can't find what you're looking for? We're here to help!
            </p>
            <div className='flex gap-3'>
              <a
                href='https://github.com/n10l/airauth/discussions'
                className='px-4 py-2 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors'
              >
                Community Forum
              </a>
              <a
                href='https://github.com/n10l/airauth/issues'
                className='px-4 py-2 bg-slate-900 dark:bg-white text-sm font-medium text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors'
              >
                Report Issue
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
