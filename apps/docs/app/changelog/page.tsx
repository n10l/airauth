'use client';

import { motion } from 'framer-motion';
import {
  History,
  Sparkles,
  Zap,
  Shield,
  Bug,
  Package,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';

export default function ChangelogPage() {
  const releases = [
    {
      version: '3.0.0',
      date: 'January 15, 2025',
      type: 'major',
      highlights: [
        'Complete rewrite with Next.js 14 App Router support',
        'Built-in TypeScript support with improved type safety',
        'New adapter system for databases',
        'Enhanced security with automatic CSRF protection',
      ],
      breaking: [
        'Migrated from Pages Router to App Router',
        'Changed API route structure',
        'Updated session handling methods',
      ],
      features: [
        'Added support for 10+ new OAuth providers',
        'Implemented refresh token rotation',
        'Added multi-factor authentication support',
        'New customizable UI components',
      ],
      fixes: [
        'Fixed memory leak in session management',
        'Resolved race condition in concurrent auth requests',
        'Fixed edge runtime compatibility issues',
      ],
    },
    {
      version: '2.5.0',
      date: 'December 1, 2024',
      type: 'minor',
      highlights: [
        'Added WebAuthn support',
        'Improved performance with lazy loading',
        'Enhanced debugging capabilities',
      ],
      features: [
        'WebAuthn/Passkey authentication',
        'Session analytics dashboard',
        'Rate limiting middleware',
        'Custom error pages',
      ],
      fixes: [
        'Fixed Safari cookie issues',
        'Resolved OAuth callback URL validation',
        'Fixed TypeScript declaration files',
      ],
    },
    {
      version: '2.4.3',
      date: 'November 15, 2024',
      type: 'patch',
      fixes: [
        'Security patch for JWT validation',
        'Fixed email provider template issues',
        'Resolved database adapter connection pooling',
      ],
    },
    {
      version: '2.4.0',
      date: 'October 20, 2024',
      type: 'minor',
      highlights: ['Database performance improvements', 'New authentication events system'],
      features: [
        'Event hooks for authentication lifecycle',
        'Prisma adapter optimizations',
        'Custom session strategies',
      ],
      fixes: ['Fixed MongoDB adapter issues', 'Resolved Next.js 13.5 compatibility'],
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'major':
        return <Sparkles className='w-5 h-5 text-purple-600' />;
      case 'minor':
        return <Zap className='w-5 h-5 text-blue-600' />;
      case 'patch':
        return <Shield className='w-5 h-5 text-green-600' />;
      default:
        return <Package className='w-5 h-5 text-slate-600' />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'major':
        return 'from-purple-600 to-pink-600';
      case 'minor':
        return 'from-blue-600 to-cyan-600';
      case 'patch':
        return 'from-green-600 to-emerald-600';
      default:
        return 'from-slate-600 to-slate-700';
    }
  };

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl'>
            <History className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Changelog</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Track all the updates, improvements, and fixes in @airauth/next.
        </p>
      </motion.div>

      {/* Version Timeline */}
      <div className='relative'>
        {/* Timeline Line */}
        <div className='absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700' />

        {/* Releases */}
        {releases.map((release, index) => (
          <motion.div
            key={release.version}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className='relative mb-12'
          >
            {/* Timeline Dot */}
            <div className='absolute left-5 w-6 h-6 bg-white dark:bg-slate-900 rounded-full border-4 border-slate-200 dark:border-slate-700 flex items-center justify-center'>
              <div
                className={`w-2 h-2 bg-gradient-to-br ${getTypeColor(release.type)} rounded-full`}
              />
            </div>

            {/* Content */}
            <div className='ml-16'>
              {/* Version Header */}
              <div className='flex items-start justify-between mb-3'>
                <div>
                  <div className='flex items-center gap-3 mb-1'>
                    <h2 className='text-2xl font-bold text-slate-900 dark:text-white'>
                      v{release.version}
                    </h2>
                    <span
                      className={`px-2 py-1 text-xs font-semibold text-white bg-gradient-to-r ${getTypeColor(release.type)} rounded-full`}
                    >
                      {release.type.toUpperCase()}
                    </span>
                  </div>
                  <p className='text-sm text-slate-500 dark:text-slate-400'>
                    Released on {release.date}
                  </p>
                </div>
                {getTypeIcon(release.type)}
              </div>

              {/* Highlights */}
              {release.highlights && (
                <div className='mb-4'>
                  <h3 className='font-semibold text-slate-900 dark:text-white mb-2'>Highlights</h3>
                  <ul className='space-y-1'>
                    {release.highlights.map((highlight, i) => (
                      <li
                        key={i}
                        className='flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400'
                      >
                        <CheckCircle className='w-4 h-4 text-green-600 mt-0.5' />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Breaking Changes */}
              {release.breaking && (
                <div className='mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
                  <h3 className='font-semibold text-red-900 dark:text-red-400 mb-2 flex items-center gap-2'>
                    <AlertTriangle className='w-4 h-4' />
                    Breaking Changes
                  </h3>
                  <ul className='space-y-1'>
                    {release.breaking.map((change, i) => (
                      <li key={i} className='text-sm text-red-800 dark:text-red-300 ml-6'>
                        • {change}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* New Features */}
              {release.features && (
                <div className='mb-4'>
                  <h3 className='font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2'>
                    <Sparkles className='w-4 h-4 text-purple-600' />
                    New Features
                  </h3>
                  <ul className='space-y-1'>
                    {release.features.map((feature, i) => (
                      <li key={i} className='text-sm text-slate-600 dark:text-slate-400 ml-6'>
                        • {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bug Fixes */}
              {release.fixes && (
                <div className='mb-4'>
                  <h3 className='font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2'>
                    <Bug className='w-4 h-4 text-green-600' />
                    Bug Fixes
                  </h3>
                  <ul className='space-y-1'>
                    {release.fixes.map((fix, i) => (
                      <li key={i} className='text-sm text-slate-600 dark:text-slate-400 ml-6'>
                        • {fix}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Migration Guide Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className='mt-12 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800'
      >
        <div className='flex items-start gap-3'>
          <Info className='w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5' />
          <div>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-2'>Upgrading?</h3>
            <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
              Check out our migration guide for detailed upgrade instructions and breaking change
              details.
            </p>
            <a
              href='/docs/migration-guide'
              className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors'
            >
              View Migration Guide
              <Sparkles className='w-4 h-4' />
            </a>
          </div>
        </div>
      </motion.div>

      {/* Older Versions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className='mt-12'
      >
        <h2 className='text-xl font-semibold text-slate-900 dark:text-white mb-4'>
          Older Versions
        </h2>
        <div className='space-y-2'>
          <a
            href='https://github.com/n10l/airauth/releases'
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>v2.x.x Releases</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                View all v2 releases on GitHub
              </p>
            </div>
            <Package className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='https://github.com/n10l/airauth/releases?q=v1'
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>v1.x.x Releases</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Legacy v1 releases (deprecated)
              </p>
            </div>
            <Package className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.div>
    </div>
  );
}
